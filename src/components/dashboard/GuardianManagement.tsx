import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { UserPlus, Trash2, Users, Crown, Shield } from "lucide-react";

type Guardian = {
  id: string;
  user_id: string;
  nome: string | null;
  cpf: string | null;
  email: string | null;
  telefone: string | null;
  parentesco: string;
  codigo_usuario: string | null;
  created_at: string;
  tipo: "principal" | "secundario";
  added_by: string | null;
};

const PARENTESCO_OPTIONS = [
  { value: "pai", label: "👨 Pai" },
  { value: "mae", label: "👩 Mãe" },
  { value: "avo", label: "👴 Avô" },
  { value: "avoa", label: "👵 Avó" },
  { value: "tio", label: "👨 Tio" },
  { value: "tia", label: "👩 Tia" },
  { value: "outros", label: "👤 Outros" },
];

const parentescoLabel = (val: string) =>
  PARENTESCO_OPTIONS.find((o) => o.value === val)?.label || val;

const formatFullName = (value: string) =>
  value.toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());

const useGuardians = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["guardians", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_guardians_for_user");
      if (error) throw error;
      return (data as Guardian[]) || [];
    },
    enabled: !!user,
  });
};

const GuardianManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: guardians = [], isLoading } = useGuardians();
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    email: "",
    cpf: "",
    telefone: "",
    senha: "",
    parentesco: "outros",
  });

  const addGuardian = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("add_secondary_guardian", {
        _nome: form.nome,
        _email: form.email,
        _cpf: form.cpf || null,
        _telefone: form.telefone || null,
        _parentesco: form.parentesco,
        _senha: form.senha || null,
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Erro ao adicionar responsável.");
      return result;
    },
    onSuccess: () => {
      toast.success("Responsável adicionado com sucesso! 🎉");
      queryClient.invalidateQueries({ queryKey: ["guardians"] });
      setForm({ nome: "", email: "", cpf: "", telefone: "", senha: "", parentesco: "outros" });
      setOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const removeGuardian = useMutation({
    mutationFn: async (linkId: string) => {
      const { data, error } = await supabase.rpc("remove_secondary_guardian", {
        _link_id: linkId,
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Erro ao remover responsável.");
      return result;
    },
    onSuccess: () => {
      toast.success("Responsável removido.");
      queryClient.invalidateQueries({ queryKey: ["guardians"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, d) =>
      d ? `${a}.${b}.${c}-${d}` : digits.length > 6 ? `${a}.${b}.${c}` : digits.length > 3 ? `${a}.${b}` : a
    );
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.email.trim() || !form.cpf.trim() || !form.telefone.trim() || !form.senha.trim()) {
      toast.error("Todos os campos obrigatórios devem ser preenchidos.");
      return;
    }
    if (form.senha.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    addGuardian.mutate();
  };

  const canRemove = (g: Guardian) => {
    if (g.tipo === "principal") return false;
    return true;
  };

  return (
    <Card className="rounded-3xl shadow-xl border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-xl flex items-center gap-2">
            <Users size={20} className="text-primary" /> Responsáveis
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl font-display font-bold gap-1">
                <UserPlus size={16} /> Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">Adicionar responsável</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="font-body font-semibold">Nome completo *</Label>
                  <Input
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: formatFullName(e.target.value) })}
                    placeholder="Nome do responsável"
                    className="rounded-xl mt-1"
                    required
                  />
                </div>
                <div>
                  <Label className="font-body font-semibold">E-mail *</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    className="rounded-xl mt-1"
                    required
                  />
                </div>
                <div>
                  <Label className="font-body font-semibold">Senha *</Label>
                  <Input
                    type="password"
                    value={form.senha}
                    onChange={(e) => setForm({ ...form, senha: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    className="rounded-xl mt-1"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <Label className="font-body font-semibold">CPF *</Label>
                  <Input
                    value={form.cpf}
                    onChange={(e) => setForm({ ...form, cpf: formatCPF(e.target.value) })}
                    placeholder="000.000.000-00"
                    className="rounded-xl mt-1"
                    required
                  />
                </div>
                <div>
                  <Label className="font-body font-semibold">Telefone *</Label>
                  <Input
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: formatPhone(e.target.value) })}
                    placeholder="(00) 00000-0000"
                    className="rounded-xl mt-1"
                    required
                  />
                </div>
                <div>
                  <Label className="font-body font-semibold">Parentesco / vínculo</Label>
                  <Select value={form.parentesco} onValueChange={(v) => setForm({ ...form, parentesco: v })}>
                    <SelectTrigger className="rounded-xl mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PARENTESCO_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline" className="rounded-xl">
                      Cancelar
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={addGuardian.isPending} className="rounded-xl font-display font-bold">
                    {addGuardian.isPending ? "Adicionando..." : "✅ Adicionar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
        ) : guardians.length === 0 ? (
          <div className="text-center py-6">
            <span className="text-3xl mb-2 inline-block">👨‍👩‍👧‍👦</span>
            <p className="font-body text-sm text-muted-foreground">
              Nenhum responsável adicional cadastrado.
            </p>
            <p className="font-body text-xs text-muted-foreground mt-1">
              Adicione outros responsáveis para compartilhar o acesso à carteira dos filhos.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {guardians.map((g, idx) => (
              <div
                key={g.id}
                className="flex items-center justify-between bg-muted rounded-2xl p-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0">
                    {g.tipo === "principal" ? (
                      <Crown size={20} className="text-kids-yellow" />
                    ) : (
                      <Shield size={20} className="text-primary" />
                    )}
                  </div>
                   <div className="min-w-0">
                    <p className="font-display font-bold text-sm truncate">
                      {g.nome || "Sem nome"}
                    </p>
                    {g.codigo_usuario && (
                      <p className="font-body text-xs text-muted-foreground">
                        ID: {g.codigo_usuario}
                      </p>
                    )}
                    <p className="font-body text-xs text-muted-foreground truncate">
                      {g.email}
                    </p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-body">
                        {parentescoLabel(g.parentesco)}
                      </span>
                      {g.tipo === "principal" && (
                        <span className="text-xs bg-kids-yellow/20 text-secondary-foreground px-2 py-0.5 rounded-full font-body font-semibold">
                          👑 Principal
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {canRemove(g) && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="shrink-0 text-destructive hover:text-destructive">
                        <Trash2 size={16} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-3xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-display">Remover responsável?</AlertDialogTitle>
                        <AlertDialogDescription className="font-body">
                          {g.nome || "Este responsável"} perderá acesso à carteira dos filhos. Esta ação pode ser desfeita adicionando novamente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => removeGuardian.mutate(g.id)}
                          className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GuardianManagement;
