import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Printer, Star, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import KidBottomNav from "@/components/kid-dashboard/KidBottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useKidAuth } from "@/contexts/KidAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { printReceipt } from "@/lib/printReceipt";

type Step = "inicio" | "confirmar" | "sucesso";

interface Contact {
  id: string;
  contact_codigo: string;
  contact_nome: string;
  contact_type: string;
}

const KidPagar = () => {
  const { kid, setKid } = useKidAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("inicio");
  const [codigo, setCodigo] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientType, setRecipientType] = useState("");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [successInfo, setSuccessInfo] = useState<{ toName: string; amount: number; needsApproval: boolean } | null>(null);

  const loadContacts = useCallback(async () => {
    if (!kid) return;

    setLoadingContacts(true);
    const { data } = await supabase.rpc("kid_get_contacts", { _kid_id: kid.id });
    setLoadingContacts(false);

    if (data) {
      setContacts(data as Contact[]);
    }
  }, [kid]);

  useEffect(() => {
    if (!kid) {
      navigate("/crianca");
      return;
    }

    void loadContacts();
  }, [kid, loadContacts, navigate]);

  const handleLookup = async () => {
    if (codigo.length !== 5) {
      toast.error("Código deve ter 5 dígitos!");
      return;
    }

    if (codigo === kid?.codigo_publico) {
      toast.error("Você não pode pagar para si mesmo!");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.rpc("lookup_by_code", { _codigo: codigo });
    setLoading(false);

    if (error) {
      toast.error("Erro ao buscar código.");
      return;
    }

    const result = data as { success: boolean; error?: string; nome?: string; type?: string };
    if (!result.success) {
      toast.error(result.error || "Código não encontrado");
      return;
    }

    setRecipientName(result.nome || "");
    setRecipientType(result.type || "");
    setStep("confirmar");
  };

  const handleSelectContact = (contact: Contact) => {
    setCodigo(contact.contact_codigo);
    setRecipientName(contact.contact_nome);
    setRecipientType(contact.contact_type);
    setStep("confirmar");
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!kid) return;

    await supabase.rpc("kid_delete_contact", {
      _kid_id: kid.id,
      _contact_id: contactId,
    });

    toast.success("Contato removido!");
    void loadContacts();
  };

  const handleConfirm = async () => {
    const amount = parseFloat(valor);
    if (!amount || amount <= 0) {
      toast.error("Valor inválido!");
      return;
    }

    if (amount > (kid?.saldo || 0)) {
      toast.error("Saldo insuficiente!");
      return;
    }

    if (!kid) return;

    setLoading(true);
    const { data, error } = await supabase.rpc("kid_transfer", {
      _from_kid_id: kid.id,
      _to_codigo: codigo,
      _valor: amount,
      _descricao: descricao || "Pagamento",
    });
    setLoading(false);

    if (error) {
      toast.error("Erro ao transferir.");
      return;
    }

    const result = data as { success: boolean; error?: string; needs_approval?: boolean; to_name?: string };
    if (!result.success) {
      toast.error(result.error || "Erro na transferência");
      return;
    }

    setKid({ ...kid, saldo: kid.saldo - amount });

    const alreadySaved = contacts.some((contact) => contact.contact_codigo === codigo);
    if (!alreadySaved) {
      await supabase.rpc("kid_save_contact_no_pin" as never, {
        _kid_id: kid.id,
        _contact_codigo: codigo,
        _contact_nome: recipientName,
        _contact_type: recipientType,
      });
    }

    setSuccessInfo({
      toName: result.to_name || recipientName,
      amount,
      needsApproval: !!result.needs_approval,
    });
    setStep("sucesso");
  };

  if (!kid) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-kids-blue-light to-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => (step === "inicio" ? navigate("/crianca/dashboard") : setStep("inicio"))}
              className="text-muted-foreground hover:text-primary"
            >
              <ArrowLeft size={22} />
            </button>
            <span className="text-2xl">💸</span>
            <span className="font-display text-xl font-bold text-primary">Pagar</span>
          </div>
          <button
            onClick={() => navigate("/crianca/dashboard")}
            className="flex items-center gap-1 text-xs font-body text-muted-foreground hover:text-primary"
          >
            <Home size={16} /> Início
          </button>
        </div>
      </header>

      <main className="container mx-auto max-w-md px-4 py-6 pb-24">
        <AnimatePresence mode="wait">
          {step === "inicio" && (
            <motion.div
              key="inicio"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="space-y-4 rounded-3xl border border-border bg-card p-6">
                <h3 className="text-center font-display text-xl font-bold">Código do amigo</h3>
                <Input
                  value={codigo}
                  onChange={(event) => setCodigo(event.target.value.replace(/\D/g, "").slice(0, 5))}
                  placeholder="12345"
                  className="h-14 rounded-2xl border-2 border-primary/20 bg-kids-blue-light text-center font-display text-2xl font-bold tracking-[0.3em]"
                  maxLength={5}
                  autoFocus
                />
                <Button
                  onClick={handleLookup}
                  disabled={loading || codigo.length !== 5}
                  className="w-full rounded-2xl bg-primary py-6 text-lg font-display font-bold text-primary-foreground shadow-lg"
                >
                  {loading ? "Buscando..." : "Buscar"}
                </Button>
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
                  <Star size={18} className="text-kids-yellow" />
                  Contatos salvos
                </h3>

                {loadingContacts ? (
                  <div className="rounded-2xl border border-border bg-card p-6 text-center">
                    <p className="font-body text-muted-foreground">Carregando...</p>
                  </div>
                ) : contacts.length === 0 ? (
                  <div className="rounded-2xl border border-border bg-card p-6 text-center">
                    <span className="mb-2 block text-3xl">📇</span>
                    <p className="font-body text-sm text-muted-foreground">
                      Nenhum contato salvo ainda. Depois do primeiro pagamento, o contato é salvo automaticamente.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
                      >
                        <button onClick={() => handleSelectContact(contact)} className="flex flex-1 items-center gap-3 text-left">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-kids-yellow-light text-lg">
                            {contact.contact_type === "kid" ? "👧" : "👨‍👩‍👧"}
                          </div>
                          <div>
                            <p className="font-display text-sm font-bold">{contact.contact_nome}</p>
                            <p className="font-body text-xs text-muted-foreground">ID: {contact.contact_codigo}</p>
                          </div>
                        </button>
                        <button
                          onClick={() => handleDeleteContact(contact.id)}
                          className="rounded-xl p-2 text-muted-foreground transition-colors hover:text-destructive"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {step === "confirmar" && (
            <motion.div
              key="confirmar"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="rounded-3xl bg-kids-green-light p-5 text-center">
                <p className="font-body text-xs text-muted-foreground">Enviar para</p>
                <p className="mt-1 font-display text-2xl font-bold">{recipientName}</p>
                <p className="mt-1 font-body text-xs text-muted-foreground">
                  {recipientType === "kid" ? "Criança" : "Responsável"} • ID: {codigo}
                </p>
              </div>

              <div className="space-y-4 rounded-3xl border border-border bg-card p-6">
                <div>
                  <Label className="text-sm font-display font-bold">Quanto?</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={valor}
                    onChange={(event) => setValor(event.target.value)}
                    placeholder="10.00"
                    className="mt-1 h-14 rounded-2xl border-2 border-accent/20 bg-kids-green-light text-center font-display text-2xl font-bold"
                    autoFocus
                  />
                  <p className="mt-1 text-center font-body text-xs text-muted-foreground">
                    Saldo disponível: R$ {kid.saldo.toFixed(2)}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-display font-bold">Mensagem (opcional)</Label>
                  <Input
                    value={descricao}
                    onChange={(event) => setDescricao(event.target.value.slice(0, 50))}
                    placeholder="Obrigado!"
                    className="mt-1 h-10 rounded-2xl"
                    maxLength={50}
                  />
                </div>

                <Button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="w-full rounded-2xl bg-kids-green py-6 text-lg font-display font-bold text-accent-foreground shadow-lg"
                >
                  {loading ? "Pagando..." : "Confirmar e pagar"}
                </Button>
              </div>
            </motion.div>
          )}

          {step === "sucesso" && successInfo && (
            <motion.div
              key="sucesso"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-6"
            >
              <div className="rounded-3xl bg-kids-green-light p-8 text-center">
                <span className="mb-4 block text-6xl">{successInfo.needsApproval ? "⏳" : "✅"}</span>
                <p className="font-display text-2xl font-bold">
                  {successInfo.needsApproval ? "Enviado para aprovação!" : "Pagamento realizado!"}
                </p>
                <p className="mt-3 font-display text-3xl font-extrabold text-primary">
                  R$ {successInfo.amount.toFixed(2)}
                </p>
                <p className="mt-2 text-sm font-body text-muted-foreground">
                  para <span className="font-bold">{successInfo.toName}</span>
                </p>
                {successInfo.needsApproval && (
                  <p className="mt-2 font-body text-xs text-muted-foreground">Seus pais precisam aprovar este pagamento.</p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() =>
                    printReceipt({
                      tipo: "pagamento",
                      valor: successInfo.amount,
                      data: new Date(),
                      para: successInfo.toName,
                      de: kid.apelido || kid.nome,
                      status: successInfo.needsApproval ? "pendente" : "aprovado",
                      descricao: descricao || "Pagamento",
                    })
                  }
                  variant="outline"
                  className="flex-1 rounded-2xl py-6 font-display font-bold"
                >
                  <Printer size={18} className="mr-2" /> Comprovante
                </Button>
                <Button
                  onClick={() => navigate("/crianca/dashboard")}
                  className="flex-1 rounded-2xl bg-primary py-6 text-lg font-display font-bold text-primary-foreground shadow-lg"
                >
                  Início
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <KidBottomNav />
    </div>
  );
};

export default KidPagar;
