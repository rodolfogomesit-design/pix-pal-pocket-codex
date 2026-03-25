import { useState } from "react";
import { useKidReferralStats, useWithdrawCommission } from "@/hooks/useMiniGerente";
import { useKidAuth } from "@/contexts/KidAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Copy, Check, TrendingUp, Users, DollarSign, ArrowDownToLine, UserPlus } from "lucide-react";

const KidMiniGerente = () => {
  const { kid, setKid } = useKidAuth();
  const { data: stats, isLoading } = useKidReferralStats(kid?.id || null);
  const withdrawCommission = useWithdrawCommission();
  const [copied, setCopied] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [referralCode, setReferralCode] = useState("");
  
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralName, setReferralName] = useState<string | null>(null);

  if (!kid) return null;

  const copyCode = () => {
    if (kid && kid.codigo_publico) {
      navigator.clipboard.writeText(kid.codigo_publico);
      setCopied(true);
      toast.success("Código copiado!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWithdraw = async () => {
    const valor = parseFloat(withdrawAmount);
    if (!valor || valor <= 0) {
      toast.error("Valor inválido");
      return;
    }
    try {
      const result = await withdrawCommission.mutateAsync({ kidId: kid.id, valor });
      toast.success(`R$ ${valor.toFixed(2)} transferido para seu saldo! `);
      if (result?.novo_saldo !== undefined) {
        setKid({ ...kid, saldo: result.novo_saldo });
      }
      setShowWithdraw(false);
      setWithdrawAmount("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao sacar comissão");
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <span className="text-4xl animate-bounce inline-block"></span>
        <p className="font-body text-muted-foreground mt-2">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-kids-yellow to-kids-orange rounded-2xl p-5 text-center">
        <span className="text-4xl"></span>
        <h2 className="font-display text-xl font-bold mt-2">Mini Gerente Pix Kid</h2>
        <p className="font-body text-sm opacity-80 mt-1">
          Indique amigos e ganhe comissões!
        </p>
      </div>

      {/* Referral Code */}
      {kid.codigo_publico && (
        <div className="bg-card rounded-2xl border border-border p-4 text-center">
          <p className="font-body text-sm text-muted-foreground mb-2">Seu código de indicação:</p>
          <button
            onClick={copyCode}
            className="inline-flex items-center gap-2 bg-primary/10 text-primary px-6 py-3 rounded-xl font-display text-2xl font-bold hover:bg-primary/20 transition-colors"
          >
            {kid.codigo_publico}
            {copied ? <Check size={20} /> : <Copy size={20} />}
          </button>
          <p className="font-body text-xs text-muted-foreground mt-2">
            Compartilhe este código com amigos!
          </p>
        </div>
      )}

      {/* Register my mini gerente */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <UserPlus size={18} className="text-kids-orange" />
          <p className="font-body text-sm font-semibold">
            {stats?.existing_referrer ? "Meu Mini Gerente" : "Cadastrar meu Mini Gerente"}
          </p>
        </div>

        {stats?.existing_referrer ? (
          <div className="bg-muted rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="font-body text-xs text-muted-foreground">Mini Gerente cadastrado:</p>
              <p className="font-display font-bold text-sm">{stats.existing_referrer.referrer_name}</p>
              <p className="font-body text-xs text-muted-foreground">Código: {stats.existing_referrer.referrer_codigo}</p>
            </div>
            <span className="text-2xl"></span>
          </div>
        ) : (
          <>
            <p className="font-body text-xs text-muted-foreground mb-3">
              Quem te indicou o Pix Kids? Cadastre o código dele!
            </p>
            <div className="space-y-2">
              {!referralName ? (
                <>
                  <Input
                    placeholder="Código do Mini Gerente (ex: 12345)"
                    value={referralCode}
                    onChange={(e) => { setReferralCode(e.target.value.replace(/\D/g, "").slice(0, 5)); setReferralName(null); }}
                    className="rounded-xl"
                  />
                  <Button
                    onClick={async () => {
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
                        } else {
                          setReferralName(result.nome);
                        }
                      } catch {
                        toast.error("Erro ao buscar código.");
                      }
                      setReferralLoading(false);
                    }}
                    disabled={referralLoading || referralCode.length === 0}
                    className="w-full rounded-xl bg-kids-orange text-accent-foreground hover:bg-kids-orange/90 font-display font-bold"
                  >
                    {referralLoading ? "Buscando..." : " Buscar Mini Gerente"}
                  </Button>
                </>
              ) : (
                <>
                  <div className="bg-muted rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="font-body text-xs text-muted-foreground">Mini Gerente encontrado:</p>
                      <p className="font-display font-bold text-sm">{referralName}</p>
                      <p className="font-body text-xs text-muted-foreground">Código: {referralCode}</p>
                    </div>
                    <span className="text-2xl"></span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => { setReferralName(null); setReferralCode(""); }}
                      variant="outline"
                      className="flex-1 rounded-xl"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={async () => {
                        setReferralLoading(true);
                        try {
                          const { data, error } = await supabase.rpc("kid_register_referral" as any, {
                            _kid_id: kid!.id,
                            _pin: "0000",
                            _referral_code: referralCode.trim(),
                          });
                          const result = data as any;
                          if (error) throw error;
                          if (!result?.success) {
                            toast.error(result?.error || "Erro ao cadastrar.");
                          } else {
                            toast.success(`Mini Gerente ${result.referrer_name} cadastrado! `);
                            setReferralCode("");
                            setReferralName(null);
                          }
                        } catch (err: any) {
                          toast.error(err.message || "Erro ao cadastrar.");
                        }
                        setReferralLoading(false);
                      }}
                      disabled={referralLoading}
                      className="flex-1 rounded-xl bg-kids-green text-accent-foreground hover:bg-kids-green/90 font-display font-bold"
                    >
                      {referralLoading ? "..." : " Confirmar"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <Users size={18} className="text-primary mx-auto mb-1" />
          <p className="font-display text-xl font-bold">{stats?.total_referrals || 0}</p>
          <p className="font-body text-[10px] text-muted-foreground">Indicados</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <TrendingUp size={18} className="text-kids-green mx-auto mb-1" />
          <p className="font-display text-xl font-bold">R$ {(stats?.total_earned || 0).toFixed(2)}</p>
          <p className="font-body text-[10px] text-muted-foreground">Total ganho</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <DollarSign size={18} className="text-kids-yellow mx-auto mb-1" />
          <p className="font-display text-xl font-bold">R$ {(stats?.saldo_comissao || 0).toFixed(2)}</p>
          <p className="font-body text-[10px] text-muted-foreground">Disponível</p>
        </div>
      </div>

      {/* Withdraw button */}
      {(stats?.saldo_comissao || 0) > 0 && (
        <div className="bg-card rounded-2xl border border-border p-4">
          {!showWithdraw ? (
            <Button
              onClick={() => setShowWithdraw(true)}
              className="w-full rounded-xl bg-kids-green text-accent-foreground hover:bg-kids-green/90 font-display font-bold"
            >
              <ArrowDownToLine size={18} className="mr-2" />
              Sacar para meu saldo
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="font-body text-sm font-semibold">Sacar comissão</p>
              <Input
                type="number"
                placeholder={`Máximo: R$ ${(stats?.saldo_comissao || 0).toFixed(2)}`}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="rounded-xl"
                step="0.01"
                min="0.01"
                max={stats?.saldo_comissao || 0}
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => { setShowWithdraw(false); setWithdrawAmount(""); }}
                  variant="outline"
                  className="flex-1 rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleWithdraw}
                  disabled={withdrawCommission.isPending}
                  className="flex-1 rounded-xl bg-kids-green text-accent-foreground hover:bg-kids-green/90"
                >
                  {withdrawCommission.isPending ? "Sacando..." : "Confirmar"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Referrals list */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-display text-sm font-bold"> Meus indicados</h3>
        </div>
        {stats?.referrals && stats.referrals.length > 0 ? (
          <div className="divide-y divide-border">
            {stats.referrals.map((ref) => (
              <div key={ref.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="font-body text-sm font-semibold">{ref.referred_name || "Usuário"}</p>
                  <p className="font-body text-xs text-muted-foreground">
                    ID: {ref.referred_codigo} • {format(new Date(ref.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <span className="font-display text-sm font-bold text-kids-green">
                  +R$ {Number(ref.total_comissao).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-8 text-center">
            <p className="font-body text-sm text-muted-foreground">Nenhum indicado ainda</p>
            <p className="font-body text-xs text-muted-foreground mt-1">Compartilhe seu código!</p>
          </div>
        )}
      </div>

      {/* Commission history */}
      {stats?.commissions && stats.commissions.length > 0 && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-display text-sm font-bold"> Histórico de ganhos</h3>
          </div>
          <div className="divide-y divide-border">
            {stats.commissions.map((com) => (
              <div key={com.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="font-body text-xs text-muted-foreground">
                    Depósito de R$ {Number(com.valor_deposito).toFixed(2)} ({com.taxa_percentual}%)
                  </p>
                  <p className="font-body text-[10px] text-muted-foreground">
                    {format(new Date(com.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <span className="font-display text-sm font-bold text-kids-green">
                  +R$ {Number(com.valor_comissao).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default KidMiniGerente;
