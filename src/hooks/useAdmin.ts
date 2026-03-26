import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AdminMetrics {
  total_users: number;
  total_kids: number;
  total_transactions: number;
  total_balance: number;
  total_volume: number;
  pending_approvals: number;
}

export interface AdminDetailedMetrics {
  total_responsaveis: number;
  total_criancas: number;
  responsaveis_hoje: number;
  criancas_hoje: number;
  responsaveis_mes: number;
  criancas_mes: number;
  ativos_24h: number;
  ativos_30d: number;
  total_balance: number;
}

export interface AdminUser {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  telefone: string | null;
  cpf: string | null;
  chave_pix?: string | null;
  codigo_usuario: string | null;
  created_at: string;
  kids_count: number;
  total_balance: number;
}

export interface AdminKid {
  id: string;
  nome: string;
  apelido: string | null;
  idade: number;
  codigo_publico: string;
  saldo: number;
  is_frozen: boolean;
  limite_diario: number | null;
  limite_pix: number | null;
  limite_transferencia: number | null;
  aprovacao_transferencias: boolean;
  bloqueio_envio: boolean;
  created_at: string;
}

export const useIsAdmin = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin")
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!user,
  });
};

export const useAdminMetrics = () => {
  return useQuery({
    queryKey: ["admin-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_metrics");
      if (error) throw error;
      const result = data as unknown as { success: boolean; error?: string } & AdminMetrics;
      if (!result.success) throw new Error(result.error);
      return result;
    },
  });
};

export const useAdminDetailedMetrics = () => {
  return useQuery({
    queryKey: ["admin-detailed-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_detailed_metrics" as any);
      if (error) throw error;
      const result = data as any;
      if (!result.success) throw new Error(result.error);
      return result as AdminDetailedMetrics;
    },
  });
};

export const useAdminSearchUsers = (query: string, page: number = 1, pageSize: number = 10) => {
  return useQuery({
    queryKey: ["admin-users", query, page, pageSize],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_search_users", {
        _query: query,
        _limit: pageSize,
        _offset: (page - 1) * pageSize,
      });
      if (error) throw error;
      const result = data as unknown as { success: boolean; users: AdminUser[]; total: number; error?: string };
      if (!result.success) throw new Error(result.error);
      return { users: result.users, total: result.total };
    },
  });
};

export const useAdminUserKids = (userId: string | null) => {
  return useQuery({
    queryKey: ["admin-user-kids", userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_user_kids", { _user_id: userId! });
      if (error) throw error;
      const result = data as unknown as { success: boolean; kids: AdminKid[]; error?: string };
      if (!result.success) throw new Error(result.error);
      return result.kids;
    },
    enabled: !!userId,
  });
};

export interface AdminTransaction {
  id: string;
  tipo: string;
  valor: number;
  descricao: string | null;
  status: string;
  created_at: string;
  from_user: string | null;
  from_kid: string | null;
  to_kid: string | null;
  from_user_nome: string;
  from_kid_nome: string;
  to_kid_nome: string;
}

export const useAdminRecentTransactions = () => {
  return useQuery({
    queryKey: ["admin-recent-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_recent_transactions", { _limit: 20 });
      if (error) throw error;
      const result = data as unknown as { success: boolean; transactions: AdminTransaction[]; error?: string };
      if (!result.success) throw new Error(result.error);
      return result.transactions;
    },
  });
};

export const useAdminToggleFreeze = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ kidId, freeze }: { kidId: string; freeze: boolean }) => {
      const { data, error } = await supabase.rpc("admin_toggle_freeze", {
        _kid_id: kidId,
        _freeze: freeze,
      });
      if (error) throw error;
      const result = data as unknown as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-kids"] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
    },
  });
};
