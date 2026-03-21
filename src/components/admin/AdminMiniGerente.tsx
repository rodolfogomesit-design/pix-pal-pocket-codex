import React, { useState } from "react";
import {
  useAdminMiniGerentes,
  useAdminToggleMiniGerente,
  useMiniGerenteSettings,
} from "@/hooks/useMiniGerente";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Briefcase, Save, Users, DollarSign, TrendingUp, ChevronDown, ChevronUp, Search } from "lucide-react";

interface ReferralDetail {
  id: string;
  referred_name: string;
  referred_codigo: string;
  status: string;
  created_at: string;
  total_comissao: number;
}

const useAdminKidReferrals = (kidId: string | null) => {
  return useQuery({
    queryKey: ["admin-kid-referrals", kidId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_kid_referrals" as any, { _kid_id: kidId! });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Erro");
      return result.referrals as ReferralDetail[];
    },
    enabled: !!kidId,
  });
};

const ReferralsList = ({ kidId }: { kidId: string }) => {
  const { data: referrals, isLoading } = useAdminKidReferrals(kidId);

  if (isLoading) return <p className="px-6 py-3 text-xs text-muted-foreground">Carregando indicados...</p>;
  if (!referrals || referrals.length === 0) return <p className="px-6 py-3 text-xs text-muted-foreground">Nenhum indicado</p>;

  return (
    <div className="px-4 pb-3">
      <div className="bg-muted/40 rounded-lg border border-border overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Indicado</th>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Código</th>
              <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Comissão</th>
              <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {referrals.map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-2 font-medium">{r.referred_name || "—"}</td>
                <td className="px-3 py-2 text-muted-foreground">{r.referred_codigo || "—"}</td>
                <td className="px-3 py-2 text-right font-semibold text-kids-green">R$ {Number(r.total_comissao).toFixed(2)}</td>
                <td className="px-3 py-2 text-right text-muted-foreground">
                  {format(new Date(r.created_at), "dd/MM/yy", { locale: ptBR })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AdminMiniGerente = () => {
  const { data: gerentes, isLoading } = useAdminMiniGerentes();
  const { data: settings } = useMiniGerenteSettings();
  const toggleGerente = useAdminToggleMiniGerente();
  const queryClient = useQueryClient();
  const [taxa, setTaxa] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredGerentes = gerentes?.filter((g) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (g.apelido || g.nome).toLowerCase().includes(q) || g.codigo_publico.toLowerCase().includes(q) || g.referral_code.toLowerCase().includes(q);
  });

  const currentTaxa = taxa || String(settings?.taxa || 1);

  const handleSaveTaxa = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("platform_settings")
        .update({ value: currentTaxa, updated_at: new Date().toISOString() })
        .eq("key", "mini_gerente_taxa");
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["mini-gerente-settings"] });
      queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
      toast.success("Taxa atualizada!");
    } catch {
      toast.error("Erro ao salvar taxa");
    } finally {
      setSaving(false);
    }
  };

  const totalGerentes = gerentes?.length || 0;
  const totalIndicacoes = gerentes?.reduce((s, g) => s + Number(g.total_indicacoes), 0) || 0;
  const totalComissoes = gerentes?.reduce((s, g) => s + Number(g.total_ganho), 0) || 0;
  const totalSaldo = gerentes?.reduce((s, g) => s + Number(g.saldo_comissao), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl sm:rounded-3xl border border-border p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Briefcase size={20} className="text-kids-orange" />
          <h3 className="font-display text-lg font-bold">Configurações Mini Gerente</h3>
        </div>
        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-1">
            <label className="font-body text-sm text-muted-foreground">Taxa de comissão (%)</label>
            <Input type="number" step="0.1" min="0" max="100" value={currentTaxa} onChange={(e) => setTaxa(e.target.value)} className="rounded-xl" />
          </div>
          <Button onClick={handleSaveTaxa} disabled={saving} className="rounded-xl">
            <Save size={14} className="mr-1" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-kids-orange to-kids-orange/70 rounded-xl p-4 text-primary-foreground">
          <div className="flex items-center gap-1.5 mb-1 opacity-80"><Briefcase size={16} /><span className="font-body text-xs">Gerentes</span></div>
          <p className="font-display text-2xl font-extrabold">{totalGerentes}</p>
        </div>
        <div className="bg-gradient-to-br from-primary to-primary/70 rounded-xl p-4 text-primary-foreground">
          <div className="flex items-center gap-1.5 mb-1 opacity-80"><Users size={16} /><span className="font-body text-xs">Indicações</span></div>
          <p className="font-display text-2xl font-extrabold">{totalIndicacoes}</p>
        </div>
        <div className="bg-gradient-to-br from-kids-green to-kids-green/70 rounded-xl p-4 text-primary-foreground">
          <div className="flex items-center gap-1.5 mb-1 opacity-80"><TrendingUp size={16} /><span className="font-body text-xs">Comissões pagas</span></div>
          <p className="font-display text-2xl font-extrabold">R$ {totalComissoes.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-br from-kids-yellow to-kids-yellow/70 rounded-xl p-4 text-secondary-foreground">
          <div className="flex items-center gap-1.5 mb-1 opacity-80"><DollarSign size={16} /><span className="font-body text-xs">Saldo pendente</span></div>
          <p className="font-display text-2xl font-extrabold">R$ {totalSaldo.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-card rounded-xl sm:rounded-3xl border border-border overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border space-y-3">
          <h3 className="font-display text-lg font-bold flex items-center gap-2">
            <Users size={20} className="text-primary" />
            Crianças participantes
          </h3>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left font-display font-semibold text-muted-foreground text-xs">Nome</th>
                <th className="px-4 py-3 text-left font-display font-semibold text-muted-foreground text-xs">Código</th>
                <th className="px-4 py-3 text-center font-display font-semibold text-muted-foreground text-xs">Indicações</th>
                <th className="px-4 py-3 text-right font-display font-semibold text-muted-foreground text-xs">Total ganho</th>
                <th className="px-4 py-3 text-right font-display font-semibold text-muted-foreground text-xs">Saldo</th>
                <th className="px-4 py-3 text-center font-display font-semibold text-muted-foreground text-xs">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredGerentes?.map((g) => (
                <React.Fragment key={g.id}>
                  <tr className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <button
                        className="font-body font-semibold text-sm text-primary hover:underline flex items-center gap-1 cursor-pointer"
                        onClick={() => setExpandedId(expandedId === g.id ? null : g.id)}
                      >
                        {g.apelido || g.nome}
                        {Number(g.total_indicacoes) > 0 && (
                          expandedId === g.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-muted-foreground">{g.referral_code}</td>
                    <td className="px-4 py-3 text-center font-body text-sm">{g.total_indicacoes}</td>
                    <td className="px-4 py-3 text-right font-body font-semibold text-sm">R$ {Number(g.total_ganho).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-body font-semibold text-sm">R$ {Number(g.saldo_comissao).toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <Button size="sm" variant="outline" className="rounded-xl text-xs h-7"
                        onClick={() => toggleGerente.mutate({ kidId: g.id, enable: false }, { onSuccess: () => toast.success("Mini Gerente desativado") })}
                        disabled={toggleGerente.isPending}
                      >
                        Desativar
                      </Button>
                    </td>
                  </tr>
                  {expandedId === g.id && (
                    <tr>
                      <td colSpan={6} className="p-0">
                        <ReferralsList kidId={g.id} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          {isLoading && <p className="px-6 py-8 text-center font-body text-sm text-muted-foreground">Carregando...</p>}
          {!isLoading && (!gerentes || gerentes.length === 0) && (
            <p className="px-6 py-8 text-center font-body text-sm text-muted-foreground">Nenhum Mini Gerente ativo</p>
          )}
          {!isLoading && gerentes && gerentes.length > 0 && filteredGerentes?.length === 0 && (
            <p className="px-6 py-8 text-center font-body text-sm text-muted-foreground">Nenhum resultado para "{search}"</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMiniGerente;
