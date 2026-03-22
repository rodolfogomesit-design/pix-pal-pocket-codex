import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check, CheckCircle2, Clock, Copy, Loader2, Printer, QrCode } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { printReceipt } from "@/lib/printReceipt";
import WhatsAppButton from "@/components/shared/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PixData {
  external_id: string;
  pix_code: string;
  qrcode_url: string;
  transaction_id: string;
}

const usePlatformFees = (userId?: string) =>
  useQuery({
    queryKey: ["platform-fees", userId],
    queryFn: async () => {
      const { data: globalData, error: globalError } = await supabase
        .from("platform_settings")
        .select("key, value")
        .in("key", ["taxa_fixa_api", "taxa_servico_percent"]);

      if (globalError) throw globalError;

      const globalMap: Record<string, number> = {};
      globalData?.forEach((row: any) => {
        globalMap[row.key] = parseFloat(row.value) || 0;
      });

      if (userId) {
        const { data: customData } = await supabase
          .from("user_custom_fees")
          .select("fee_key, fee_value")
          .eq("user_id", userId)
          .in("fee_key", ["taxa_fixa_api", "taxa_servico_percent"]);

        customData?.forEach((row: any) => {
          const value = parseFloat(row.fee_value);
          if (!Number.isNaN(value)) globalMap[row.fee_key] = value;
        });
      }

      return {
        taxaFixa: globalMap.taxa_fixa_api ?? 0,
        taxaServicoPercent: globalMap.taxa_servico_percent ?? 0,
      };
    },
    enabled: !!userId,
  });

export default function Depositar() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: fees } = usePlatformFees(user?.id);

  const [step, setStep] = useState<"valor" | "qrcode" | "confirmado">("valor");
  const [valor, setValor] = useState("");
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [hasCpf, setHasCpf] = useState<boolean | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("cpf")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          setHasCpf(Boolean(data?.cpf && data.cpf.trim().length > 0));
        });
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (step === "qrcode" && pixData?.external_id) {
      pollingRef.current = setInterval(async () => {
        const { data } = await supabase
          .from("deposits")
          .select("status")
          .eq("external_id", pixData.external_id)
          .single();

        if (data?.status === "confirmado") {
          clearInterval(pollingRef.current!);
          setStep("confirmado");
        }
      }, 3000);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [step, pixData?.external_id]);

  const valorNum = parseFloat(valor) || 0;
  const taxaServico = useMemo(() => {
    if (!fees || valorNum <= 0) return 0;
    return Math.round(valorNum * fees.taxaServicoPercent) / 100;
  }, [valorNum, fees]);
  const taxaFixa = fees?.taxaFixa ?? 0;
  const totalComTaxas = useMemo(() => {
    if (valorNum <= 0) return 0;
    return Math.round((valorNum + taxaFixa + taxaServico) * 100) / 100;
  }, [valorNum, taxaFixa, taxaServico]);

  const handleGenerate = async () => {
    if (!valorNum || valorNum <= 0) {
      toast.error("Informe um valor válido.");
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("woovi-pix", {
        body: { valor: totalComTaxas },
      });

      if (error || !data?.ok) {
        toast.error(data?.error || error?.message || "Erro ao gerar Pix");
        return;
      }

      setPixData({
        external_id: data.external_id,
        pix_code: data.pix_code || "",
        qrcode_url: data.qrcode_url || "",
        transaction_id: data.transaction_id || "",
      });
      setStep("qrcode");
    } catch (error: any) {
      toast.error(error?.message || "Erro inesperado");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!pixData?.pix_code) return;
    navigator.clipboard.writeText(pixData.pix_code);
    setCopied(true);
    toast.success("Código copiado!");
    setTimeout(() => setCopied(false), 2000);
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
          <h1 className="font-display text-xl font-bold">Depositar</h1>
        </div>

        {hasCpf === false && (
          <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-center">
            <p className="mb-2 font-body text-sm font-semibold text-destructive">Dados incompletos no seu perfil</p>
            <p className="mb-3 font-body text-xs text-muted-foreground">
              Para depositar via Pix, é necessário ter CPF cadastrado.
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
              <p className="mb-4 text-sm text-muted-foreground">Qual valor deseja depositar na sua conta?</p>
              <div className="mb-6 flex items-center justify-center gap-2">
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

              {valorNum > 0 && fees && (
                <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm font-body">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Valor do depósito</span>
                    <span className="font-display font-bold">R$ {valorNum.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Taxa da API (fixa)</span>
                    <span className="font-display font-bold">R$ {taxaFixa.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Taxa de serviço ({fees.taxaServicoPercent}%)</span>
                    <span className="font-display font-bold">R$ {taxaServico.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 font-bold text-foreground">
                    <span>Total a pagar</span>
                    <span className="font-display">R$ {totalComTaxas.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            <Button onClick={handleGenerate} disabled={generating || hasCpf === false} className="h-14 w-full rounded-xl text-base font-bold">
              {generating ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Gerando Pix...
                </span>
              ) : (
                "Gerar QR Code Pix"
              )}
            </Button>
          </motion.div>
        )}

        {step === "qrcode" && pixData && (
          <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="rounded-3xl border border-border bg-card p-8 text-center">
              {pixData.qrcode_url ? (
                <img src={pixData.qrcode_url} alt="QR Code Pix" className="mx-auto mb-4 h-48 w-48 rounded-xl" />
              ) : (
                <QrCode className="mx-auto mb-4 h-48 w-48 text-muted-foreground" />
              )}
              <p className="mb-1 font-display text-2xl font-bold text-primary">R$ {totalComTaxas.toFixed(2)}</p>
              <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> Aguardando pagamento...
              </p>
            </div>

            {pixData.pix_code && (
              <div className="rounded-3xl border border-border bg-card p-4">
                <p className="mb-2 text-xs text-muted-foreground">Pix copia e cola:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded-lg bg-muted p-2 text-xs">{pixData.pix_code}</code>
                  <Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0 rounded-xl">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            <div className="rounded-3xl border border-border bg-card p-4 text-center">
              <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Verificando automaticamente a cada 3 segundos...
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setPixData(null);
                setStep("valor");
              }}
              className="h-12 w-full rounded-xl"
            >
              Cancelar / Voltar
            </Button>
          </motion.div>
        )}

        {step === "confirmado" && (
          <motion.div className="rounded-3xl border border-border bg-card p-8 text-center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <CheckCircle2 className="mx-auto mb-4 h-20 w-20 text-kids-green" />
            <h2 className="mb-2 font-display text-2xl font-bold">Depósito confirmado!</h2>
            <p className="mb-4 font-display text-3xl font-bold text-primary">R$ {valorNum.toFixed(2)}</p>
            <p className="mb-8 text-sm text-muted-foreground">O saldo da sua conta foi atualizado.</p>
            <div className="mt-2 flex gap-3">
              <Button
                onClick={() =>
                  printReceipt({
                    tipo: "deposito",
                    valor: valorNum,
                    data: new Date(),
                    status: "confirmado",
                    descricao: "Depósito via Pix",
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
