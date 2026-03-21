import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { KidProfile } from "@/hooks/useDashboard";
import { toast } from "sonner";
import { Copy, Check, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  kid: KidProfile;
}

const MiniGerenteToggle = ({ kid }: Props) => {
  const [copied, setCopied] = useState(false);
  const kidExtended = kid as any;

  // Get referrals for this kid
  const { data: referrals } = useQuery({
    queryKey: ["kid-referrals", kid.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_kid_id", kid.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Get commission total
  const { data: commissions } = useQuery({
    queryKey: ["kid-commissions-total", kid.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_commissions")
        .select("valor_comissao, status")
        .eq("referrer_kid_id", kid.id);
      if (error) throw error;
      const total = data?.reduce((sum, c) => sum + Number(c.valor_comissao), 0) || 0;
      return { total, count: data?.length || 0 };
    },
  });


  const copyCode = () => {
    if (kid.codigo_publico) {
      navigator.clipboard.writeText(kid.codigo_publico);
      setCopied(true);
      toast.success("Código de indicação copiado!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mt-4 bg-muted/30 rounded-xl p-4 border border-border">
      <div className="flex items-center gap-2 mb-3">
        <Briefcase size={16} className="text-kids-orange" />
        <span className="font-display text-sm font-bold">Mini Gerente <span className="text-kids-yellow">{kid.nome.split(" ")[0]}</span></span>
      </div>

      <div className="space-y-3">
          {/* Referral code */}
          {kid.codigo_publico && (
            <button
              onClick={copyCode}
              className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-2 rounded-lg text-sm font-display font-bold w-full justify-center hover:bg-primary/20"
            >
              Código: {kid.codigo_publico}
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          )}

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-card rounded-lg p-2">
              <p className="font-display text-sm font-bold">{referrals?.length || 0}</p>
              <p className="font-body text-[10px] text-muted-foreground">Indicados</p>
            </div>
            <div className="bg-card rounded-lg p-2">
              <p className="font-display text-sm font-bold">R$ {(commissions?.total || 0).toFixed(2)}</p>
              <p className="font-body text-[10px] text-muted-foreground">Total ganho</p>
            </div>
            <div className="bg-card rounded-lg p-2">
              <p className="font-display text-sm font-bold">R$ {Number(kidExtended.saldo_comissao || 0).toFixed(2)}</p>
              <p className="font-body text-[10px] text-muted-foreground">Disponível</p>
            </div>
          </div>

          {/* Referrals list */}
          {referrals && referrals.length > 0 && (
            <div className="space-y-1">
              <p className="font-body text-xs text-muted-foreground font-semibold">Indicados:</p>
              {referrals.map((ref: any) => (
                <div key={ref.id} className="flex items-center justify-between text-xs bg-card rounded-lg px-3 py-2">
                  <span className="font-body">{ref.referred_name || "Usuário"} (ID: {ref.referred_codigo})</span>
                  <span className="font-body text-muted-foreground">
                    {format(new Date(ref.created_at), "dd/MM", { locale: ptBR })}
                  </span>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
};

export default MiniGerenteToggle;
