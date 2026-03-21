import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useFamilyOwner = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["family-owner", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("secondary_guardians")
        .select("primary_user_id")
        .eq("secondary_user_id", user!.id)
        .maybeSingle();

      if (error) throw error;

      return {
        ownerId: data?.primary_user_id ?? user!.id,
        isSecondary: Boolean(data?.primary_user_id),
      };
    },
    enabled: !!user,
    staleTime: 60_000,
  });
};
