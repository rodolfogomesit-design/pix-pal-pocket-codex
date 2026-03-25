import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddKid } from "@/hooks/useDashboard";
import { toast } from "sonner";
import { z } from "zod";
import { Plus } from "lucide-react";

const kidSchema = z.object({
  nome: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(50),
  pin: z.string().length(4, "PIN deve ter exatamente 4 dígitos").regex(/^\d+$/, "PIN deve conter apenas números"),
});

const AddKidDialog = () => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", pin: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const addKid = useAddKid();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (e.target.name === "nome") {
      value = value
        .toLowerCase()
        .replace(/(^|\s)\S/g, (c) => c.toUpperCase());
    }
    if (e.target.name === "pin") {
      value = value.replace(/\D/g, "").slice(0, 4);
    }
    setForm({ ...form, [e.target.name]: value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = kidSchema.safeParse(form);

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      const result = await addKid.mutateAsync({
        nome: parsed.data.nome,
        idade: 0,
        pin: parsed.data.pin,
      });
      const codigo = (result as any)?.codigo_publico || "";
      toast.success(`${parsed.data.nome} cadastrado(a) com sucesso! Código: ${codigo} 🎉`);
      setForm({ nome: "", pin: "" });
      setOpen(false);
    } catch {
      toast.error("Erro ao cadastrar filho.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-display font-bold rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
          <Plus size={20} />
          Cadastrar filho
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Cadastrar filho 👧</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label className="font-body font-semibold">Nome *</Label>
            <Input name="nome" value={form.nome} onChange={handleChange} placeholder="Nome da criança" className="rounded-xl mt-1" />
            {errors.nome && <p className="text-sm text-destructive mt-1">{errors.nome}</p>}
          </div>
          <div>
            <Label className="font-body font-semibold">PIN infantil * (4 dígitos)</Label>
            <Input name="pin" type="password" maxLength={4} value={form.pin} onChange={handleChange} placeholder="****" className="rounded-xl mt-1" />
            {errors.pin && <p className="text-sm text-destructive mt-1">{errors.pin}</p>}
          </div>
          <p className="text-xs text-muted-foreground">O código do usuário será gerado automaticamente pela plataforma.</p>
          <Button type="submit" disabled={addKid.isPending} className="w-full font-display font-bold rounded-xl py-5 bg-kids-green text-accent-foreground hover:bg-kids-green/90">
            {addKid.isPending ? "Cadastrando..." : "✅ Cadastrar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddKidDialog;
