import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { KidProfile } from "@/hooks/useDashboard";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDownToLine, Printer } from "lucide-react";
import { printReceipt } from "@/lib/printReceipt";

interface Props {
  kid: KidProfile;
}

const RescueAllowanceDialog = ({ kid }: Props) => {
  const [open, setOpen] = useState(false);
  const [valor, setValor] = useState("");
  const [loading, setLoading] = useState(false);
  const [successAmount, setSuccessAmount] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const reset = () => {
    setValor("");
    setSuccessAmount(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(valor);
    if (!amount || amount <= 0) {
      toast.error("Informe um valor válido.");
      return;
    }
    if (amount > kid.saldo) {
      toast.error("Valor maior que o saldo do filho.");
      return;
    }

    setLoading(true);
    const { data, error } = await (supabase.rpc as any)("rescue_allowance", {
      _kid_id: kid.id,
      _valor: amount,
    });
    if (error) {
      toast.error("Erro ao resgatar mesada.");
    } else {
      const result = data as any;
      if (!result?.success) {
        toast.error(result?.error || "Erro ao resgatar.");
      } else {
        queryClient.invalidateQueries({ queryKey: ["kids"] });
        queryClient.invalidateQueries({ queryKey: ["parent-balance"] });
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        setSuccessAmount(amount);
      }
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl gap-1 font-body">
          <ArrowDownToLine size={14} /> Resgatar
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl max-w-md">
        {successAmount === null ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-xl">
                Resgatar mesada de {kid.apelido || kid.nome} 
              </DialogTitle>
            </DialogHeader>
            <div className="bg-kids-blue-light rounded-2xl p-4 text-center mb-2">
              <p className="font-body text-xs text-muted-foreground">Saldo do filho</p>
              <p className="font-display text-xl font-bold text-primary">R$ {kid.saldo.toFixed(2)}</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="font-body font-semibold">Valor a resgatar *</Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-display font-bold text-lg">R$</span>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder="0,00"
                    className="rounded-xl"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full font-display font-bold rounded-xl py-5 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading ? "Resgatando..." : " Confirmar resgate"}
              </Button>
            </form>
          </>
        ) : (
          <div className="space-y-4 py-2">
            <div className="text-center">
              <span className="text-5xl block mb-3"></span>
              <p className="font-display text-xl font-bold">Resgate realizado!</p>
              <p className="font-display text-2xl font-extrabold text-primary mt-2">
                R$ {successAmount.toFixed(2)}
              </p>
              <p className="font-body text-sm text-muted-foreground mt-1">
                resgatado de <span className="font-bold">{kid.apelido || kid.nome}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => printReceipt({
                  tipo: "mesada",
                  valor: successAmount,
                  data: new Date(),
                  de: kid.apelido || kid.nome,
                  status: "aprovado",
                  descricao: "Resgate de mesada",
                })}
                variant="outline"
                className="flex-1 rounded-xl font-display font-bold py-5"
              >
                <Printer size={16} className="mr-2" /> Comprovante
              </Button>
              <Button
                onClick={() => { setOpen(false); reset(); }}
                className="flex-1 rounded-xl font-display font-bold py-5 bg-primary text-primary-foreground"
              >
                Fechar 
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RescueAllowanceDialog;
