import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ReferralInfo {
  id: string;
  referred_name: string;
  referred_codigo: string;
  status: string;
  created_at: string;
  total_comissao: number;
}

export interface CommissionInfo {
  id: string;
  valor_deposito: number;
  taxa_percentual: number;
  valor_comissao: number;
  status: string;
  created_at: string;
}

export interface ReferralStats {
  total_referrals: number;
  total_earned: number;
  saldo_comissao: number;
  existing_referrer?: { referrer_name: string; referrer_codigo: string } | null;
  referrals: ReferralInfo[];
  commissions: CommissionInfo[];
}

export interface MiniGerenteInfo {
  id: string;
  nome: string;
  apelido: string | null;
  codigo_publico: string;
  referral_code: string;
  saldo_comissao: number;
  is_mini_gerente: boolean;
  total_indicacoes: number;
  total_ganho: number;
}

// Parent: toggle mini gerente for their kid
export const useToggleMiniGerente = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ kidId, enable }: { kidId: string; enable: boolean }) => {
      const { data, error } = await supabase.rpc("toggle_mini_gerente", {
        _kid_id: kidId,
        _enable: enable,
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Erro");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kids"] });
    },
  });
};

// Kid: get referral stats
export const useKidReferralStats = (kidId: string | null) => {
  return useQuery({
    queryKey: ["kid-referral-stats", kidId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_kid_referral_stats", {
        _kid_id: kidId!,
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Erro");
      return result as ReferralStats;
    },
    enabled: !!kidId,
  });
};

// Kid: withdraw commission
export const useWithdrawCommission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ kidId, valor }: { kidId: string; valor: number }) => {
      const { data, error } = await (supabase.rpc as any)("kid_withdraw_commission_no_pin", {
        _kid_id: kidId,
        _valor: valor,
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Erro");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kid-referral-stats"] });
    },
  });
};

// Admin: get all mini gerentes
export const useAdminMiniGerentes = () => {
  return useQuery({
    queryKey: ["admin-mini-gerentes"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_mini_gerentes");
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Erro");
      return result.gerentes as MiniGerenteInfo[];
    },
  });
};

// Admin: toggle mini gerente
export const useAdminToggleMiniGerente = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ kidId, enable }: { kidId: string; enable: boolean }) => {
      const { data, error } = await supabase.rpc("admin_toggle_mini_gerente", {
        _kid_id: kidId,
        _enable: enable,
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Erro");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-mini-gerentes"] });
      queryClient.invalidateQueries({ queryKey: ["kids"] });
    },
  });
};

// Platform setting for mini gerente
export const useMiniGerenteSettings = () => {
  return useQuery({
    queryKey: ["mini-gerente-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("*")
        .in("key", ["mini_gerente_taxa", "mini_gerente_enabled"]);
      if (error) throw error;
      const map: Record<string, string> = {};
      data?.forEach((s: any) => { map[s.key] = s.value; });
      return {
        taxa: parseFloat(map.mini_gerente_taxa || "1"),
        enabled: map.mini_gerente_enabled !== "false",
      };
    },
  });
};
