import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Search, Save, Settings, Pencil, RotateCcw, Users, Eye } from "lucide-react";

interface GlobalFees {
  [key: string]: string;
}

interface Props {
  globalFees: GlobalFees;
  platformSettings: { id: string; key: string; value: string; label: string | null }[] | undefined;
}

const FEE_KEYS = ["taxa_fixa_api", "taxa_servico_percent", "mini_gerente_taxa"];

const TaxasUsuarioSection = ({ globalFees, platformSettings }: Props) => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [customFeeValues, setCustomFeeValues] = useState<Record<string, string>>({});
  const [savingCustom, setSavingCustom] = useState(false);

  const { data: searchResults, isFetching: searching } = useQuery({
    queryKey: ["admin-taxas-search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const { data, error } = await supabase.rpc("admin_search_users" as any, {
        _query: searchQuery.trim(),
        _limit: 5,
        _offset: 0,
      });
      if (error) throw error;
      const result = data as any;
      return result?.users || [];
    },
    enabled: searchQuery.trim().length >= 2,
  });

  const { data: userProfile } = useQuery({
    queryKey: ["admin-taxas-profile", selectedUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("nome, email, cpf, telefone, codigo_usuario")
        .eq("user_id", selectedUserId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedUserId,
  });

  // Load existing custom fees for the selected user
  const { data: userCustomFees } = useQuery({
    queryKey: ["admin-user-custom-fees", selectedUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_custom_fees")
        .select("*")
        .eq("user_id", selectedUserId!);
      if (error) throw error;
      return data as { id: string; user_id: string; fee_key: string; fee_value: string }[];
    },
    enabled: !!selectedUserId,
  });

  // Initialize custom fee values when user or custom fees change
  useEffect(() => {
    if (selectedUserId && userCustomFees) {
      const map: Record<string, string> = {};
      userCustomFees.forEach((f) => {
        map[f.fee_key] = f.fee_value;
      });
      setCustomFeeValues(map);
    }
  }, [selectedUserId, userCustomFees]);

  const selectUser = (u: any) => {
    setSelectedUserId(u.user_id);
    setSearchQuery("");
    setCustomFeeValues({});
  };

  // Fee settings to display
  const feeSettings = platformSettings?.filter((s) => FEE_KEYS.includes(s.key)) || [];

  const getEffectiveValue = (key: string) => {
    if (customFeeValues[key] !== undefined && customFeeValues[key] !== "") {
      return customFeeValues[key];
    }
    const setting = platformSettings?.find((s) => s.key === key);
    return setting?.value || "0";
  };

  const isCustomized = (key: string) => {
    return userCustomFees?.some((f) => f.fee_key === key);
  };

  const handleSaveCustomFees = async () => {
    if (!selectedUserId) return;
    setSavingCustom(true);
    try {
      for (const key of FEE_KEYS) {
        const customVal = customFeeValues[key];
        if (customVal !== undefined && customVal !== "") {
          const { error } = await supabase
            .from("user_custom_fees")
            .upsert(
              { user_id: selectedUserId, fee_key: key, fee_value: customVal, updated_at: new Date().toISOString() },
              { onConflict: "user_id,fee_key" }
            );
          if (error) throw error;
        }
      }
      queryClient.invalidateQueries({ queryKey: ["admin-user-custom-fees", selectedUserId] });
      toast.success("Taxas personalizadas salvas com sucesso!");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao salvar taxas personalizadas");
    } finally {
      setSavingCustom(false);
    }
  };

  const handleResetFee = async (key: string) => {
    if (!selectedUserId) return;
    try {
      const { error } = await supabase
        .from("user_custom_fees")
        .delete()
        .eq("user_id", selectedUserId)
        .eq("fee_key", key);
      if (error) throw error;
      setCustomFeeValues((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ["admin-user-custom-fees", selectedUserId] });
      toast.success("Taxa resetada para o valor global");
    } catch {
      toast.error("Erro ao resetar taxa");
    }
  };

  const formatFeeDisplay = (key: string, value: string) => {
    if (key.includes("percent") || (key.includes("taxa") && !key.includes("fixa"))) {
      return `${value}%`;
    }
    return `R$ ${parseFloat(value || "0").toFixed(2)}`;
  };

  return (
    <div className="bg-card rounded-xl sm:rounded-3xl border border-border p-4 sm:p-6 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <Search size={20} className="text-primary" />
        <h3 className="font-display text-lg font-bold">Consultar Taxas por Usuário</h3>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Input
          placeholder="Buscar por nome, email, CPF, telefone ou código..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setSelectedUserId(null); }}
          className="rounded-xl pl-10"
        />
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      </div>

      {/* Search Results */}
      {searchQuery.trim().length >= 2 && !selectedUserId && (
        <div className="border border-border rounded-xl overflow-hidden mb-4">
          {searching ? (
            <p className="text-center py-4 text-sm text-muted-foreground">Buscando...</p>
          ) : searchResults && searchResults.length > 0 ? (
            searchResults.map((u: any) => (
              <button
                key={u.user_id}
                className="w-full text-left px-4 py-3 hover:bg-muted/50 border-b border-border last:border-b-0 transition-colors"
                onClick={() => selectUser(u)}
              >
                <p className="font-display font-bold text-sm">{u.nome}</p>
                <p className="font-body text-xs text-muted-foreground">
                  {u.email} {u.cpf ? `• CPF: ${u.cpf}` : ""} • Código: {u.codigo_usuario}
                </p>
              </button>
            ))
          ) : (
            <p className="text-center py-4 text-sm text-muted-foreground">Nenhum usuário encontrado</p>
          )}
        </div>
      )}

      {/* Selected User - Show fees and customization */}
      {selectedUserId && userProfile && (
        <div className="space-y-4">
          <div className="bg-muted/30 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="font-display font-bold text-sm">{userProfile.nome}</p>
              <p className="font-body text-xs text-muted-foreground">
                {userProfile.email} {userProfile.cpf ? `• CPF: ${userProfile.cpf}` : ""} {userProfile.telefone ? `• Tel: ${userProfile.telefone}` : ""}
              </p>
              <p className="font-body text-xs text-muted-foreground">Código: {userProfile.codigo_usuario}</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSelectedUserId(null)}>
              Trocar
            </Button>
          </div>

          {/* Current applied fees */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
            <p className="font-display font-bold text-sm flex items-center gap-2">
              <Settings size={14} /> Taxas aplicadas
            </p>
            <p className="font-body text-xs text-muted-foreground mb-2">
              Valores efetivos para este usuário. Taxas personalizadas sobrescrevem as globais.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {feeSettings.map((setting) => {
                const hasCustom = isCustomized(setting.key);
                const effectiveVal = getEffectiveValue(setting.key);
                return (
                  <div key={setting.key} className={`bg-background rounded-lg p-3 border ${hasCustom ? "border-primary/40" : "border-border"}`}>
                    <p className="font-body text-xs text-muted-foreground">{setting.label || setting.key}</p>
                    <p className="font-display font-bold text-sm mt-1">
                      {formatFeeDisplay(setting.key, effectiveVal)}
                    </p>
                    {hasCustom && (
                      <span className="inline-block mt-1 text-[10px] font-body font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        Personalizada
                      </span>
                    )}
                    {!hasCustom && (
                      <span className="inline-block mt-1 text-[10px] font-body text-muted-foreground">
                        Global
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customize fees */}
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 space-y-4">
            <p className="font-display font-bold text-sm flex items-center gap-2">
              <Pencil size={14} /> Personalizar Taxas
            </p>
            <p className="font-body text-xs text-muted-foreground">
              Defina valores personalizados para este usuário. Deixe em branco para usar a taxa global.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {feeSettings.map((setting) => {
                const globalVal = setting.value;
                const hasCustom = isCustomized(setting.key);
                return (
                  <div key={setting.key} className="space-y-1">
                    <label className="font-body text-xs text-muted-foreground">{setting.label || setting.key}</label>
                    <div className="flex gap-1.5">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={`Global: ${globalVal}`}
                        value={customFeeValues[setting.key] ?? ""}
                        onChange={(e) => setCustomFeeValues((prev) => ({ ...prev, [setting.key]: e.target.value }))}
                        className="rounded-xl text-sm"
                      />
                      {hasCustom && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-9 w-9"
                          title="Resetar para taxa global"
                          onClick={() => handleResetFee(setting.key)}
                        >
                          <RotateCcw size={14} className="text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                    <p className="font-body text-[10px] text-muted-foreground">
                      Global: {formatFeeDisplay(setting.key, globalVal)}
                    </p>
                  </div>
                );
              })}
            </div>
            <Button
              className="rounded-xl"
              disabled={savingCustom}
              onClick={handleSaveCustomFees}
            >
              <Save size={14} className="mr-2" />
              {savingCustom ? "Salvando..." : "Salvar Taxas Personalizadas"}
            </Button>
          </div>
        </div>
      )}

      {!selectedUserId && searchQuery.trim().length < 2 && (
        <p className="text-center py-8 font-body text-sm text-muted-foreground">
          Busque um usuário para visualizar e personalizar as taxas
        </p>
      )}

      {/* List all users with custom fees */}
      <UsersWithCustomFees
        platformSettings={platformSettings}
        formatFeeDisplay={formatFeeDisplay}
        onSelectUser={(userId: string) => {
          setSelectedUserId(userId);
          setSearchQuery("");
        }}
      />
    </div>
  );
};

// Sub-component: list all users with custom fees
const UsersWithCustomFees = ({
  platformSettings,
  formatFeeDisplay,
  onSelectUser,
}: {
  platformSettings: Props["platformSettings"];
  formatFeeDisplay: (key: string, value: string) => string;
  onSelectUser: (userId: string) => void;
}) => {
  const { data: allCustomFees, isLoading } = useQuery({
    queryKey: ["admin-all-custom-fees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_custom_fees")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as { id: string; user_id: string; fee_key: string; fee_value: string; updated_at: string }[];
    },
  });

  // Group by user_id
  const userIds = [...new Set(allCustomFees?.map((f) => f.user_id) || [])];

  // Fetch profiles for those user_ids
  const { data: profiles } = useQuery({
    queryKey: ["admin-custom-fees-profiles", userIds.join(",")],
    queryFn: async () => {
      if (userIds.length === 0) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, nome, email, codigo_usuario")
        .in("user_id", userIds);
      if (error) throw error;
      return data;
    },
    enabled: userIds.length > 0,
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl sm:rounded-3xl border border-border p-4 sm:p-6 mt-4">
        <p className="text-center py-4 text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!allCustomFees || allCustomFees.length === 0) {
    return (
      <div className="bg-card rounded-xl sm:rounded-3xl border border-border p-4 sm:p-6 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <Users size={20} className="text-primary" />
          <h3 className="font-display text-lg font-bold">Usuários com Taxas Personalizadas</h3>
        </div>
        <p className="text-center py-6 font-body text-sm text-muted-foreground">
          Nenhum usuário possui taxas personalizadas
        </p>
      </div>
    );
  }

  const feeLabels: Record<string, string> = {};
  platformSettings?.forEach((s) => {
    feeLabels[s.key] = s.label || s.key;
  });

  return (
    <div className="bg-card rounded-xl sm:rounded-3xl border border-border p-4 sm:p-6 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <Users size={20} className="text-primary" />
        <h3 className="font-display text-lg font-bold">Usuários com Taxas Personalizadas</h3>
        <span className="ml-auto text-xs font-body bg-primary/10 text-primary px-2.5 py-1 rounded-full font-semibold">
          {userIds.length} {userIds.length === 1 ? "usuário" : "usuários"}
        </span>
      </div>
      <div className="space-y-3">
        {userIds.map((uid) => {
          const profile = profiles?.find((p) => p.user_id === uid);
          const fees = allCustomFees?.filter((f) => f.user_id === uid) || [];
          return (
            <div
              key={uid}
              className="bg-muted/30 rounded-xl p-4 border border-border hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-display font-bold text-sm">{profile?.nome || "Carregando..."}</p>
                  <p className="font-body text-xs text-muted-foreground">
                    {profile?.email || ""} {profile?.codigo_usuario ? `• Código: ${profile.codigo_usuario}` : ""}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs gap-1.5"
                  onClick={() => onSelectUser(uid)}
                >
                  <Eye size={12} />
                  Ver / Editar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {fees.map((fee) => (
                  <span
                    key={fee.id}
                    className="inline-flex items-center gap-1 text-[11px] font-body bg-primary/10 text-primary px-2.5 py-1 rounded-full"
                  >
                    <span className="font-semibold">{feeLabels[fee.fee_key] || fee.fee_key}:</span>
                    {formatFeeDisplay(fee.fee_key, fee.fee_value)}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaxasUsuarioSection;
