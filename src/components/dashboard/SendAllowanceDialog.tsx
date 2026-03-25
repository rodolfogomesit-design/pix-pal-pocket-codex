import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSendAllowance, useParentBalance } from "@/hooks/useDashboard";
import type { KidProfile } from "@/hooks/useDashboard";
import { toast } from "sonner";
import { z } from "zod";
import { Send, Printer } from "lucide-react";
import { printReceipt } from "@/lib/printReceipt";

const allowanceSchema = z.object({
  valor: z.number().positive("Valor deve ser maior que zero").max(10000, "Valor máximo é R$ 10.000"),
  descricao: z.string().trim().max(100).optional().or(z.literal("")),
});

interface Props {
  kid: KidProfile;
}

const SendAllowanceDialog = ({ kid }: Props) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ valor: "", descricao: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successInfo, setSuccessInfo] = useState<{ valor: number; descricao: string } | null>(null);
  const sendAllowance = useSendAllowance();
  const { data: parentBalance = 0 } = useParentBalance();

  const reset = () => {
    setForm({ valor: "", descricao: "" });
    setErrors({});
    setSuccessInfo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = allowanceSchema.safeParse({
      valor: form.valor ? parseFloat(form.valor) : undefined,
      descricao: form.descricao,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (kid.is_frozen) {
      toast.error("A conta está congelada. Descongele antes de enviar.");
      return;
    }

    try {
      await sendAllowance.mutateAsync({
        kidId: kid.id,
        valor: parsed.data.valor,
        descricao: parsed.data.descricao || undefined,
      });
      setSuccessInfo({
        valor: parsed.data.valor,
        descricao: parsed.data.descricao || "Mesada",
      });
    } catch (err: any) {
      toast.error(err?.message || "Erro ao enviar mesada. Tente novamente.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button className="w-full rounded-xl gap-2 font-display font-bold text-base py-5 bg-kids-yellow text-secondary-foreground hover:bg-kids-yellow/90 shadow-md">
          <Send size={14} /> Enviar mesada
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl max-w-md">
        {!successInfo ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-xl">
                Enviar mesada para {kid.apelido || kid.nome} 💸
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div className="bg-primary/10 rounded-2xl p-4 text-center">
                <p className="font-body text-xs text-muted-foreground">Seu saldo</p>
                <p className="font-display text-xl font-bold text-primary">
                  R$ {parentBalance.toFixed(2)}
                </p>
              </div>
              <div className="bg-kids-blue-light rounded-2xl p-4 text-center">
                <p className="font-body text-xs text-muted-foreground">Saldo do filho</p>
                <p className="font-display text-xl font-bold text-primary">
                  R$ {kid.saldo.toFixed(2)}
                </p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="font-body font-semibold">Valor *</Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-display font-bold text-lg">R$</span>
                  <Input
                    name="valor"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.valor}
                    onChange={(e) => { setForm({ ...form, valor: e.target.value }); setErrors({}); }}
                    placeholder="0,00"
                    className="rounded-xl"
                  />
                </div>
                {errors.valor && <p className="text-sm text-destructive mt-1">{errors.valor}</p>}
              </div>
              <div>
                <Label className="font-body font-semibold">Descrição</Label>
                <Input
                  name="descricao"
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Ex: Mesada semanal"
                  className="rounded-xl mt-1"
                />
              </div>
              <Button
                type="submit"
                disabled={sendAllowance.isPending}
                className="w-full font-display font-bold rounded-xl py-5 bg-kids-green text-accent-foreground hover:bg-kids-green/90"
              >
                {sendAllowance.isPending ? "Enviando..." : "💰 Enviar mesada"}
              </Button>
            </form>
          </>
        ) : (
          <div className="space-y-4 py-2">
            <div className="text-center">
              <span className="text-5xl block mb-3">✅</span>
              <p className="font-display text-xl font-bold">Mesada enviada!</p>
              <p className="font-display text-2xl font-extrabold text-primary mt-2">
                R$ {successInfo.valor.toFixed(2)}
              </p>
              <p className="font-body text-sm text-muted-foreground mt-1">
                para <span className="font-bold">{kid.apelido || kid.nome}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => printReceipt({
                  tipo: "mesada",
                  valor: successInfo.valor,
                  data: new Date(),
                  para: kid.apelido || kid.nome,
                  status: "aprovado",
                  descricao: successInfo.descricao,
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
                Fechar ✅
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SendAllowanceDialog;
