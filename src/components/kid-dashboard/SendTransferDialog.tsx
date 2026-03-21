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
import { Printer } from "lucide-react";
import { printReceipt } from "@/lib/printReceipt";
import type { KidSession } from "@/contexts/KidAuthContext";

interface Props {
  kid: KidSession;
  onSuccess: () => void;
}

const SendTransferDialog = ({ kid, onSuccess }: Props) => {
  const [open, setOpen] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{
    amount: number;
    toName: string;
    needsApproval: boolean;
    descricao: string;
  } | null>(null);

  const reset = () => {
    setCodigo("");
    setValor("");
    setDescricao("");
    setSuccessInfo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (codigo.length !== 5) {
      toast.error("Código deve ter 5 números!");
      return;
    }

    const amount = parseFloat(valor);
    if (!amount || amount <= 0) {
      toast.error("Valor inválido!");
      return;
    }

    if (amount > kid.saldo) {
      toast.error("Saldo insuficiente! 😢");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.rpc("kid_transfer", {
      _from_kid_id: kid.id,
      _to_codigo: codigo,
      _valor: amount,
      _descricao: descricao || "Transferência",
    });

    setLoading(false);

    if (error) {
      toast.error("Erro ao transferir. Tente novamente.");
      return;
    }

    const result = data as { success: boolean; error?: string; needs_approval?: boolean; to_name?: string };

    if (!result.success) {
      toast.error(result.error || "Erro na transferência");
      return;
    }

    setSuccessInfo({
      amount,
      toName: result.to_name || codigo,
      needsApproval: !!result.needs_approval,
      descricao: descricao || "Transferência",
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { reset(); if (successInfo) onSuccess(); } }}>
      <DialogTrigger asChild>
        <button
          className="bg-kids-blue-light rounded-2xl p-5 text-center transition-all hover:scale-[1.03] active:scale-95"
        >
          <span className="text-3xl block mb-2">👫</span>
          <span className="font-display font-bold text-sm">Enviar</span>
        </button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl border-2 border-primary/20 max-w-sm">
        {!successInfo ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-xl text-center">
                Enviar para amigo 👫
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="Feliz aniversário!"
                  className="rounded-2xl mt-1 h-10"
                  maxLength={50}
                />
              </div>

              {kid.aprovacao_transferencias && (
                <p className="bg-kids-yellow-light rounded-xl px-3 py-2 font-body text-xs text-center">
                  ⚠️ Seus pais precisam aprovar esta transferência
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full font-display font-bold text-lg rounded-2xl py-6 bg-primary text-primary-foreground shadow-lg"
              >
                {loading ? "Enviando... ✈️" : "🚀 Enviar!"}
              </Button>
            </form>
          </>
        ) : (
          <div className="space-y-4 py-2">
            <div className="text-center">
              <span className="text-5xl block mb-3">
                {successInfo.needsApproval ? "⏳" : "✅"}
              </span>
              <p className="font-display text-xl font-bold">
                {successInfo.needsApproval ? "Enviado para aprovação!" : "Transferência realizada!"}
              </p>
              <p className="font-display text-2xl font-extrabold text-primary mt-2">
                R$ {successInfo.amount.toFixed(2)}
              </p>
              <p className="font-body text-sm text-muted-foreground mt-1">
                para <span className="font-bold">{successInfo.toName}</span>
              </p>
              {successInfo.needsApproval && (
                <p className="font-body text-xs text-muted-foreground mt-2">
                  Seus pais precisam aprovar esta transferência
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => printReceipt({
                  tipo: "transferencia",
                  valor: successInfo.amount,
                  data: new Date(),
                  para: successInfo.toName,
                  de: kid.apelido || kid.nome,
                  status: successInfo.needsApproval ? "pendente" : "aprovado",
                  descricao: successInfo.descricao,
                })}
                variant="outline"
                className="flex-1 rounded-2xl font-display font-bold py-5"
              >
                <Printer size={16} className="mr-2" /> Comprovante
              </Button>
              <Button
                onClick={() => { setOpen(false); reset(); onSuccess(); }}
                className="flex-1 rounded-2xl font-display font-bold py-5 bg-primary text-primary-foreground"
              >
                Fechar ✅
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SendTransferDialog;
