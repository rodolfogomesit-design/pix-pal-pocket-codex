import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Ban, ShieldCheck, Trash2, List, Gauge, Receipt, CircleDollarSign, PencilLine,
  CheckCircle, XCircle
} from "lucide-react";
import type { AdminUser, AdminTransaction, AdminKid } from "@/hooks/useAdmin";

interface GlobalLimits {
  limite_diario_padrao: string;
  limite_transferencia: string;
  limite_pix: string;
  limite_deposito: string;
  idade_minima: string;
}

interface AdminUserActionsProps {
  user: AdminUser;
  onUserDeleted: () => void;
  globalLimits?: GlobalLimits;
}

const AdminUserActions = ({ user, onUserDeleted, globalLimits }: AdminUserActionsProps) => {
  const queryClient = useQueryClient();
  const [blockDialog, setBlockDialog] = useState(false);
  const [adminDialog, setAdminDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [txDialog, setTxDialog] = useState(false);
  const [adjustDialog, setAdjustDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [limitsDialog, setLimitsDialog] = useState(false);
  const [adjustValue, setAdjustValue] = useState("");
  const [adjustDesc, setAdjustDesc] = useState("Ajuste administrativo");
  const [editNome, setEditNome] = useState(user.nome);
  const [editTelefone, setEditTelefone] = useState(user.telefone || "");
  const [editEmail, setEditEmail] = useState(user.email);
  const [editCpf, setEditCpf] = useState(user.cpf || "");
  const [editChavePix, setEditChavePix] = useState(user.chave_pix || "");
  const [editPassword, setEditPassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [manualBlocked, setManualBlocked] = useState<boolean | null>(null);
  const [kidLimits, setKidLimits] = useState<Record<string, { diario: string; pix: string; transferencia: string }>>({});
  const [parentLimitDiario, setParentLimitDiario] = useState("");
  const [parentLimitDeposito, setParentLimitDeposito] = useState("");

  // Check if user is blocked
  const { data: userProfile } = useQuery({
    queryKey: ["admin-user-profile", user.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("is_blocked, limite_diario, limite_deposito, cpf, chave_pix")
        .eq("user_id", user.user_id)
        .maybeSingle();
      if (error) throw error;
      return data as {
        is_blocked: boolean;
        limite_diario: number | null;
        limite_deposito: number | null;
        cpf: string | null;
        chave_pix: string | null;
      } | null;
    },
  });

  // Check if user is admin
  const { data: userIsAdmin } = useQuery({
    queryKey: ["admin-user-role", user.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.user_id)
        .eq("role", "admin")
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  // User transactions
  const { data: userTxData, isLoading: txLoading } = useQuery({
    queryKey: ["admin-user-transactions", user.user_id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_user_transactions" as any, { _user_id: user.user_id });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error);
      return result.transactions as AdminTransaction[];
    },
    enabled: txDialog,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    queryClient.invalidateQueries({ queryKey: ["admin-user-profile", user.user_id] });
    queryClient.invalidateQueries({ queryKey: ["admin-user-role", user.user_id] });
    queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
  };

  const blockMutation = useMutation({
    mutationFn: async (block: boolean) => {
      const { data, error } = await supabase.rpc("admin_block_user" as any, { _user_id: user.user_id, _block: block });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error);
    },
    onSuccess: (_, block) => {
      setManualBlocked(block);
      toast.success(block ? "Usuário bloqueado 🚫" : "Usuário desbloqueado ✅");
      invalidateAll();
      setBlockDialog(false);
    },
    onError: () => toast.error("Erro ao alterar bloqueio"),
  });

  const adminMutation = useMutation({
    mutationFn: async (enable: boolean) => {
      const { data, error } = await supabase.rpc("admin_toggle_admin" as any, { _user_id: user.user_id, _enable: enable });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error);
    },
    onSuccess: (_, enable) => {
      toast.success(enable ? "Usuário promovido a Admin 🛡️" : "Permissão de Admin removida");
      invalidateAll();
      setAdminDialog(false);
    },
    onError: () => toast.error("Erro ao alterar permissão"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Não autenticado");
      }

      const response = await fetch("https://ylmrmidgxhcthwmoebzl.supabase.co/functions/v1/admin-delete-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ userId: user.user_id }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || result?.ok === false) {
        throw new Error(result?.error || "Erro ao excluir usuário");
      }
    },
    onSuccess: () => {
      toast.success("Usuário excluído permanentemente 🗑️");
      invalidateAll();
      setDeleteDialog(false);
      onUserDeleted();
    },
    onError: (error: Error) => toast.error(error.message || "Erro ao excluir usuário"),
  });

  const adjustMutation = useMutation({
    mutationFn: async () => {
      const valor = parseFloat(adjustValue.replace(",", "."));
      if (isNaN(valor) || valor === 0) throw new Error("Valor inválido");
      const { data, error } = await supabase.rpc("admin_adjust_balance" as any, {
        _user_id: user.user_id,
        _valor: valor,
        _descricao: adjustDesc,
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error);
      return result.new_balance;
    },
    onSuccess: (newBalance) => {
      toast.success(`Saldo ajustado! Novo saldo: R$ ${Number(newBalance).toFixed(2)}`);
      invalidateAll();
      setAdjustDialog(false);
      setAdjustValue("");
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao ajustar saldo"),
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      const trimmedPassword = editPassword.trim();
      if (trimmedPassword && trimmedPassword.length < 6) {
        throw new Error("A nova senha deve ter pelo menos 6 caracteres");
      }

      const shouldUpdateAuth = editEmail !== user.email || !!trimmedPassword;
      if (shouldUpdateAuth) {
        const { data: authData, error: authError } = await supabase.functions.invoke("admin-update-user-auth", {
          body: {
            userId: user.user_id,
            email: editEmail !== user.email ? editEmail : undefined,
            password: trimmedPassword || undefined,
          },
        });

        if (authError) throw authError;
        if (authData && authData.ok === false) {
          throw new Error(authData.error || "Erro ao atualizar autenticação");
        }
      }

      const { data, error } = await supabase.rpc("admin_update_user_profile" as any, {
        _user_id: user.user_id,
        _nome: editNome,
        _telefone: editTelefone || null,
        _email: editEmail,
        _cpf: editCpf || null,
        _chave_pix: editChavePix || null,
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error);
    },
    onSuccess: () => {
      toast.success("Cadastro atualizado ✅");
      invalidateAll();
      setEditDialog(false);
      setEditPassword("");
    },
    onError: (error: Error) => toast.error(error.message || "Erro ao atualizar cadastro"),
  });

  // Kids for limits dialog
  const { data: userKidsForLimits } = useQuery({
    queryKey: ["admin-user-kids-limits", user.user_id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_user_kids", { _user_id: user.user_id });
      if (error) throw error;
      const result = data as unknown as { success: boolean; kids: AdminKid[]; error?: string };
      if (!result.success) throw new Error(result.error);
      return result.kids;
    },
    enabled: limitsDialog,
  });

  const limitsMutation = useMutation({
    mutationFn: async ({ kidId, diario, pix, transferencia }: { kidId: string; diario: string; pix: string; transferencia: string }) => {
      const parseVal = (v: string) => { const n = parseFloat(v.replace(",", ".")); return isNaN(n) || v.trim() === "" ? null : n; };
      const { data, error } = await supabase.rpc("admin_update_kid_limits" as any, {
        _kid_id: kidId,
        _limite_diario: parseVal(diario),
        _limite_pix: parseVal(pix),
        _limite_transferencia: parseVal(transferencia),
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error);
    },
    onSuccess: () => {
      toast.success("Limites atualizados ✅");
      queryClient.invalidateQueries({ queryKey: ["admin-user-kids-limits", user.user_id] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-kids"] });
    },
    onError: () => toast.error("Erro ao atualizar limites"),
  });

  const parentLimitsMutation = useMutation({
    mutationFn: async () => {
      const parseVal = (v: string) => { const n = parseFloat(v.replace(",", ".")); return isNaN(n) || v.trim() === "" ? null : n; };
      const { data, error } = await supabase.rpc("admin_update_user_limits" as any, {
        _user_id: user.user_id,
        _limite_diario: parseVal(parentLimitDiario),
        _limite_deposito: parseVal(parentLimitDeposito),
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error);
    },
    onSuccess: () => {
      toast.success("Limites do responsável atualizados ✅");
      queryClient.invalidateQueries({ queryKey: ["admin-user-profile", user.user_id] });
    },
    onError: () => toast.error("Erro ao atualizar limites do responsável"),
  });

  const openLimitsDialog = () => {
    // Init parent limits from profile
    setParentLimitDiario(userProfile?.limite_diario != null ? String(userProfile.limite_diario) : "");
    setParentLimitDeposito(userProfile?.limite_deposito != null ? String(userProfile.limite_deposito) : "");
    setLimitsDialog(true);
  };

  // Initialize kid limits when data loads
  const initKidLimits = (kids: AdminKid[]) => {
    const newLimits: Record<string, { diario: string; pix: string; transferencia: string }> = {};
    kids.forEach((kid) => {
      if (!kidLimits[kid.id]) {
        newLimits[kid.id] = {
          diario: kid.limite_diario != null ? String(kid.limite_diario) : "",
          pix: (kid as any).limite_pix != null ? String((kid as any).limite_pix) : "",
          transferencia: (kid as any).limite_transferencia != null ? String((kid as any).limite_transferencia) : "",
        };
      }
    });
    if (Object.keys(newLimits).length > 0) {
      setKidLimits((prev) => ({ ...prev, ...newLimits }));
    }
  };

  // Effect to init limits when kids load
  if (userKidsForLimits && userKidsForLimits.length > 0) {
    const missing = userKidsForLimits.some((k) => !kidLimits[k.id]);
    if (missing) initKidLimits(userKidsForLimits);
  }

  const isBlocked = manualBlocked ?? userProfile?.is_blocked ?? false;

  const tipoLabel: Record<string, string> = { mesada: "💰 Mesada", transferencia: "👫 Transferência", pagamento: "🛒 Pagamento" };
  const statusStyle: Record<string, string> = {
    aprovado: "bg-kids-green-light text-kids-green",
    pendente: "bg-kids-yellow-light text-kids-orange",
    recusado: "bg-destructive/10 text-destructive",
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Button
          variant="outline"
          size="sm"
          className={`rounded-xl text-xs h-9 justify-start gap-2 ${isBlocked ? "border-destructive/50 bg-destructive/5" : ""}`}
          onClick={() => setBlockDialog(true)}
        >
          <Ban size={14} className="text-destructive" />
          {isBlocked ? "Desbloquear" : "Bloquear"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={`rounded-xl text-xs h-9 justify-start gap-2 ${userIsAdmin ? "border-primary/50 bg-primary/5" : ""}`}
          onClick={() => setAdminDialog(true)}
        >
          <ShieldCheck size={14} className="text-primary" />
          {userIsAdmin ? "Remover Admin" : "Tornar Admin"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl text-xs h-9 justify-start gap-2 text-destructive hover:text-destructive"
          onClick={() => { setDeleteConfirm(""); setDeleteDialog(true); }}
        >
          <Trash2 size={14} />
          Excluir
        </Button>
        <Button variant="outline" size="sm" className="rounded-xl text-xs h-9 justify-start gap-2" onClick={() => setTxDialog(true)}>
          <List size={14} className="text-accent" />
          Transações
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl text-xs h-9 justify-start gap-2"
          onClick={() => { setAdjustValue(""); setAdjustDesc("Ajuste administrativo"); setAdjustDialog(true); }}
        >
          <CircleDollarSign size={14} className="text-kids-green" />
          Ajustar Saldo
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl text-xs h-9 justify-start gap-2"
          onClick={() => {
            setEditNome(user.nome);
            setEditTelefone(user.telefone || "");
            setEditEmail(user.email);
            setEditCpf(userProfile?.cpf || user.cpf || "");
            setEditChavePix(userProfile?.chave_pix || user.chave_pix || "");
            setEditPassword("");
            setEditDialog(true);
          }}
        >
          <PencilLine size={14} className="text-kids-yellow" />
          Alterar Cadastro
        </Button>
      </div>

      {/* Block Dialog */}
      <Dialog open={blockDialog} onOpenChange={setBlockDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isBlocked ? "Desbloquear Usuário" : "Bloquear Usuário"}</DialogTitle>
            <DialogDescription>
              {isBlocked
                ? `Deseja desbloquear ${user.nome}? O usuário poderá acessar a plataforma novamente.`
                : `Deseja bloquear ${user.nome}? O usuário não poderá mais acessar a plataforma.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialog(false)}>Cancelar</Button>
            <Button
              variant={isBlocked ? "default" : "destructive"}
              onClick={() => blockMutation.mutate(!isBlocked)}
              disabled={blockMutation.isPending}
            >
              {blockMutation.isPending ? "Processando..." : isBlocked ? "Desbloquear" : "Bloquear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Dialog */}
      <Dialog open={adminDialog} onOpenChange={setAdminDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{userIsAdmin ? "Remover Admin" : "Tornar Admin"}</DialogTitle>
            <DialogDescription>
              {userIsAdmin
                ? `Remover permissão de administrador de ${user.nome}?`
                : `Promover ${user.nome} a administrador? Terá acesso total ao painel.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdminDialog(false)}>Cancelar</Button>
            <Button
              variant={userIsAdmin ? "destructive" : "default"}
              onClick={() => adminMutation.mutate(!userIsAdmin)}
              disabled={adminMutation.isPending}
            >
              {adminMutation.isPending ? "Processando..." : userIsAdmin ? "Remover Admin" : "Tornar Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">⚠️ Excluir Usuário</DialogTitle>
            <DialogDescription>
              Esta ação é <strong>irreversível</strong>. Todos os dados de <strong>{user.nome}</strong> serão
              permanentemente apagados, incluindo filhos, transações, depósitos e saques.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="font-body text-sm text-muted-foreground">
              Digite <strong>EXCLUIR</strong> para confirmar:
            </p>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="EXCLUIR"
              className="rounded-xl"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteConfirm !== "EXCLUIR" || deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir Permanentemente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transactions Dialog */}
      <Dialog open={txDialog} onOpenChange={setTxDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transações de {user.nome}</DialogTitle>
          </DialogHeader>
          {txLoading ? (
            <p className="text-center py-8 font-body text-muted-foreground">Carregando...</p>
          ) : userTxData && userTxData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-3 py-2 text-left font-display font-semibold text-xs">Tipo</th>
                    <th className="px-3 py-2 text-left font-display font-semibold text-xs">De</th>
                    <th className="px-3 py-2 text-left font-display font-semibold text-xs">Para</th>
                    <th className="px-3 py-2 text-right font-display font-semibold text-xs">Valor</th>
                    <th className="px-3 py-2 text-center font-display font-semibold text-xs">Status</th>
                    <th className="px-3 py-2 text-left font-display font-semibold text-xs">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {userTxData.map((tx) => (
                    <tr key={tx.id} className="hover:bg-muted/30">
                      <td className="px-3 py-2 font-body text-xs">{tipoLabel[tx.tipo] || tx.tipo}</td>
                      <td className="px-3 py-2 font-body text-xs text-muted-foreground">
                        {tx.from_user_nome || tx.from_kid_nome || "—"}
                      </td>
                      <td className="px-3 py-2 font-body text-xs text-muted-foreground">
                        {tx.to_kid_nome || "—"}
                      </td>
                      <td className="px-3 py-2 font-body text-xs font-semibold text-right">
                        R$ {Number(tx.valor).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${statusStyle[tx.status] || ""}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-body text-xs text-muted-foreground">
                        {format(new Date(tx.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-8 font-body text-sm text-muted-foreground">Nenhuma transação encontrada</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Adjust Balance Dialog */}
      <Dialog open={adjustDialog} onOpenChange={setAdjustDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajustar Saldo de {user.nome}</DialogTitle>
            <DialogDescription>
              Use valor positivo para creditar e negativo para debitar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="font-body text-sm font-semibold text-foreground">Valor (R$)</label>
              <Input
                type="text"
                value={adjustValue}
                onChange={(e) => setAdjustValue(e.target.value)}
                placeholder="Ex: 50.00 ou -20.00"
                className="rounded-xl mt-1"
              />
            </div>
            <div>
              <label className="font-body text-sm font-semibold text-foreground">Descrição</label>
              <Input
                value={adjustDesc}
                onChange={(e) => setAdjustDesc(e.target.value)}
                placeholder="Motivo do ajuste"
                className="rounded-xl mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialog(false)}>Cancelar</Button>
            <Button onClick={() => adjustMutation.mutate()} disabled={adjustMutation.isPending || !adjustValue}>
              {adjustMutation.isPending ? "Processando..." : "Ajustar Saldo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar Cadastro</DialogTitle>
            <DialogDescription>Edite os dados cadastrais de {user.nome}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="font-body text-sm font-semibold text-foreground">CPF cadastrado</label>
              <Input value={editCpf} onChange={(e) => setEditCpf(e.target.value)} className="rounded-xl mt-1" placeholder="000.000.000-00" />
            </div>
            <div>
              <label className="font-body text-sm font-semibold text-foreground">Chave Pix cadastrada</label>
              <Input value={editChavePix} onChange={(e) => setEditChavePix(e.target.value)} className="rounded-xl mt-1" placeholder="CPF, e-mail, telefone ou chave aleatória" />
            </div>
            <div>
              <label className="font-body text-sm font-semibold text-foreground">Nome</label>
              <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} className="rounded-xl mt-1" />
            </div>
            <div>
              <label className="font-body text-sm font-semibold text-foreground">Email</label>
              <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="rounded-xl mt-1" />
            </div>
            <div>
              <label className="font-body text-sm font-semibold text-foreground">Telefone</label>
              <Input value={editTelefone} onChange={(e) => setEditTelefone(e.target.value)} className="rounded-xl mt-1" placeholder="(00) 00000-0000" />
            </div>
            <div>
              <label className="font-body text-sm font-semibold text-foreground">Nova senha</label>
              <Input
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                className="rounded-xl mt-1"
                placeholder="Deixe em branco para não alterar"
              />
            </div>
            <p className="font-body text-xs text-muted-foreground">A nova senha é opcional. Se preenchida, será atualizada junto com o cadastro.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>Cancelar</Button>
            <Button onClick={() => editMutation.mutate()} disabled={editMutation.isPending || !editNome || !editEmail}>
              {editMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Limits Dialog */}
      <Dialog open={limitsDialog} onOpenChange={setLimitsDialog}>
        <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Limites Financeiros — {user.nome}</DialogTitle>
            <DialogDescription>
              Configure limites para o responsável e seus filhos. Deixe vazio para sem limite.
            </DialogDescription>
          </DialogHeader>

          {/* Global limits reference */}
          {globalLimits && (
            <div className="bg-muted/20 border border-dashed border-border rounded-xl p-3">
              <p className="font-body text-xs text-muted-foreground font-semibold mb-2">📋 Limites globais (referência)</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground">
                <span>Diário: R$ {globalLimits.limite_diario_padrao}</span>
                <span>Transferência: R$ {globalLimits.limite_transferencia}</span>
                <span>Pix: R$ {globalLimits.limite_pix}</span>
                <span>Depósito: R$ {globalLimits.limite_deposito}</span>
              </div>
            </div>
          )}

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
            <p className="font-display font-bold text-sm flex items-center gap-2">
              👤 Limites do Responsável
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-body text-xs text-muted-foreground">Limite diário padrão (R$)</label>
                <Input
                  type="text"
                  value={parentLimitDiario}
                  onChange={(e) => setParentLimitDiario(e.target.value)}
                  placeholder={globalLimits ? `Global: ${globalLimits.limite_diario_padrao}` : "Sem limite"}
                  className="rounded-lg mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="font-body text-xs text-muted-foreground">Limite de depósito diário (R$)</label>
                <Input
                  type="text"
                  value={parentLimitDeposito}
                  onChange={(e) => setParentLimitDeposito(e.target.value)}
                  placeholder={globalLimits ? `Global: ${globalLimits.limite_deposito}` : "Sem limite"}
                  className="rounded-lg mt-1 h-8 text-xs"
                />
              </div>
            </div>
            <Button
              size="sm"
              className="rounded-lg text-xs w-full"
              onClick={() => parentLimitsMutation.mutate()}
              disabled={parentLimitsMutation.isPending}
            >
              {parentLimitsMutation.isPending ? "Salvando..." : "Salvar Limites do Responsável"}
            </Button>
          </div>

          {/* Kids Limits */}
          <div className="border-t border-border pt-4 mt-2">
            <p className="font-display font-bold text-sm mb-3 flex items-center gap-2">👧 Limites dos Filhos</p>
          </div>
          {userKidsForLimits && userKidsForLimits.length > 0 ? (
            <div className="space-y-4">
              {userKidsForLimits.map((kid) => {
                const limits = kidLimits[kid.id] || { diario: "", pix: "", transferencia: "" };
                return (
                  <div key={kid.id} className="bg-muted/50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-display font-bold text-sm">
                        {kid.apelido || kid.nome} <span className="text-muted-foreground font-normal">({kid.codigo_publico})</span>
                      </p>
                      <span className="text-xs text-muted-foreground">Saldo: R$ {Number(kid.saldo).toFixed(2)}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="font-body text-xs text-muted-foreground">Limite diário padrão (R$)</label>
                        <Input
                          type="text"
                          value={limits.diario}
                          onChange={(e) => setKidLimits((prev) => ({ ...prev, [kid.id]: { ...prev[kid.id], diario: e.target.value } }))}
                          placeholder={globalLimits ? `Global: ${globalLimits.limite_diario_padrao}` : "Sem limite"}
                          className="rounded-lg mt-1 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="font-body text-xs text-muted-foreground">Limite por Pix (R$)</label>
                        <Input
                          type="text"
                          value={limits.pix}
                          onChange={(e) => setKidLimits((prev) => ({ ...prev, [kid.id]: { ...prev[kid.id], pix: e.target.value } }))}
                          placeholder={globalLimits ? `Global: ${globalLimits.limite_pix}` : "Sem limite"}
                          className="rounded-lg mt-1 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="font-body text-xs text-muted-foreground">Limite por transferência (R$)</label>
                        <Input
                          type="text"
                          value={limits.transferencia}
                          onChange={(e) => setKidLimits((prev) => ({ ...prev, [kid.id]: { ...prev[kid.id], transferencia: e.target.value } }))}
                          placeholder={globalLimits ? `Global: ${globalLimits.limite_transferencia}` : "Sem limite"}
                          className="rounded-lg mt-1 h-8 text-xs"
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="rounded-lg text-xs w-full"
                      onClick={() => limitsMutation.mutate({ kidId: kid.id, ...limits })}
                      disabled={limitsMutation.isPending}
                    >
                      {limitsMutation.isPending ? "Salvando..." : "Salvar Limites"}
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center py-8 font-body text-sm text-muted-foreground">
              {userKidsForLimits ? "Nenhum filho cadastrado" : "Carregando..."}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminUserActions;
