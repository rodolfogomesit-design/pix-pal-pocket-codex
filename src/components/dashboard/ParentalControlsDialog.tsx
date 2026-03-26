import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Ban,
  Briefcase,
  CheckCircle,
  Settings,
  Shield,
  Snowflake,
  UserPlus,
} from "lucide-react";

import type { KidProfile } from "@/hooks/useDashboard";
import { useUpdateKid } from "@/hooks/useDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Props {
  kid: KidProfile;
}

type RpcResult = {
  success?: boolean;
  error?: string;
  nome?: string;
};

const ParentalControlsDialog = ({ kid }: Props) => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const updateKid = useUpdateKid();
  const [controls, setControls] = useState({
    is_frozen: kid.is_frozen,
    bloqueio_envio: kid.bloqueio_envio,
    limite_diario: kid.limite_diario?.toString() || "50",
    is_mini_gerente: kid.is_mini_gerente ?? false,
  });
  const [referralCode, setReferralCode] = useState("");
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralName, setReferralName] = useState<string | null>(null);
  const [existingReferrer, setExistingReferrer] = useState<{
    nome: string;
    codigo: string;
  } | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);

  useEffect(() => {
    setControls({
      is_frozen: kid.is_frozen,
      bloqueio_envio: kid.bloqueio_envio,
      limite_diario: kid.limite_diario?.toString() || "50",
      is_mini_gerente: kid.is_mini_gerente ?? false,
    });
  }, [kid]);

  useEffect(() => {
    if (!open || !user) return;

    const fetchExisting = async () => {
      setLoadingExisting(true);

      try {
        const { data: referrals } = await supabase
          .from("referrals")
          .select("referrer_kid_id")
          .eq("referred_user_id", user.id)
          .limit(1);

        if (referrals && referrals.length > 0) {
          const { data: kidData } = await supabase
            .from("kids_profiles")
            .select("nome, apelido, codigo_publico")
            .eq("id", referrals[0].referrer_kid_id)
            .single();

          if (kidData) {
            setExistingReferrer({
              nome: kidData.apelido || kidData.nome,
              codigo: kidData.codigo_publico,
            });
          }
        } else {
          setExistingReferrer(null);
        }
      } catch {
        setExistingReferrer(null);
      } finally {
        setLoadingExisting(false);
      }
    };

    void fetchExisting();
  }, [open, user]);

  const handleSave = async () => {
    try {
      const limiteDiario = parseFloat(controls.limite_diario) || 50;

      if (controls.is_frozen !== kid.is_frozen) {
        const { data, error } = await supabase.rpc("toggle_kid_freeze", {
          _kid_id: kid.id,
          _freeze: controls.is_frozen,
        });

        if (error) throw error;

        const result = data as RpcResult | null;
        if (!result?.success) {
          throw new Error(result?.error || "Erro ao atualizar congelamento.");
        }
      }

      if (controls.is_mini_gerente !== (kid.is_mini_gerente ?? false)) {
        const { data, error } = await supabase.rpc("toggle_mini_gerente", {
          _kid_id: kid.id,
          _enable: controls.is_mini_gerente,
        });

        if (error) throw error;

        const result = data as RpcResult | null;
        if (!result?.success) {
          throw new Error(result?.error || "Erro ao atualizar Mini Gerente.");
        }
      }

      await updateKid.mutateAsync({
        id: kid.id,
        bloqueio_envio: controls.bloqueio_envio,
        limite_diario: limiteDiario,
      });

      toast.success("Controles atualizados!");
      setOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao atualizar controles.";
      toast.error(message);
    }
  };

  const handleLookupReferral = async () => {
    if (!referralCode.trim()) {
      toast.error("Digite o código do Mini Gerente.");
      return;
    }

    setReferralLoading(true);

    try {
      const { data, error } = await supabase.rpc("lookup_by_code", {
        _codigo: referralCode.trim(),
      });
      const result = data as RpcResult | null;

      if (error) throw error;

      if (!result?.success) {
        toast.error("Código não encontrado.");
        setReferralName(null);
      } else {
        setReferralName(result.nome || null);
      }
    } catch {
      toast.error("Erro ao buscar código.");
      setReferralName(null);
    } finally {
      setReferralLoading(false);
    }
  };

  const handleConfirmReferral = async () => {
    if (!user) {
      toast.error("Você precisa estar logado.");
      return;
    }

    setReferralLoading(true);

    try {
      const { data, error } = await supabase.rpc("update_referral", {
        _referred_user_id: user.id,
        _new_referral_code: referralCode.trim(),
      });
      const result = data as RpcResult | null;

      if (error) throw error;

      if (!result?.success) {
        toast.error(result?.error || "Erro ao cadastrar indicação.");
      } else {
        toast.success("Mini Gerente cadastrado com sucesso!");
        setExistingReferrer({ nome: referralName || "", codigo: referralCode.trim() });
        setReferralCode("");
        setReferralName(null);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao cadastrar indicação.";
      toast.error(message);
    } finally {
      setReferralLoading(false);
    }
  };

  const handleDeleteReferral = async () => {
    if (!user) return;

    const confirmed = window.confirm("Tem certeza que deseja excluir o Mini Gerente cadastrado?");
    if (!confirmed) return;

    try {
      const { data, error } = await supabase.rpc("delete_referral", { _user_id: user.id });
      const result = data as RpcResult | null;

      if (error) throw error;
      if (!result?.success) {
        throw new Error(result?.error || "Erro ao excluir Mini Gerente.");
      }

      toast.success("Mini Gerente removido com sucesso!");
      setExistingReferrer(null);
      setReferralCode("");
      setReferralName(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao excluir Mini Gerente.";
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 rounded-xl font-body">
          <Settings size={14} /> Controles
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Controles de {kid.apelido || kid.nome} ⚙️
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-5">
          <div className="flex items-center justify-between rounded-2xl bg-kids-blue-light p-4">
            <div className="flex items-center gap-3">
              <Snowflake size={20} className="text-primary" />
              <div>
                <p className="font-body text-sm font-semibold">Congelar conta</p>
                <p className="font-body text-xs text-muted-foreground">
                  Bloqueia todas as movimentações
                </p>
              </div>
            </div>
            <Switch
              checked={controls.is_frozen}
              onCheckedChange={(value) => setControls((prev) => ({ ...prev, is_frozen: value }))}
            />
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-kids-green-light p-4">
            <div className="flex items-center gap-3">
              <Ban size={20} className="text-destructive" />
              <div>
                <p className="font-body text-sm font-semibold">Bloquear envio</p>
                <p className="font-body text-xs text-muted-foreground">
                  Impedir que envie dinheiro
                </p>
              </div>
            </div>
            <Switch
              checked={controls.bloqueio_envio}
              onCheckedChange={(value) => setControls((prev) => ({ ...prev, bloqueio_envio: value }))}
            />
          </div>

          <div className="rounded-2xl bg-muted p-4">
            <div className="mb-3 flex items-center gap-3">
              <Shield size={20} className="text-primary" />
              <div>
                <p className="font-body text-sm font-semibold">Limite diário</p>
                <p className="font-body text-xs text-muted-foreground">
                  Valor máximo de gasto por dia
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display text-lg font-bold">R$</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={controls.limite_diario}
                onChange={(event) =>
                  setControls((prev) => ({ ...prev, limite_diario: event.target.value }))
                }
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-kids-yellow-light p-4">
            <div className="flex items-center gap-3">
              <Briefcase size={20} className="text-kids-orange" />
              <div>
                <p className="font-body text-sm font-semibold">Mini Gerente</p>
                <p className="font-body text-xs text-muted-foreground">
                  Permite ganhar comissões por indicações
                </p>
              </div>
            </div>
            <Switch
              checked={controls.is_mini_gerente}
              onCheckedChange={(value) => setControls((prev) => ({ ...prev, is_mini_gerente: value }))}
            />
          </div>

          <div className="rounded-2xl bg-kids-yellow-light p-4">
            <div className="mb-3 flex items-center gap-3">
              <UserPlus size={20} className="text-kids-orange" />
              <div>
                <p className="font-body text-sm font-semibold">Quem indicou o Pix Kids?</p>
                <p className="font-body text-xs text-muted-foreground">
                  {existingReferrer
                    ? "Mini Gerente responsável cadastrado"
                    : "Cadastre o código do Mini Gerente responsável"}
                </p>
              </div>
            </div>

            {loadingExisting ? (
              <p className="font-body text-xs text-muted-foreground">Carregando...</p>
            ) : existingReferrer ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl bg-card p-3">
                  <div>
                    <p className="font-body text-xs text-muted-foreground">Mini Gerente cadastrado:</p>
                    <p className="font-display text-sm font-bold">{existingReferrer.nome}</p>
                    <p className="font-body text-xs text-muted-foreground">
                      Código: {existingReferrer.codigo}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-kids-green">
                    <CheckCircle size={20} />
                    <span className="text-2xl">👔</span>
                  </div>
                </div>
                <Button
                  onClick={() => void handleDeleteReferral()}
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl border-destructive/30 font-body text-destructive hover:bg-destructive/10"
                >
                  🗑️ Excluir Mini Gerente cadastrado
                </Button>
              </div>
            ) : !referralName ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: 00001"
                  value={referralCode}
                  onChange={(event) => {
                    setReferralCode(event.target.value.replace(/\D/g, "").slice(0, 5));
                    setReferralName(null);
                  }}
                  className="flex-1 rounded-xl"
                />
                <Button
                  onClick={() => void handleLookupReferral()}
                  disabled={referralLoading || referralCode.length === 0}
                  size="sm"
                  className="rounded-xl bg-kids-orange font-display font-bold text-accent-foreground hover:bg-kids-orange/90"
                >
                  {referralLoading ? "..." : "Buscar"}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl bg-card p-3">
                  <div>
                    <p className="font-body text-xs text-muted-foreground">Mini Gerente encontrado:</p>
                    <p className="font-display text-sm font-bold">{referralName}</p>
                    <p className="font-body text-xs text-muted-foreground">Código: {referralCode}</p>
                  </div>
                  <span className="text-2xl">👔</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setReferralName(null);
                      setReferralCode("");
                    }}
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-xl"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => void handleConfirmReferral()}
                    disabled={referralLoading}
                    size="sm"
                    className="flex-1 rounded-xl bg-kids-green font-display font-bold text-accent-foreground hover:bg-kids-green/90"
                  >
                    {referralLoading ? "..." : "Confirmar"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={() => void handleSave()}
            disabled={updateKid.isPending}
            className="w-full rounded-xl bg-primary py-5 font-display font-bold text-primary-foreground hover:bg-primary/90"
          >
            {updateKid.isPending ? "Salvando..." : "Salvar controles"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ParentalControlsDialog;
