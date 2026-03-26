import { useNavigate } from "react-router-dom";
import type { KidSession } from "@/contexts/KidAuthContext";
import { useKidReferralStats } from "@/hooks/useMiniGerente";
import { Snowflake } from "lucide-react";
import { toast } from "sonner";

interface Props {
  kid: KidSession;
}

const KidActions = ({ kid }: Props) => {
  const navigate = useNavigate();
  const { data: stats } = useKidReferralStats(kid.id);

  const saldoComissao = stats?.saldo_comissao || (kid as any).saldo_comissao || 0;

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
          onClick={() => (saldoComissao > 0 ? navigate("/crianca/sacar-comissao") : toast.info("Sem comissão disponível"))}
          className="bg-gradient-to-br from-kids-yellow-light to-kids-orange/20 rounded-2xl p-5 text-center transition-all hover:scale-[1.03] active:scale-95"
        >
          <span className="text-3xl block mb-2">💰</span>
          <span className="font-display font-bold text-sm">Sacar Comissão</span>
          <span className="block font-body text-xs text-muted-foreground mt-1">
            R$ {saldoComissao.toFixed(2)} disponível
          </span>
        </button>
      </div>

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
