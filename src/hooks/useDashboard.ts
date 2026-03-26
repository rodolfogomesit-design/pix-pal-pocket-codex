import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFamilyOwner } from "@/hooks/useFamilyOwner";

export type KidProfile = {
  id: string;
  user_responsavel: string;
  nome: string;
  apelido: string | null;
  idade: number;
  codigo_publico: string;
  saldo: number;
  pin: string;
  is_frozen: boolean;
  limite_diario: number | null;
  aprovacao_transferencias: boolean;
  bloqueio_envio: boolean;
  is_mini_gerente?: boolean;
  referral_code?: string | null;
  saldo_comissao?: number;
  created_at: string;
  updated_at: string;
};

export type Transaction = {
  id: string;
  tipo: "mesada" | "transferencia" | "pagamento";
  from_user: string | null;
  to_user: string | null;
  from_kid: string | null;
  to_kid: string | null;
  valor: number;
  descricao: string | null;
  status: "pendente" | "aprovado" | "recusado";
  created_at: string;
};

export const useKids = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: familyOwner } = useFamilyOwner();

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("kids-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kids_profiles" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["kids"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return useQuery({
    queryKey: ["kids", familyOwner?.ownerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kids_profiles")
        .select("*")
        .eq("user_responsavel", familyOwner!.ownerId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as KidProfile[];
    },
    enabled: !!user && !!familyOwner?.ownerId,
  });
};

export const useAddKid = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: familyOwner } = useFamilyOwner();

  return useMutation({
    mutationFn: async (kid: { nome: string; apelido?: string; idade: number; pin: string; codigo_publico?: string }) => {
      const ownerId = familyOwner?.ownerId ?? user?.id;
      if (!ownerId) {
        throw new Error("Não foi possível identificar a família deste responsável.");
      }

      const codigoPublico = kid.codigo_publico || await (async () => {
        const { data: codeData, error: codeError } = await supabase.rpc("generate_codigo_publico");
        if (codeError) throw codeError;
        return codeData;
      })();

      const { data, error } = await supabase
        .from("kids_profiles")
        .insert({
          user_responsavel: ownerId,
          nome: kid.nome,
          apelido: kid.apelido || null,
          idade: kid.idade,
          pin: kid.pin,
          codigo_publico: codigoPublico,
          referral_code: codigoPublico,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kids"] });
    },
  });
};

export const useUpdateKid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<KidProfile> & { id: string }) => {
      const { data, error } = await supabase
        .from("kids_profiles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kids"] });
    },
  });
};

export const useParentBalance = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("parent-balance-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["parent-balance"] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return useQuery({
    queryKey: ["parent-balance", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("saldo")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      return Number(data?.saldo) || 0;
    },
    enabled: !!user?.id,
  });
};

export const useParentProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["parent-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("nome, codigo_usuario, user_id, email, telefone, cpf, chave_pix, saldo, limite_diario, limite_deposito")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      const profile = data as
        | {
            nome: string;
            codigo_usuario: string | null;
            user_id: string;
            email: string | null;
            telefone: string | null;
            cpf: string | null;
            chave_pix: string | null;
            saldo: number | null;
            limite_diario: number | null;
            limite_deposito: number | null;
          }
        | null;
      return profile;
    },
    enabled: !!user?.id,
  });
};

export const useCurrentGuardianProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["current-guardian-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, nome, email, telefone, cpf, chave_pix, saldo, codigo_usuario, limite_diario, limite_deposito")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useSendAllowance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ kidId, valor, descricao }: { kidId: string; valor: number; descricao?: string }) => {
      const { data, error } = await supabase.rpc("send_allowance_from_balance", {
        _kid_id: kidId,
        _valor: valor,
        _descricao: descricao || "Mesada",
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) {
        throw new Error(result?.error || "Erro ao enviar mesada");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kids"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["parent-balance"] });
    },
  });
};

export const useTransactions = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user,
  });
};

export const useUpdateTransactionStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "aprovado" | "recusado" }) => {
      const { error } = await supabase
        .from("transactions")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["kids"] });
    },
  });
};
