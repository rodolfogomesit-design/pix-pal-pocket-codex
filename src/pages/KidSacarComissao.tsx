import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownToLine, ArrowLeft, Home, Printer, Wallet } from "lucide-react";
import { toast } from "sonner";

import { useKidAuth } from "@/contexts/KidAuthContext";
import { useKidReferralStats, useWithdrawCommission } from "@/hooks/useMiniGerente";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import KidBottomNav from "@/components/kid-dashboard/KidBottomNav";
import { printReceipt } from "@/lib/printReceipt";

type Step = "inicio" | "confirmar" | "sucesso";

const KidSacarComissao = () => {
  const { kid, setKid } = useKidAuth();
  const navigate = useNavigate();
  const { data: stats } = useKidReferralStats(kid?.id || null);
  const withdrawCommission = useWithdrawCommission();
  const [step, setStep] = useState<Step>("inicio");
  const [valor, setValor] = useState("");
  const [successAmount, setSuccessAmount] = useState(0);

  if (!kid) {
    navigate("/crianca");
    return null;
  }

  const saldoComissao = stats?.saldo_comissao ?? kid.saldo_comissao ?? 0;

  const handleConfirm = async () => {
    const amount = parseFloat(valor);

    if (!amount || amount <= 0) {
      toast.error("Valor inválido!");
      return;
    }

    if (amount > saldoComissao) {
      toast.error("Comissão insuficiente!");
      return;
    }

    try {
      const result = await withdrawCommission.mutateAsync({ kidId: kid.id, valor: amount });

      setKid({
        ...kid,
        ...(result?.novo_saldo !== undefined && { saldo: Number(result.novo_saldo) }),
        ...(result?.novo_comissao !== undefined && { saldo_comissao: Number(result.novo_comissao) }),
      });

      setSuccessAmount(amount);
      setStep("sucesso");
    } catch (err: any) {
      toast.error(err.message || "Erro ao sacar comissão");
    }
  };

  const goBack = () => {
    if (step === "confirmar") {
      setStep("inicio");
      setValor("");
      return;
    }

    navigate("/crianca/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-kids-blue-light to-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={goBack} className="text-muted-foreground hover:text-primary">
              <ArrowLeft size={22} />
            </button>
            <span className="text-2xl">💰</span>
            <span className="font-display text-xl font-bold text-primary">Sacar comissão</span>
          </div>
          <button
            onClick={() => navigate("/crianca/dashboard")}
            className="flex items-center gap-1 text-xs font-body text-muted-foreground hover:text-primary"
          >
            <Home size={16} /> Início
          </button>
        </div>
      </header>

      <main className="container mx-auto max-w-md px-4 py-6 pb-24">
        <AnimatePresence mode="wait">
          {step === "inicio" && (
            <motion.div
              key="inicio"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="rounded-3xl border-2 border-primary/10 bg-gradient-to-br from-kids-yellow-light to-kids-orange/20 p-6 text-center">
                <Wallet size={48} className="mx-auto mb-2 text-primary" />
                <p className="font-body text-sm text-muted-foreground">Comissão disponível</p>
                <p className="mt-1 font-display text-4xl font-extrabold text-primary">
                  R$ {saldoComissao.toFixed(2)}
                </p>
                <p className="mt-2 font-body text-xs text-muted-foreground">
                  Saldo atual: R$ {kid.saldo.toFixed(2)}
                </p>
              </div>

              <button
                onClick={() => setStep("confirmar")}
                className="w-full rounded-2xl bg-gradient-to-br from-kids-yellow-light to-kids-orange/20 p-5 text-center transition-all hover:scale-[1.03] active:scale-95"
              >
                <ArrowDownToLine size={28} className="mx-auto mb-2 text-kids-orange" />
                <span className="font-display text-sm font-bold">Transferir para meu saldo</span>
                <span className="mt-1 block font-body text-xs text-muted-foreground">
                  Movimentar comissão para saldo principal
                </span>
              </button>
            </motion.div>
          )}

          {step === "confirmar" && (
            <motion.div
              key="confirmar"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="space-y-4 rounded-3xl border border-border bg-card p-6">
                <h3 className="text-center font-display text-xl font-bold">Quanto sacar da comissão?</h3>

                <div>
                  <Label className="font-display text-sm font-bold">Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={valor}
                    onChange={(event) => setValor(event.target.value)}
                    placeholder="10.00"
                    className="mt-1 h-14 rounded-2xl border-2 border-primary/20 bg-kids-yellow-light text-center font-display text-2xl font-bold"
                    autoFocus
                  />
                  <p className="mt-1 text-center font-body text-xs text-muted-foreground">
                    Disponível: R$ {saldoComissao.toFixed(2)}
                  </p>
                </div>

                <Button
                  onClick={handleConfirm}
                  disabled={withdrawCommission.isPending}
                  className="w-full rounded-2xl bg-kids-green py-6 font-display text-lg font-bold text-accent-foreground shadow-lg"
                >
                  {withdrawCommission.isPending ? "Transferindo..." : "Confirmar saque"}
                </Button>
              </div>
            </motion.div>
          )}

          {step === "sucesso" && (
            <motion.div
              key="sucesso"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="rounded-3xl border-2 border-accent/20 bg-kids-green-light p-8 text-center">
                <span className="mb-3 block text-5xl">💰</span>
                <p className="font-display text-xl font-bold text-foreground">Comissão transferida!</p>
                <p className="mt-2 font-display text-3xl font-extrabold text-primary">
                  R$ {successAmount.toFixed(2)}
                </p>
                <p className="mt-2 font-body text-xs text-muted-foreground">
                  Seu saldo foi atualizado automaticamente.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() =>
                    printReceipt({
                      tipo: "comissao",
                      valor: successAmount,
                      data: new Date(),
                      de: kid.apelido || kid.nome,
                      status: "aprovado",
                      descricao: "Saque de comissão para saldo principal",
                    })
                  }
                  variant="outline"
                  className="flex-1 rounded-2xl py-5 font-display font-bold"
                >
                  <Printer size={16} className="mr-2" /> Comprovante
                </Button>
                <Button
                  onClick={() => navigate("/crianca/dashboard")}
                  className="flex-1 rounded-2xl bg-primary py-5 font-display font-bold text-primary-foreground"
                >
                  🏠 Voltar ao início
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <KidBottomNav />
    </div>
  );
};

export default KidSacarComissao;
