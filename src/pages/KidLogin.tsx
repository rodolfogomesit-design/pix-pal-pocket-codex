import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useKidAuth } from "@/contexts/KidAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import EmojiBrand from "@/components/branding/EmojiBrand";
import { toast } from "sonner";
import { motion } from "framer-motion";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { ArrowLeft, Home } from "lucide-react";

const KidLogin = () => {
  const [codigo, setCodigo] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const { setKid } = useKidAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (codigo.trim().length === 0) {
      toast.error("Digite seu codigo ou nome!");
      return;
    }
    if (pin.length < 4) {
      toast.error("PIN deve ter pelo menos 4 numeros!");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.rpc("kid_login", {
      _codigo: codigo.trim(),
      _pin: pin,
    });

    if (error) {
      console.error("kid_login error:", error);
      toast.error("Erro ao entrar. Tente novamente.");
      setLoading(false);
      return;
    }
    if (!data || data.length === 0) {
      toast.error("Codigo ou PIN incorretos!");
      setLoading(false);
      return;
    }

    const kidData = data[0] as any;
    setKid({
      id: kidData.id,
      nome: kidData.nome,
      apelido: kidData.apelido,
      idade: kidData.idade,
      codigo_publico: kidData.codigo_publico,
      saldo: Number(kidData.saldo),
      saldo_poupanca: Number(kidData.saldo_poupanca || 0),
      is_frozen: kidData.is_frozen,
      limite_diario: kidData.limite_diario ? Number(kidData.limite_diario) : null,
      aprovacao_transferencias: kidData.aprovacao_transferencias,
      bloqueio_envio: kidData.bloqueio_envio,
      is_mini_gerente: kidData.is_mini_gerente || false,
      referral_code: kidData.referral_code || null,
      saldo_comissao: Number(kidData.saldo_comissao || 0),
    } as any);
    toast.success(`Ola, ${kidData.apelido || kidData.nome}!`);
    navigate("/crianca/dashboard");
    setLoading(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-b from-kids-blue-light via-background to-kids-yellow-light px-4">
      <div className="absolute left-4 top-4">
        <Link to="/" className="flex items-center gap-1 font-body text-sm text-muted-foreground transition-colors hover:text-primary">
          <ArrowLeft size={16} /> Voltar
        </Link>
      </div>
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <div className="flex justify-center">
            <EmojiBrand size={72} />
          </div>
          <h1 className="mt-4 font-display text-3xl font-extrabold text-primary">
            Pix Kids
          </h1>
          <p className="mt-1 font-body text-muted-foreground">Area da crianca</p>
        </div>

        <div className="rounded-[2rem] border border-border bg-card p-8 shadow-2xl">
          <h2 className="mb-6 text-center font-display text-xl font-bold">
            Entrar na minha conta
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label className="font-display text-sm font-bold">Meu codigo ou nome completo</Label>
              <Input
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="12345 ou nome completo"
                className="mt-2 h-14 rounded-2xl border-2 border-primary/20 bg-kids-blue-light text-center font-display text-xl font-bold focus:border-primary"
              />
            </div>

            <div>
              <Label className="font-display text-sm font-bold">Meu PIN</Label>
              <Input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••"
                className="mt-2 h-14 rounded-2xl border-2 border-kids-yellow/30 bg-kids-yellow-light text-center font-display text-2xl font-bold tracking-[0.5em] focus:border-kids-yellow"
                maxLength={6}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-kids-green py-7 font-display text-xl font-bold text-accent-foreground shadow-lg transition-all hover:scale-[1.02] hover:bg-kids-green/90"
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="font-body text-sm text-muted-foreground hover:text-primary">
              ← Voltar para o inicio
            </Link>
            <span className="text-muted-foreground">|</span>
            <Link to="/login" className="font-body text-sm text-muted-foreground hover:text-primary">
              Sou responsavel →
            </Link>
          </div>
          <Link to="/">
            <Button variant="outline" type="button" className="gap-2 rounded-xl">
              <Home size={16} /> Inicio
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default KidLogin;
