import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useKids } from "@/hooks/useDashboard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, X, Clock } from "lucide-react";

const PendingApprovals = () => {
  const { user } = useAuth();
  const { data: kids } = useKids();
  const queryClient = useQueryClient();

  const { data: pending, isLoading } = useQuery({
    queryKey: ["pending-approvals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("tipo", "transferencia")
        .eq("status", "pendente")
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Filter to only show transfers from kids owned by this parent
      const kidIds = kids?.map((k) => k.id) || [];
      return data.filter((tx) => tx.from_kid && kidIds.includes(tx.from_kid));
    },
    enabled: !!user && !!kids,
  });

  const approveMutation = useMutation({
    mutationFn: async ({ txId, approved }: { txId: string; approved: boolean }) => {
      const { data, error } = await supabase.rpc("approve_transfer", {
        _tx_id: txId,
        _approved: approved,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error || "Erro");
      return result;
    },
    onSuccess: (_, variables) => {
      toast.success(variables.approved ? "Transferência aprovada! ✅" : "Transferência recusada ❌");
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["kids"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const getKidName = (kidId: string | null) => {
    if (!kidId || !kids) return "?";
    const kid = kids.find((k) => k.id === kidId);
    return kid?.apelido || kid?.nome || "?";
  };

  if (isLoading || !pending || pending.length === 0) return null;

  return (
    <div className="bg-kids-yellow-light rounded-3xl border-2 border-kids-yellow/30 overflow-hidden mb-8">
      <div className="px-6 py-4 border-b border-kids-yellow/20 flex items-center gap-2">
        <Clock size={18} className="text-kids-orange" />
        <h3 className="font-display text-lg font-bold">
          Aprovações pendentes ({pending.length})
        </h3>
      </div>
      <div className="divide-y divide-kids-yellow/20">
        {pending.map((tx) => (
          <div key={tx.id} className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="font-body font-semibold text-sm">
                {getKidName(tx.from_kid)} → {getKidName(tx.to_kid)}
              </p>
              <p className="font-body text-xs text-muted-foreground">
                {tx.descricao} • {format(new Date(tx.created_at), "dd MMM, HH:mm", { locale: ptBR })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm mr-2">
                R$ {Number(tx.valor).toFixed(2)}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => approveMutation.mutate({ txId: tx.id, approved: false })}
                disabled={approveMutation.isPending}
              >
                <X size={14} />
              </Button>
              <Button
                size="sm"
                className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => approveMutation.mutate({ txId: tx.id, approved: true })}
                disabled={approveMutation.isPending}
              >
                <Check size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingApprovals;
