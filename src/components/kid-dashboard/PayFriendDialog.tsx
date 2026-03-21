import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { KidSession } from "@/contexts/KidAuthContext";

interface Props {
  kid: KidSession;
  onSuccess: () => void;
}

type Step = "codigo" | "confirmar" | "pin";

const PayFriendDialog = ({ kid, onSuccess }: Props) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("codigo");
  const [codigo, setCodigo] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientType, setRecipientType] = useState("");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setStep("codigo");
    setCodigo("");
    setRecipientName("");
    setRecipientType("");
    setValor("");
    setDescricao("");
    setPin("");
  };

  const handleLookup = async () => {
    if (codigo.length !== 5) {
      toast.error("Código deve ter 5 dígitos!");
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

  const handleConfirm = () => {
    const amount = parseFloat(valor);
    if (!amount || amount <= 0) {
      toast.error("Valor inválido!");
      return;
    }
    if (amount > kid.saldo) {
      toast.error("Saldo insuficiente! 😢");
      return;
    }
    setStep("pin");
  };

  const handleTransfer = async () => {
    if (pin.length !== 4) {
      toast.error("PIN deve ter 4 dígitos!");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.rpc("kid_transfer_with_pin", {
      _from_kid_id: kid.id,
      _to_codigo: codigo,
      _valor: parseFloat(valor),
      _pin: pin,
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
      if (result.error === "PIN incorreto") setPin("");
      return;
    }

    if (result.needs_approval) {
      toast.success(`Pagamento para ${result.to_name} enviado para aprovação! ⏳`);
    } else {
      toast.success(`R$ ${parseFloat(valor).toFixed(2)} pago para ${result.to_name}! 🎉`);
    }

    reset();
    setOpen(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <button className="bg-kids-yellow-light rounded-2xl p-5 text-center transition-all hover:scale-[1.03] active:scale-95">
          <span className="text-3xl block mb-2">📱</span>
          <span className="font-display font-bold text-sm">Pagar</span>
        </button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl border-2 border-primary/20 max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-center">
            {step === "codigo" && "Pagar um amigo 💸"}
            {step === "confirmar" && "Confirmar pagamento 📋"}
            {step === "pin" && "Digite seu PIN 🔑"}
          </DialogTitle>
        </DialogHeader>

        {step === "codigo" && (
          <div className="space-y-4">
            <div>
              <Label className="font-display font-bold text-sm">Código do amigo 🔢</Label>
              <Input
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 5))}
                placeholder="12345"
                className="rounded-2xl mt-1 text-center text-xl font-display font-bold tracking-[0.3em] h-12 bg-kids-blue-light border-2 border-primary/20"
                maxLength={5}
              />
            </div>
            <Button
              onClick={handleLookup}
              disabled={loading || codigo.length !== 5}
              className="w-full font-display font-bold text-lg rounded-2xl py-6 bg-primary text-primary-foreground shadow-lg"
            >
              {loading ? "Buscando..." : "🔍 Buscar"}
            </Button>
          </div>
        )}

        {step === "confirmar" && (
          <div className="space-y-4">
            <div className="bg-kids-green-light rounded-2xl p-4 text-center">
              <p className="font-body text-xs text-muted-foreground">Enviar para</p>
              <p className="font-display text-xl font-bold mt-1">{recipientName}</p>
              <p className="font-body text-xs text-muted-foreground mt-1">
                {recipientType === "kid" ? "👧 Criança" : "👨‍👩‍👧 Responsável"} • ID: {codigo}
              </p>
            </div>

            <div>
              <Label className="font-display font-bold text-sm">Quanto? 💰</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="10.00"
                className="rounded-2xl mt-1 text-center text-xl font-display font-bold h-12 bg-kids-green-light border-2 border-accent/20"
              />
              <p className="font-body text-xs text-muted-foreground mt-1 text-center">
                Saldo disponível: R$ {kid.saldo.toFixed(2)}
              </p>
            </div>

            <div>
              <Label className="font-display font-bold text-sm">Mensagem (opcional) 💬</Label>
              <Input
                value={descricao}
                onChange={(e) => setDescricao(e.target.value.slice(0, 50))}
                placeholder="Obrigado!"
                className="rounded-2xl mt-1 h-10"
                maxLength={50}
              />
            </div>

            {kid.aprovacao_transferencias && (
              <p className="bg-kids-yellow-light rounded-xl px-3 py-2 font-body text-xs text-center">
                ⚠️ Seus pais precisam aprovar este pagamento
              </p>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("codigo")}
                className="flex-1 font-display font-bold rounded-2xl py-5"
              >
                ← Voltar
              </Button>
              <Button
                onClick={handleConfirm}
                className="flex-1 font-display font-bold rounded-2xl py-5 bg-primary text-primary-foreground shadow-lg"
              >
                Confirmar ✅
              </Button>
            </div>
          </div>
        )}

        {step === "pin" && (
          <div className="space-y-4">
            <div className="bg-kids-blue-light rounded-2xl p-4 text-center">
              <p className="font-body text-sm">Pagando <span className="font-display font-bold">{recipientName}</span></p>
              <p className="font-display text-2xl font-extrabold text-primary mt-1">R$ {parseFloat(valor).toFixed(2)}</p>
            </div>

            <div>
              <Label className="font-display font-bold text-sm text-center block">Digite seu PIN para confirmar 🔐</Label>
              <Input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="••••"
                className="rounded-2xl mt-2 text-center text-2xl font-display font-bold tracking-[0.5em] h-14 bg-kids-yellow-light border-2 border-kids-yellow/30"
                maxLength={4}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => { setStep("confirmar"); setPin(""); }}
                className="flex-1 font-display font-bold rounded-2xl py-5"
              >
                ← Voltar
              </Button>
              <Button
                onClick={handleTransfer}
                disabled={loading || pin.length !== 4}
                className="flex-1 font-display font-bold rounded-2xl py-5 bg-kids-green text-accent-foreground shadow-lg"
              >
                {loading ? "Pagando..." : "🚀 Pagar!"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PayFriendDialog;
