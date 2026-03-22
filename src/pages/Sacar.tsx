import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Loader2, Printer, Wallet } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { useParentBalance } from "@/hooks/useDashboard";
import { supabase } from "@/integrations/supabase/client";
import { printReceipt } from "@/lib/printReceipt";
import WhatsAppButton from "@/components/shared/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function extractFunctionErrorMessage(error: unknown) {
  if (!error || typeof error !== "object") return null;
  const maybeError = error as { message?: string; context?: { json?: unknown; body?: unknown } };
  if (maybeError.context?.json && typeof maybeError.context.json === "object") {
    const payload = maybeError.context.json as { error?: string; message?: string };
    return payload.error || payload.message || null;
  }
  if (maybeError.context?.body && typeof maybeError.context.body === "object") {
    const payload = maybeError.context.body as { error?: string; message?: string };
    return payload.error || payload.message || null;
  }
  return maybeError.message || null;
}

export default function Sacar() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: parentBalance = 0 } = useParentBalance();

  const [step, setStep] = useState<"valor" | "confirmado">("valor");
  const [valor, setValor] = useState("");
  const [processing, setProcessing] = useState(false);
  const [chavePix, setChavePix] = useState<string | null>(null);
  const [hasChavePix, setHasChavePix] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("chave_pix")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          const pix = data?.chave_pix?.trim() || "";
          setHasChavePix(pix.length > 0);
          setChavePix(pix || null);
        });
    }
  }, [user]);

  const valorNum = parseFloat(valor) || 0;

  const handleWithdraw = async () => {
    if (!valorNum || valorNum <= 0) {
      toast.error("Informe um valor válido");
      return;
    }
    if (valorNum > parentBalance) {
      toast.error("Saldo insuficiente");
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("asaas-pixout", {
        body: { valor: valorNum },
      });

      if (error) {
        toast.error(extractFunctionErrorMessage(error) || error.message || "Erro ao solicitar saque");
        return;
      }

      const result = data as { ok: boolean; error?: string };
      if (!result?.ok) {
        toast.error(result?.error || "Erro ao solicitar saque");
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["parent-balance"] });
      setStep("confirmado");
    } catch (error: any) {
      toast.error(error?.message || "Erro inesperado");
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-lg">
        <div className="mb-8 flex items-center gap-3 pt-2">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-display text-xl font-bold">Sacar via Pix</h1>
        </div>

        {hasChavePix === false && (
          <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-center">
            <p className="mb-2 font-body text-sm font-semibold text-destructive">Chave Pix não cadastrada</p>
            <p className="mb-3 font-body text-xs text-muted-foreground">
              Para sacar via Pix, é necessário ter uma chave Pix cadastrada no seu perfil.
            </p>
            <Link to="/perfil">
              <Button size="sm" variant="outline" className="rounded-xl">
                Ir para Perfil
              </Button>
            </Link>
          </div>
        )}

        {step === "valor" && (
          <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="rounded-3xl border border-border bg-card p-8 text-center">
              <Wallet className="mx-auto mb-4 h-12 w-12 text-primary" />
              <p className="mb-2 text-sm text-muted-foreground">Saldo disponível</p>
              <p className="mb-6 font-display text-2xl font-bold text-primary">R$ {parentBalance.toFixed(2)}</p>

              {chavePix && (
                <div className="mb-6 rounded-2xl bg-muted p-3">
                  <p className="font-body text-xs text-muted-foreground">Chave Pix cadastrada</p>
                  <p className="mt-1 font-display text-sm font-bold">{chavePix}</p>
                </div>
              )}

              <p className="mb-4 text-sm text-muted-foreground">Qual valor deseja sacar?</p>
              <div className="mb-4 flex items-center justify-center gap-2">
                <span className="text-2xl text-muted-foreground">R$</span>
                <Input
                  type="number"
                  value={valor}
                  onChange={(event) => setValor(event.target.value)}
                  placeholder="0,00"
                  className="h-auto w-48 border-none bg-transparent text-center font-display text-4xl font-bold focus-visible:ring-0"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <Button
              onClick={handleWithdraw}
              disabled={processing || hasChavePix === false || valorNum <= 0}
              className="h-14 w-full rounded-xl text-base font-bold"
            >
              {processing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Processando...
                </span>
              ) : (
                "Solicitar Saque"
              )}
            </Button>
          </motion.div>
        )}

        {step === "confirmado" && (
          <motion.div className="rounded-3xl border border-border bg-card p-8 text-center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <CheckCircle2 className="mx-auto mb-4 h-20 w-20 text-kids-green" />
            <h2 className="mb-2 font-display text-2xl font-bold">Saque solicitado!</h2>
            <p className="mb-2 font-display text-3xl font-bold text-primary">R$ {valorNum.toFixed(2)}</p>
            <p className="mb-2 text-sm text-muted-foreground">O valor será enviado para sua chave Pix:</p>
            <p className="mb-6 font-display text-sm font-bold text-primary">{chavePix}</p>
            <p className="mb-8 text-xs text-muted-foreground">O processamento pode levar alguns minutos.</p>
            <div className="mt-2 flex gap-3">
              <Button
                onClick={() =>
                  printReceipt({
                    tipo: "saque",
                    valor: valorNum,
                    data: new Date(),
                    chavePix: chavePix || undefined,
                    status: "solicitado",
                    descricao: "Saque via Pix",
                  })
                }
                variant="outline"
                className="h-12 flex-1 rounded-xl font-bold"
              >
                <Printer className="mr-2 h-4 w-4" /> Comprovante
              </Button>
              <Link to="/dashboard" className="flex-1">
                <Button className="h-12 w-full rounded-xl font-bold">Voltar ao dashboard</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
      <WhatsAppButton />
    </div>
  );
}
