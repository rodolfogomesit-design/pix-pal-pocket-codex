import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { KidSession } from "@/contexts/KidAuthContext";
import { useKidReferralStats, useWithdrawCommission } from "@/hooks/useMiniGerente";
import { Snowflake, ArrowDownToLine } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  kid: KidSession;
  onTransferSuccess: (updates?: { saldo?: number; saldo_comissao?: number }) => void;
}

const KidActions = ({ kid, onTransferSuccess }: Props) => {
  const navigate = useNavigate();
  const { data: stats } = useKidReferralStats(kid.id);
  const withdrawCommission = useWithdrawCommission();
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const saldoComissao = stats?.saldo_comissao || (kid as any).saldo_comissao || 0;

  const handleWithdraw = async () => {
    const valor = parseFloat(withdrawAmount);
    if (!valor || valor <= 0) {
      toast.error("Valor inválido");
      return;
    }
    try {
      const result = await withdrawCommission.mutateAsync({ kidId: kid.id, valor });
      toast.success(`R$ ${valor.toFixed(2)} transferido para seu saldo! 🎉`);
      setShowWithdraw(false);
      setWithdrawAmount("");
      onTransferSuccess({
        saldo: result?.novo_saldo !== undefined ? Number(result.novo_saldo) : undefined,
        saldo_comissao: result?.novo_comissao !== undefined ? Number(result.novo_comissao) : undefined,
      });
    } catch (err: any) {
      toast.error(err.message || "Erro ao sacar comissão");
    }
  };

  if (kid.is_frozen) {
    return (
      <div className="bg-primary/10 rounded-[2rem] p-8 text-center border-2 border-primary/20">
        <Snowflake size={48} className="text-primary mx-auto mb-3" />
        <p className="font-display text-lg font-bold text-primary">Conta congelada ❄️</p>
        <p className="font-body text-sm text-muted-foreground mt-1">
          Peça para seus pais descongelarem sua conta.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-display text-lg font-bold mb-3">O que você quer fazer? 🤔</h3>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate("/crianca/pagar")}
          className="bg-kids-yellow-light rounded-2xl p-5 text-center transition-all hover:scale-[1.03] active:scale-95"
        >
          <span className="text-3xl block mb-2">📱</span>
          <span className="font-display font-bold text-sm">Pagar um amigo</span>
        </button>

        <button
          onClick={() => navigate("/crianca/pagar-pix")}
          className="bg-kids-green-light rounded-2xl p-5 text-center transition-all hover:scale-[1.03] active:scale-95"
        >
          <span className="text-3xl block mb-2">💠</span>
          <span className="font-display font-bold text-sm">Pagar com Pix</span>
        </button>

        <button
          onClick={() => navigate("/crianca/poupar")}
          className="bg-kids-blue-light rounded-2xl p-5 text-center transition-all hover:scale-[1.03] active:scale-95"
        >
          <span className="text-3xl block mb-2">🐷</span>
          <span className="font-display font-bold text-sm">Poupar</span>
          {kid.saldo_poupanca > 0 && (
            <span className="block font-body text-xs text-muted-foreground mt-1">
              R$ {kid.saldo_poupanca.toFixed(2)} guardados
            </span>
          )}
        </button>

        {/* Sacar Comissão */}
        <button
          onClick={() => saldoComissao > 0 ? setShowWithdraw(true) : toast.info("Sem comissão disponível")}
          className="bg-gradient-to-br from-kids-yellow-light to-kids-orange/20 rounded-2xl p-5 text-center transition-all hover:scale-[1.03] active:scale-95"
        >
          <span className="text-3xl block mb-2">💰</span>
          <span className="font-display font-bold text-sm">Sacar Comissão</span>
          <span className="block font-body text-xs text-muted-foreground mt-1">
            R$ {saldoComissao.toFixed(2)} disponível
          </span>
        </button>
      </div>

      {/* Withdraw modal inline */}
      {showWithdraw && (
        <div className="mt-4 bg-card rounded-2xl border border-border p-4 space-y-3">
          <p className="font-display text-sm font-bold">💰 Sacar comissão para meu saldo</p>
          <p className="font-body text-xs text-muted-foreground">
            Disponível: R$ {saldoComissao.toFixed(2)}
          </p>
          <Input
            type="number"
            placeholder={`Valor (máx R$ ${saldoComissao.toFixed(2)})`}
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            className="rounded-xl"
            step="0.01"
            min="0.01"
            max={saldoComissao}
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
              className="flex-1 rounded-xl bg-kids-green text-accent-foreground hover:bg-kids-green/90 font-display font-bold"
            >
              <ArrowDownToLine size={16} className="mr-1" />
              {withdrawCommission.isPending ? "Sacando..." : "Confirmar"}
            </Button>
          </div>
        </div>
      )}

      {/* Info badges */}
      <div className="flex flex-wrap gap-2 mt-4">
        <span className="bg-muted rounded-full px-3 py-1 font-body text-xs text-muted-foreground">
          📏 Limite: R$ {(kid.limite_diario || 0).toFixed(0)}/dia
        </span>
      </div>
    </div>
  );
};

export default KidActions;
