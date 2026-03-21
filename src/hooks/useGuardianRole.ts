import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useGuardianRole = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["guardian-role", user?.id],
    queryFn: async () => {
      // Check if the current user appears as a secondary_user_id in any secondary_guardians row
      const { data, error } = await supabase
        .from("secondary_guardians")
        .select("id, primary_user_id")
        .eq("secondary_user_id", user!.id)
        .limit(1);

      if (error) throw error;

      return {
        isSecondary: data && data.length > 0,
      };
    },
    enabled: !!user,
  });
};
