import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownToLine, ArrowLeft, ArrowUpFromLine, Home, PiggyBank, Printer } from "lucide-react";
import { toast } from "sonner";

import { useKidAuth } from "@/contexts/KidAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import KidBottomNav from "@/components/kid-dashboard/KidBottomNav";
import { printReceipt } from "@/lib/printReceipt";

type Step = "inicio" | "depositar" | "sacar" | "sucesso";
type Action = "depositar" | "sacar";

const KidPoupar = () => {
  const { kid, setKid } = useKidAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("inicio");
  const [action, setAction] = useState<Action>("depositar");
  const [valor, setValor] = useState("");
  const [loading, setLoading] = useState(false);

  if (!kid) {
    navigate("/crianca");
    return null;
  }

  const handleConfirm = async () => {
    const amount = parseFloat(valor);

    if (!amount || amount <= 0) {
      toast.error("Valor inválido!");
      return;
    }

    if (action === "depositar" && amount > kid.saldo) {
      toast.error("Saldo insuficiente!");
      return;
    }

    if (action === "sacar" && amount > kid.saldo_poupanca) {
      toast.error("Saldo na poupança insuficiente!");
      return;
    }

    setLoading(true);
    const rpcName = action === "depositar" ? "kid_deposit_savings_no_pin" : "kid_withdraw_savings_no_pin";

    const { data, error } = await (supabase.rpc as any)(rpcName, {
      _kid_id: kid.id,
      _valor: amount,
    });

    setLoading(false);

    if (error) {
      console.error("Poupar error:", error);
      toast.error("Erro ao processar. Tente novamente.");
      return;
    }

    const result = data as { success: boolean; error?: string; novo_saldo?: number; novo_poupanca?: number };
    if (!result.success) {
      toast.error(result.error || "Erro");
      return;
    }

    setKid({
      ...kid,
      saldo: result.novo_saldo ?? kid.saldo,
      saldo_poupanca: result.novo_poupanca ?? kid.saldo_poupanca,
    });

    setStep("sucesso");
  };

  const goBack = () => {
    if (step === "depositar" || step === "sacar") {
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
            <span className="text-2xl">🐷</span>
            <span className="font-display text-xl font-bold text-primary">Poupar</span>
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
              <div className="rounded-3xl border-2 border-primary/10 bg-gradient-to-br from-kids-blue-light to-kids-green-light p-6 text-center">
                <PiggyBank size={48} className="mx-auto mb-2 text-primary" />
                <p className="font-body text-sm text-muted-foreground">Minha poupança</p>
                <p className="mt-1 font-display text-4xl font-extrabold text-primary">
                  R$ {kid.saldo_poupanca.toFixed(2)}
                </p>
                <p className="mt-2 font-body text-xs text-muted-foreground">
                  Saldo disponível: R$ {kid.saldo.toFixed(2)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setAction("depositar");
                    setStep("depositar");
                  }}
                  className="rounded-2xl bg-kids-green-light p-5 text-center transition-all hover:scale-[1.03] active:scale-95"
                >
                  <ArrowDownToLine size={28} className="mx-auto mb-2 text-accent" />
                  <span className="font-display text-sm font-bold">Guardar</span>
                  <span className="mt-1 block font-body text-xs text-muted-foreground">Saldo para poupança</span>
                </button>

                <button
                  onClick={() => {
                    setAction("sacar");
                    setStep("sacar");
                  }}
                  className="rounded-2xl bg-kids-yellow-light p-5 text-center transition-all hover:scale-[1.03] active:scale-95"
                >
                  <ArrowUpFromLine size={28} className="mx-auto mb-2 text-kids-yellow" />
                  <span className="font-display text-sm font-bold">Resgatar</span>
                  <span className="mt-1 block font-body text-xs text-muted-foreground">Poupança para saldo</span>
                </button>
              </div>
            </motion.div>
          )}

          {(step === "depositar" || step === "sacar") && (
            <motion.div
              key="valor"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="space-y-4 rounded-3xl border border-border bg-card p-6">
                <h3 className="text-center font-display text-xl font-bold">
                  {action === "depositar" ? "🐷 Quanto guardar?" : "💰 Quanto resgatar?"}
                </h3>

                <div>
                  <Label className="font-display text-sm font-bold">Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={valor}
                    onChange={(event) => setValor(event.target.value)}
                    placeholder="10.00"
                    className="mt-1 h-14 rounded-2xl border-2 border-primary/20 bg-kids-blue-light text-center font-display text-2xl font-bold"
                    autoFocus
                  />
                  <p className="mt-1 text-center font-body text-xs text-muted-foreground">
                    {action === "depositar"
                      ? `Saldo disponível: R$ ${kid.saldo.toFixed(2)}`
                      : `Na poupança: R$ ${kid.saldo_poupanca.toFixed(2)}`}
                  </p>
                </div>

                <Button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="w-full rounded-2xl bg-primary py-6 font-display text-lg font-bold text-primary-foreground shadow-lg"
                >
                  {loading ? "Processando..." : action === "depositar" ? "🐷 Guardar!" : "💰 Resgatar!"}
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
                <span className="mb-3 block text-5xl">{action === "depositar" ? "🐷" : "💰"}</span>
                <p className="font-display text-xl font-bold text-foreground">
                  {action === "depositar" ? "Guardado na poupança!" : "Resgatado da poupança!"}
                </p>
                <p className="mt-2 font-display text-3xl font-extrabold text-primary">
                  R$ {parseFloat(valor).toFixed(2)}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() =>
                    printReceipt({
                      tipo: "mesada",
                      valor: parseFloat(valor),
                      data: new Date(),
                      de: kid.apelido || kid.nome,
                      status: "aprovado",
                      descricao: action === "depositar" ? "Depósito na poupança" : "Resgate da poupança",
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

export default KidPoupar;
