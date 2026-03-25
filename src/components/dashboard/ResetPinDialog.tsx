import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateKid } from "@/hooks/useDashboard";
import type { KidProfile } from "@/hooks/useDashboard";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";

interface Props {
  kid: KidProfile;
}

const ResetPinDialog = ({ kid }: Props) => {
  const [open, setOpen] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const updateKid = useUpdateKid();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      toast.error("O PIN deve ter exatamente 4 dígitos.");
      return;
    }
    if (newPin !== confirmPin) {
      toast.error("Os PINs não coincidem.");
      return;
    }

    try {
      await updateKid.mutateAsync({ id: kid.id, pin: newPin });
      toast.success("PIN redefinido com sucesso! 🔑");
      setNewPin("");
      setConfirmPin("");
      setOpen(false);
    } catch {
      toast.error("Erro ao redefinir PIN.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl gap-1 font-body">
          <KeyRound size={14} /> Senha
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Redefinir senha de {kid.apelido || kid.nome} 🔑
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label className="font-body font-semibold">Novo PIN (4 dígitos)</Label>
            <Input
              type="password"
              maxLength={4}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="****"
              className="rounded-xl mt-1"
            />
          </div>
          <div>
            <Label className="font-body font-semibold">Confirmar PIN</Label>
            <Input
              type="password"
              maxLength={4}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="****"
              className="rounded-xl mt-1"
            />
          </div>
          <Button
            type="submit"
            disabled={updateKid.isPending}
            className="w-full font-display font-bold rounded-xl py-5 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {updateKid.isPending ? "Salvando..." : "🔑 Redefinir PIN"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ResetPinDialog;
