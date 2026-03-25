import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Search, Save, User, Baby, Users, Eye } from "lucide-react";
import type { AdminKid } from "@/hooks/useAdmin";

interface GlobalLimits {
  limite_diario_padrao: string;
  limite_transferencia: string;
  limite_pix: string;
  limite_deposito: string;
}

interface Props {
  globalLimits: GlobalLimits;
}

const LimitesUsuarioSection = ({ globalLimits }: Props) => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [parentLimitDiario, setParentLimitDiario] = useState("");
  const [parentLimitDeposito, setParentLimitDeposito] = useState("");
  const [kidLimits, setKidLimits] = useState<Record<string, { diario: string; pix: string; transferencia: string }>>({});

  const { data: searchResults, isFetching: searching } = useQuery({
    queryKey: ["admin-limits-search", searchQuery],
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
    queryKey: ["admin-limits-profile", selectedUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("nome, email, limite_diario, limite_deposito")
        .eq("user_id", selectedUserId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedUserId,
  });

  const { data: userKids } = useQuery({
    queryKey: ["admin-limits-kids", selectedUserId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_user_kids", { _user_id: selectedUserId! });
      if (error) throw error;
      const result = data as unknown as { success: boolean; kids: AdminKid[] };
      return result.success ? result.kids : [];
    },
    enabled: !!selectedUserId,
  });

  if (userProfile && parentLimitDiario === "" && parentLimitDeposito === "" && userProfile.limite_diario != null) {
    setParentLimitDiario(userProfile.limite_diario != null ? String(userProfile.limite_diario) : "");
    setParentLimitDeposito(userProfile.limite_deposito != null ? String(userProfile.limite_deposito) : "");
  }
  if (userKids && userKids.length > 0 && Object.keys(kidLimits).length === 0) {
    const newLimits: Record<string, { diario: string; pix: string; transferencia: string }> = {};
    userKids.forEach((kid) => {
      newLimits[kid.id] = {
        diario: kid.limite_diario != null ? String(kid.limite_diario) : "",
        pix: (kid as any).limite_pix != null ? String((kid as any).limite_pix) : "",
        transferencia: (kid as any).limite_transferencia != null ? String((kid as any).limite_transferencia) : "",
      };
    });
    setKidLimits(newLimits);
  }

  const parseVal = (v: string) => {
    const n = parseFloat(v.replace(",", "."));
    return isNaN(n) || v.trim() === "" ? null : n;
  };

  const parentMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("admin_update_user_limits" as any, {
        _user_id: selectedUserId!,
        _limite_diario: parseVal(parentLimitDiario),
        _limite_deposito: parseVal(parentLimitDeposito),
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error);
    },
    onSuccess: () => {
      toast.success("Limites do responsável atualizados ");
      queryClient.invalidateQueries({ queryKey: ["admin-limits-profile", selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-custom-limits"] });
    },
    onError: () => toast.error("Erro ao atualizar limites"),
  });

  const kidMutation = useMutation({
    mutationFn: async ({ kidId, diario, pix, transferencia }: { kidId: string; diario: string; pix: string; transferencia: string }) => {
      const { data, error } = await supabase.rpc("admin_update_kid_limits" as any, {
        _kid_id: kidId,
        _limite_diario: parseVal(diario),
        _limite_pix: parseVal(pix),
        _limite_transferencia: parseVal(transferencia),
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error);
    },
    onSuccess: () => {
      toast.success("Limites do filho atualizados ");
      queryClient.invalidateQueries({ queryKey: ["admin-limits-kids", selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-custom-limits"] });
    },
    onError: () => toast.error("Erro ao atualizar limites"),
  });

  const selectUser = (u: any) => {
    setSelectedUserId(u.user_id);
    setParentLimitDiario("");
    setParentLimitDeposito("");
    setKidLimits({});
    setSearchQuery("");
  };

  return (
    <>
      <div className="bg-card rounded-xl sm:rounded-3xl border border-border p-4 sm:p-6 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <Search size={20} className="text-primary" />
          <h3 className="font-display text-lg font-bold">Limites Individuais por Usuário</h3>
        </div>

        <div className="relative mb-4">
          <Input
            placeholder="Buscar por nome, email, CPF ou código..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSelectedUserId(null); }}
            className="rounded-xl pl-10"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>

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
                  <p className="font-body text-xs text-muted-foreground">{u.email} • Código: {u.codigo_usuario}</p>
                </button>
              ))
            ) : (
              <p className="text-center py-4 text-sm text-muted-foreground">Nenhum usuário encontrado</p>
            )}
          </div>
        )}

        {selectedUserId && userProfile && (
          <div className="space-y-4">
            <div className="bg-muted/30 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="font-display font-bold text-sm">{userProfile.nome}</p>
                <p className="font-body text-xs text-muted-foreground">{userProfile.email}</p>
              </div>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSelectedUserId(null)}>
                Trocar
              </Button>
            </div>

            <div className="bg-muted/20 border border-dashed border-border rounded-xl p-3">
              <p className="font-body text-xs text-muted-foreground font-semibold mb-2"> Limites globais (referência)</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground">
                <span>Diário: R$ {globalLimits.limite_diario_padrao}</span>
                <span>Transferência: R$ {globalLimits.limite_transferencia}</span>
                <span>Pix: R$ {globalLimits.limite_pix}</span>
                <span>Depósito: R$ {globalLimits.limite_deposito}</span>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
              <p className="font-display font-bold text-sm flex items-center gap-2">
                <User size={14} /> Limites do Responsável
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-body text-xs text-muted-foreground">Limite diário padrão (R$)</label>
                  <Input type="text" value={parentLimitDiario} onChange={(e) => setParentLimitDiario(e.target.value)} placeholder={`Global: ${globalLimits.limite_diario_padrao}`} className="rounded-lg mt-1 h-8 text-xs" />
                </div>
                <div>
                  <label className="font-body text-xs text-muted-foreground">Limite de depósito diário (R$)</label>
                  <Input type="text" value={parentLimitDeposito} onChange={(e) => setParentLimitDeposito(e.target.value)} placeholder={`Global: ${globalLimits.limite_deposito}`} className="rounded-lg mt-1 h-8 text-xs" />
                </div>
              </div>
              <Button size="sm" className="rounded-lg text-xs w-full" onClick={() => parentMutation.mutate()} disabled={parentMutation.isPending}>
                <Save size={12} className="mr-1" />
                {parentMutation.isPending ? "Salvando..." : "Salvar Limites do Responsável"}
              </Button>
            </div>

            {userKids && userKids.length > 0 && (
              <div className="space-y-3">
                <p className="font-display font-bold text-sm flex items-center gap-2">
                  <Baby size={14} /> Limites dos Filhos
                </p>
                {userKids.map((kid) => {
                  const limits = kidLimits[kid.id] || { diario: "", pix: "", transferencia: "" };
                  return (
                    <div key={kid.id} className="bg-muted/50 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="font-display font-bold text-sm">
                          {kid.apelido || kid.nome} <span className="text-muted-foreground font-normal">({kid.codigo_publico})</span>
                        </p>
                        <span className="text-xs text-muted-foreground">Saldo: R$ {Number(kid.saldo).toFixed(2)}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="font-body text-xs text-muted-foreground">Limite diário (R$)</label>
                          <Input type="text" value={limits.diario} onChange={(e) => setKidLimits((prev) => ({ ...prev, [kid.id]: { ...prev[kid.id], diario: e.target.value } }))} placeholder={`Global: ${globalLimits.limite_diario_padrao}`} className="rounded-lg mt-1 h-8 text-xs" />
                        </div>
                        <div>
                          <label className="font-body text-xs text-muted-foreground">Limite Pix (R$)</label>
                          <Input type="text" value={limits.pix} onChange={(e) => setKidLimits((prev) => ({ ...prev, [kid.id]: { ...prev[kid.id], pix: e.target.value } }))} placeholder={`Global: ${globalLimits.limite_pix}`} className="rounded-lg mt-1 h-8 text-xs" />
                        </div>
                        <div>
                          <label className="font-body text-xs text-muted-foreground">Limite transferência (R$)</label>
                          <Input type="text" value={limits.transferencia} onChange={(e) => setKidLimits((prev) => ({ ...prev, [kid.id]: { ...prev[kid.id], transferencia: e.target.value } }))} placeholder={`Global: ${globalLimits.limite_transferencia}`} className="rounded-lg mt-1 h-8 text-xs" />
                        </div>
                      </div>
                      <Button size="sm" className="rounded-lg text-xs w-full" onClick={() => kidMutation.mutate({ kidId: kid.id, ...limits })} disabled={kidMutation.isPending}>
                        <Save size={12} className="mr-1" />
                        {kidMutation.isPending ? "Salvando..." : "Salvar Limites"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {userKids && userKids.length === 0 && (
              <p className="text-center py-4 font-body text-sm text-muted-foreground">Nenhum filho cadastrado</p>
            )}
          </div>
        )}

        {!selectedUserId && searchQuery.trim().length < 2 && (
          <p className="text-center py-8 font-body text-sm text-muted-foreground">
            Busque um usuário para personalizar seus limites individualmente
          </p>
        )}
      </div>

      <UsersWithCustomLimits onSelectUser={(userId) => {
        setSelectedUserId(userId);
        setSearchQuery("");
        setParentLimitDiario("");
        setParentLimitDeposito("");
        setKidLimits({});
      }} />
    </>
  );
};

const UsersWithCustomLimits = ({ onSelectUser }: { onSelectUser: (userId: string) => void }) => {
  const { data: parentsWithLimits, isLoading: loadingParents } = useQuery({
    queryKey: ["admin-users-custom-limits", "parents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, nome, email, codigo_usuario, limite_diario, limite_deposito")
        .or("limite_diario.not.is.null,limite_deposito.not.is.null");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: kidsWithLimits, isLoading: loadingKids } = useQuery({
    queryKey: ["admin-users-custom-limits", "kids"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kids_profiles")
        .select("id, nome, apelido, codigo_publico, user_responsavel, limite_diario, limite_pix, limite_transferencia")
        .or("limite_pix.not.is.null,limite_transferencia.not.is.null");
      if (error) throw error;
      return data || [];
    },
  });

  const kidParentIds = [...new Set(kidsWithLimits?.map((k) => k.user_responsavel) || [])];
  const { data: kidParentProfiles } = useQuery({
    queryKey: ["admin-users-custom-limits", "kid-parents", kidParentIds.join(",")],
    queryFn: async () => {
      if (kidParentIds.length === 0) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, nome, email, codigo_usuario")
        .in("user_id", kidParentIds);
      if (error) throw error;
      return data || [];
    },
    enabled: kidParentIds.length > 0,
  });

  const isLoading = loadingParents || loadingKids;
  const hasParents = (parentsWithLimits?.length || 0) > 0;
  const hasKids = (kidsWithLimits?.length || 0) > 0;

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl sm:rounded-3xl border border-border p-4 sm:p-6 mt-4">
        <p className="text-center py-4 text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!hasParents && !hasKids) {
    return (
      <div className="bg-card rounded-xl sm:rounded-3xl border border-border p-4 sm:p-6 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <Users size={20} className="text-primary" />
          <h3 className="font-display text-lg font-bold">Usuários com Limites Alterados</h3>
        </div>
        <p className="text-center py-6 font-body text-sm text-muted-foreground">
          Nenhum usuário possui limites personalizados
        </p>
      </div>
    );
  }

  const totalCount = (parentsWithLimits?.length || 0) + (kidsWithLimits?.length || 0);

  return (
    <div className="bg-card rounded-xl sm:rounded-3xl border border-border p-4 sm:p-6 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <Users size={20} className="text-primary" />
        <h3 className="font-display text-lg font-bold">Usuários com Limites Alterados</h3>
        <span className="ml-auto text-xs font-body bg-primary/10 text-primary px-2.5 py-1 rounded-full font-semibold">
          {totalCount} {totalCount === 1 ? "registro" : "registros"}
        </span>
      </div>
      <div className="space-y-3">
        {parentsWithLimits?.map((p) => (
          <div key={p.user_id} className="bg-muted/30 rounded-xl p-4 border border-border hover:border-primary/30 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-display font-bold text-sm flex items-center gap-1.5">
                  <User size={12} className="text-primary" /> {p.nome}
                </p>
                <p className="font-body text-xs text-muted-foreground">
                  {p.email} {p.codigo_usuario ? `• Código: ${p.codigo_usuario}` : ""}
                </p>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5" onClick={() => onSelectUser(p.user_id)}>
                <Eye size={12} /> Ver / Editar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {p.limite_diario != null && (
                <span className="inline-flex items-center gap-1 text-[11px] font-body bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                  <span className="font-semibold">Limite diário:</span> R$ {Number(p.limite_diario).toFixed(2)}
                </span>
              )}
              {p.limite_deposito != null && (
                <span className="inline-flex items-center gap-1 text-[11px] font-body bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                  <span className="font-semibold">Limite depósito:</span> R$ {Number(p.limite_deposito).toFixed(2)}
                </span>
              )}
            </div>
          </div>
        ))}

        {kidsWithLimits?.map((kid) => {
          const parent = kidParentProfiles?.find((p) => p.user_id === kid.user_responsavel);
          return (
            <div key={kid.id} className="bg-muted/30 rounded-xl p-4 border border-border hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-display font-bold text-sm flex items-center gap-1.5">
                    <Baby size={12} className="text-kids-yellow" />
                    {kid.apelido || kid.nome}
                    <span className="text-muted-foreground font-normal text-xs">({kid.codigo_publico})</span>
                  </p>
                  <p className="font-body text-xs text-muted-foreground">
                    Responsável: {parent?.nome || "—"} {parent?.codigo_usuario ? `• Código: ${parent.codigo_usuario}` : ""}
                  </p>
                </div>
                {parent && (
                  <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5" onClick={() => onSelectUser(parent.user_id)}>
                    <Eye size={12} /> Ver / Editar
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {kid.limite_diario != null && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-body bg-kids-yellow/10 text-kids-orange px-2.5 py-1 rounded-full">
                    <span className="font-semibold">Diário:</span> R$ {Number(kid.limite_diario).toFixed(2)}
                  </span>
                )}
                {kid.limite_pix != null && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-body bg-kids-yellow/10 text-kids-orange px-2.5 py-1 rounded-full">
                    <span className="font-semibold">Pix:</span> R$ {Number(kid.limite_pix).toFixed(2)}
                  </span>
                )}
                {kid.limite_transferencia != null && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-body bg-kids-yellow/10 text-kids-orange px-2.5 py-1 rounded-full">
                    <span className="font-semibold">Transferência:</span> R$ {Number(kid.limite_transferencia).toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LimitesUsuarioSection;