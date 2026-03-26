import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Ban, Trash2, List, CircleDollarSign, PencilLine } from "lucide-react";
import type { AdminKid, AdminTransaction } from "@/hooks/useAdmin";

interface AdminKidActionsProps {
  kid: AdminKid;
}

type KidActionRequest =
  | { action: "transactions"; kidId: string; limit?: number }
  | { action: "freeze"; kidId: string; freeze: boolean }
  | { action: "delete"; kidId: string }
  | { action: "adjust-balance"; kidId: string; value: number; description?: string }
  | { action: "update-profile"; kidId: string; nome: string };

const tipoLabel: Record<string, string> = {
  mesada: "Mesada",
  transferencia: "Transferencia",
  pagamento: "Pagamento",
  deposito: "Deposito",
  comissao: "Comissao",
};

const statusStyle: Record<string, string> = {
  aprovado: "bg-kids-green-light text-kids-green",
  pendente: "bg-kids-yellow-light text-kids-orange",
  recusado: "bg-destructive/10 text-destructive",
};

const invokeKidAction = async (payload: KidActionRequest) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Sessao expirada. Entre novamente.");
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-kid-actions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || `Falha na funcao (${response.status})`);
  }

  return data;
};

const AdminKidActions = ({ kid }: AdminKidActionsProps) => {
  const queryClient = useQueryClient();
  const [blockDialog, setBlockDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [txDialog, setTxDialog] = useState(false);
  const [adjustDialog, setAdjustDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [adjustValue, setAdjustValue] = useState("");
  const [adjustDesc, setAdjustDesc] = useState("Ajuste administrativo da crianca");
  const [editNome, setEditNome] = useState(kid.nome);

  const { data: kidTxData, isLoading: txLoading } = useQuery({
    queryKey: ["admin-kid-transactions", kid.id],
    queryFn: async () => {
      const data = await invokeKidAction({ action: "transactions", kidId: kid.id });
      return data.transactions as AdminTransaction[];
    },
    enabled: txDialog,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-user-kids"] });
    queryClient.invalidateQueries({ queryKey: ["admin-recent-transactions"] });
    queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
  };

  const blockMutation = useMutation({
    mutationFn: async (freeze: boolean) => {
      await invokeKidAction({ action: "freeze", kidId: kid.id, freeze });
    },
    onSuccess: (_, freeze) => {
      toast.success(freeze ? "Crianca bloqueada" : "Crianca desbloqueada");
      invalidateAll();
      setBlockDialog(false);
    },
    onError: (error: Error) => toast.error(error.message || "Erro ao alterar bloqueio da crianca"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await invokeKidAction({ action: "delete", kidId: kid.id });
    },
    onSuccess: () => {
      toast.success("Conta infantil excluida");
      invalidateAll();
      setDeleteDialog(false);
    },
    onError: (error: Error) => toast.error(error.message || "Erro ao excluir crianca"),
  });

  const adjustMutation = useMutation({
    mutationFn: async () => {
      const valor = parseFloat(adjustValue.replace(",", "."));
      if (Number.isNaN(valor) || valor === 0) throw new Error("Valor invalido");
      const data = await invokeKidAction({
        action: "adjust-balance",
        kidId: kid.id,
        value: valor,
        description: adjustDesc,
      });
      return data.newBalance;
    },
    onSuccess: (newBalance) => {
      toast.success(`Saldo ajustado. Novo saldo: R$ ${Number(newBalance).toFixed(2)}`);
      invalidateAll();
      setAdjustDialog(false);
      setAdjustValue("");
    },
    onError: (error: Error) => toast.error(error.message || "Erro ao ajustar saldo"),
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      if (!editNome.trim()) throw new Error("Nome e obrigatorio");

      await invokeKidAction({
        action: "update-profile",
        kidId: kid.id,
        nome: editNome.trim(),
      });
    },
    onSuccess: () => {
      toast.success("Cadastro da crianca atualizado");
      invalidateAll();
      setEditDialog(false);
    },
    onError: (error: Error) => toast.error(error.message || "Erro ao atualizar cadastro da crianca"),
  });

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Button
          variant="outline"
          size="sm"
          className={`h-9 justify-start gap-2 rounded-xl text-xs ${kid.is_frozen ? "border-destructive/50 bg-destructive/5" : ""}`}
          onClick={() => setBlockDialog(true)}
        >
          <Ban size={14} className="text-destructive" />
          {kid.is_frozen ? "Desbloquear" : "Bloquear"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-9 justify-start gap-2 rounded-xl text-xs text-destructive hover:text-destructive"
          onClick={() => {
            setDeleteConfirm("");
            setDeleteDialog(true);
          }}
        >
          <Trash2 size={14} />
          Excluir
        </Button>
        <Button variant="outline" size="sm" className="h-9 justify-start gap-2 rounded-xl text-xs" onClick={() => setTxDialog(true)}>
          <List size={14} className="text-accent" />
          Transacoes
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-9 justify-start gap-2 rounded-xl text-xs"
          onClick={() => {
            setAdjustValue("");
            setAdjustDesc("Ajuste administrativo da crianca");
            setAdjustDialog(true);
          }}
        >
          <CircleDollarSign size={14} className="text-kids-green" />
          Ajustar saldo
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-9 justify-start gap-2 rounded-xl text-xs"
          onClick={() => {
            setEditNome(kid.nome);
            setEditDialog(true);
          }}
        >
          <PencilLine size={14} className="text-kids-yellow" />
          Alterar cadastro
        </Button>
      </div>

      <Dialog open={blockDialog} onOpenChange={setBlockDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{kid.is_frozen ? "Desbloquear crianca" : "Bloquear crianca"}</DialogTitle>
            <DialogDescription>
              {kid.is_frozen
                ? `Deseja desbloquear ${kid.apelido || kid.nome}?`
                : `Deseja bloquear ${kid.apelido || kid.nome}? A crianca nao podera usar a conta.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant={kid.is_frozen ? "default" : "destructive"}
              onClick={() => blockMutation.mutate(!kid.is_frozen)}
              disabled={blockMutation.isPending}
            >
              {blockMutation.isPending ? "Processando..." : kid.is_frozen ? "Desbloquear" : "Bloquear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Excluir conta infantil</DialogTitle>
            <DialogDescription>
              Esta acao e irreversivel. Todos os dados de <strong>{kid.apelido || kid.nome}</strong> serao apagados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="font-body text-sm text-muted-foreground">
              Digite <strong>EXCLUIR</strong> para confirmar:
            </p>
            <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="EXCLUIR" className="rounded-xl" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteConfirm !== "EXCLUIR" || deleteMutation.isPending}>
              {deleteMutation.isPending ? "Excluindo..." : "Excluir permanentemente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={txDialog} onOpenChange={setTxDialog}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transacoes de {kid.apelido || kid.nome}</DialogTitle>
          </DialogHeader>
          {txLoading ? (
            <p className="py-8 text-center font-body text-muted-foreground">Carregando...</p>
          ) : kidTxData && kidTxData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-3 py-2 text-left font-display text-xs font-semibold">Tipo</th>
                    <th className="px-3 py-2 text-left font-display text-xs font-semibold">De</th>
                    <th className="px-3 py-2 text-left font-display text-xs font-semibold">Para</th>
                    <th className="px-3 py-2 text-right font-display text-xs font-semibold">Valor</th>
                    <th className="px-3 py-2 text-center font-display text-xs font-semibold">Status</th>
                    <th className="px-3 py-2 text-left font-display text-xs font-semibold">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {kidTxData.map((tx) => (
                    <tr key={tx.id} className="hover:bg-muted/30">
                      <td className="px-3 py-2 font-body text-xs">{tipoLabel[tx.tipo] || tx.tipo}</td>
                      <td className="px-3 py-2 font-body text-xs text-muted-foreground">{tx.from_user_nome || tx.from_kid_nome || "-"}</td>
                      <td className="px-3 py-2 font-body text-xs text-muted-foreground">{tx.to_kid_nome || "-"}</td>
                      <td className="px-3 py-2 text-right font-body text-xs font-semibold">R$ {Number(tx.valor).toFixed(2)}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusStyle[tx.status] || ""}`}>{tx.status}</span>
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
            <div className="space-y-3 py-8 text-center">
              <p className="font-body text-sm text-muted-foreground">Nenhuma transacao encontrada</p>
              <div className="mx-auto max-w-sm rounded-2xl border border-border bg-muted/40 p-4">
                <p className="font-body text-xs uppercase tracking-wide text-muted-foreground">Saldo atual cadastrado</p>
                <p className="mt-1 font-display text-2xl font-bold text-foreground">
                  R$ {Number(kid.saldo).toFixed(2)}
                </p>
                <p className="mt-2 font-body text-xs text-muted-foreground">
                  Esta crianca tem saldo salvo no perfil, mas ainda nao ha movimentacoes registradas no historico exibido.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={adjustDialog} onOpenChange={setAdjustDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajustar saldo de {kid.apelido || kid.nome}</DialogTitle>
            <DialogDescription>Use valor positivo para creditar e negativo para debitar.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="font-body text-sm font-semibold text-foreground">Valor (R$)</label>
              <Input
                type="text"
                value={adjustValue}
                onChange={(e) => setAdjustValue(e.target.value)}
                placeholder="Ex: 25.00 ou -10.00"
                className="mt-1 rounded-xl"
              />
            </div>
            <div>
              <label className="font-body text-sm font-semibold text-foreground">Descricao</label>
              <Input value={adjustDesc} onChange={(e) => setAdjustDesc(e.target.value)} placeholder="Motivo do ajuste" className="mt-1 rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => adjustMutation.mutate()} disabled={adjustMutation.isPending || !adjustValue}>
              {adjustMutation.isPending ? "Processando..." : "Ajustar saldo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar cadastro da crianca</DialogTitle>
            <DialogDescription>Edite os dados de {kid.apelido || kid.nome}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="font-body text-sm font-semibold text-foreground">Codigo</label>
              <Input value={kid.codigo_publico} readOnly disabled className="mt-1 rounded-xl" />
            </div>
            <div>
              <label className="font-body text-sm font-semibold text-foreground">Nome</label>
              <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} className="mt-1 rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => editMutation.mutate()} disabled={editMutation.isPending || !editNome}>
              {editMutation.isPending ? "Salvando..." : "Salvar alteracoes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminKidActions;
