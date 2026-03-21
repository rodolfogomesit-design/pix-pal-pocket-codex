import { useState, useEffect } from "react";
import type { KidProfile } from "@/hooks/useDashboard";
import { useUpdateKid } from "@/hooks/useDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Settings, Snowflake, Shield, Ban, Briefcase, UserPlus, CheckCircle } from "lucide-react";

interface Props {
  kid: KidProfile;
}

const ParentalControlsDialog = ({ kid }: Props) => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const updateKid = useUpdateKid();
  const kidExtended = kid as any;
  const [controls, setControls] = useState({
    is_frozen: kid.is_frozen,
    bloqueio_envio: kid.bloqueio_envio,
    limite_diario: kid.limite_diario?.toString() || "50",
    is_mini_gerente: kidExtended.is_mini_gerente ?? true,
  });
  const [referralCode, setReferralCode] = useState("");
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralName, setReferralName] = useState<string | null>(null);
  const [editingReferrer, setEditingReferrer] = useState(false);
  const [existingReferrer, setExistingReferrer] = useState<{ nome: string; codigo: string } | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);

  // Fetch existing referral for this user
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
        }
      } catch { /* ignore */ }
      setLoadingExisting(false);
    };
    fetchExisting();
  }, [open, user]);

  const handleSave = async () => {
    try {
      await updateKid.mutateAsync({
        id: kid.id,
        is_frozen: controls.is_frozen,
        bloqueio_envio: controls.bloqueio_envio,
        limite_diario: parseFloat(controls.limite_diario) || 50,
        is_mini_gerente: controls.is_mini_gerente,
      } as any);
      toast.success("Controles atualizados! ✅");
      setOpen(false);
    } catch {
      toast.error("Erro ao atualizar controles.");
    }
  };

  const handleLookupReferral = async () => {
    if (!referralCode.trim()) {
      toast.error("Digite o código do Mini Gerente.");
      return;
    }
    setReferralLoading(true);
    try {
      const { data, error } = await supabase.rpc("lookup_by_code", { _codigo: referralCode.trim() });
      const result = data as any;
      if (error) throw error;
      if (!result?.success) {
        toast.error("Código não encontrado.");
        setReferralName(null);
      } else {
        setReferralName(result.nome);
      }
    } catch {
      toast.error("Erro ao buscar código.");
      setReferralName(null);
    }
    setReferralLoading(false);
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
      const result = data as any;
      if (error) throw error;
      if (!result?.success) {
        toast.error(result?.error || "Erro ao cadastrar indicação.");
      } else {
        toast.success("Mini Gerente cadastrado com sucesso! 🎉");
        setExistingReferrer({ nome: referralName!, codigo: referralCode.trim() });
        setReferralCode("");
        setReferralName(null);
        setEditingReferrer(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao cadastrar indicação.");
    }
    setReferralLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl gap-1 font-body">
          <Settings size={14} /> Controles
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Controles de {kid.apelido || kid.nome} ⚙️</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          {/* Freeze account */}
          <div className="flex items-center justify-between bg-kids-blue-light rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <Snowflake size={20} className="text-primary" />
              <div>
                <p className="font-body font-semibold text-sm">Congelar conta</p>
                <p className="font-body text-xs text-muted-foreground">Bloqueia todas as movimentações</p>
              </div>
            </div>
            <Switch
              checked={controls.is_frozen}
              onCheckedChange={(v) => setControls({ ...controls, is_frozen: v })}
            />
          </div>

          {/* Block sending */}
          <div className="flex items-center justify-between bg-kids-green-light rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <Ban size={20} className="text-destructive" />
              <div>
                <p className="font-body font-semibold text-sm">Bloquear envio</p>
                <p className="font-body text-xs text-muted-foreground">Impedir que envie dinheiro</p>
              </div>
            </div>
            <Switch
              checked={controls.bloqueio_envio}
              onCheckedChange={(v) => setControls({ ...controls, bloqueio_envio: v })}
            />
          </div>

          {/* Daily limit */}
          <div className="bg-muted rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <Shield size={20} className="text-primary" />
              <div>
                <p className="font-body font-semibold text-sm">Limite diário</p>
                <p className="font-body text-xs text-muted-foreground">Valor máximo de gasto por dia</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg">R$</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={controls.limite_diario}
                onChange={(e) => setControls({ ...controls, limite_diario: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Mini Gerente */}
          <div className="flex items-center justify-between bg-kids-yellow-light rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <Briefcase size={20} className="text-kids-orange" />
              <div>
                <p className="font-body font-semibold text-sm">Mini Gerente</p>
                <p className="font-body text-xs text-muted-foreground">Permite ganhar comissões por indicações</p>
              </div>
            </div>
            <Switch
              checked={controls.is_mini_gerente}
              onCheckedChange={(v) => setControls({ ...controls, is_mini_gerente: v })}
            />
          </div>

          {/* Register Referral (Mini Gerente que indicou) */}
          <div className="bg-kids-yellow-light rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <UserPlus size={20} className="text-kids-orange" />
              <div>
                <p className="font-body font-semibold text-sm">Quem indicou o Pix Kids?</p>
                <p className="font-body text-xs text-muted-foreground">
                  {existingReferrer ? "Mini Gerente responsável cadastrado" : "Cadastre o código do Mini Gerente responsável"}
                </p>
              </div>
            </div>
            {loadingExisting ? (
              <p className="font-body text-xs text-muted-foreground">Carregando...</p>
            ) : existingReferrer ? (
              <div className="space-y-2">
                <div className="bg-card rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="font-body text-xs text-muted-foreground">Mini Gerente cadastrado:</p>
                    <p className="font-display font-bold text-sm">{existingReferrer.nome}</p>
                    <p className="font-body text-xs text-muted-foreground">Código: {existingReferrer.codigo}</p>
                  </div>
                  <div className="flex items-center gap-1 text-kids-green">
                    <CheckCircle size={20} />
                    <span className="text-2xl">👔</span>
                  </div>
                </div>
                <Button
                  onClick={async () => {
                    if (!user) return;
                    const confirmed = window.confirm("Tem certeza que deseja excluir o Mini Gerente cadastrado?");
                    if (!confirmed) return;
                    try {
                      const { data, error } = await supabase.rpc("delete_referral" as any, { _user_id: user.id });
                      const result = data as any;
                      if (error) throw error;
                      if (!result?.success) throw new Error(result?.error || "Erro");
                      toast.success("Mini Gerente removido com sucesso!");
                      setExistingReferrer(null);
                    } catch (err: any) {
                      toast.error(err.message || "Erro ao excluir Mini Gerente.");
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10 font-body"
                >
                  🗑️ Excluir Mini Gerente cadastrado
                </Button>
              </div>
            ) : !referralName ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: 00001"
                  value={referralCode}
                  onChange={(e) => { setReferralCode(e.target.value.replace(/\D/g, "").slice(0, 5)); setReferralName(null); }}
                  className="rounded-xl flex-1"
                />
                <Button
                  onClick={handleLookupReferral}
                  disabled={referralLoading || referralCode.length === 0}
                  size="sm"
                  className="rounded-xl bg-kids-orange text-accent-foreground hover:bg-kids-orange/90 font-display font-bold"
                >
                  {referralLoading ? "..." : "Buscar"}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="bg-card rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="font-body text-xs text-muted-foreground">Mini Gerente encontrado:</p>
                    <p className="font-display font-bold text-sm">{referralName}</p>
                    <p className="font-body text-xs text-muted-foreground">Código: {referralCode}</p>
                  </div>
                  <span className="text-2xl">👔</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => { setReferralName(null); setReferralCode(""); setEditingReferrer(false); }}
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-xl"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleConfirmReferral}
                    disabled={referralLoading}
                    size="sm"
                    className="flex-1 rounded-xl bg-kids-green text-accent-foreground hover:bg-kids-green/90 font-display font-bold"
                  >
                    {referralLoading ? "..." : "✅ Confirmar"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={handleSave}
            disabled={updateKid.isPending}
            className="w-full font-display font-bold rounded-xl py-5 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {updateKid.isPending ? "Salvando..." : "💾 Salvar controles"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ParentalControlsDialog;
