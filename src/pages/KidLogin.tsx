import { useState } from "react";

import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useKidAuth } from "@/contexts/KidAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      toast.error("Digite seu código ou nome!");
      return;
    }
    if (pin.length < 4) {
      toast.error("PIN deve ter pelo menos 4 números!");
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
      toast.error("Código ou PIN incorretos! 😢");
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
    toast.success(`Olá, ${kidData.apelido || kidData.nome}! 🎉`);
    navigate("/crianca/dashboard");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-kids-blue-light via-background to-kids-yellow-light flex items-center justify-center px-4 relative">
      <div className="absolute top-4 left-4">
        <Link to="/" className="flex items-center gap-1 font-body text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft size={16} /> Voltar
        </Link>
      </div>
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <span className="text-5xl">🐷</span>
          <h1 className="font-display text-3xl font-extrabold text-primary mt-4">
            Pix Kids
          </h1>
          <p className="font-body text-muted-foreground mt-1">Área da criança 🧒</p>
        </div>

        <div className="bg-card rounded-[2rem] shadow-2xl border border-border p-8">
          <h2 className="font-display text-xl font-bold text-center mb-6">
            Entrar na minha conta ✨
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label className="font-display font-bold text-sm">Meu código ou nome completo 🔢</Label>
              <Input
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="12345 ou nome completo"
                className="rounded-2xl mt-2 text-center text-xl font-display font-bold h-14 bg-kids-blue-light border-2 border-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <Label className="font-display font-bold text-sm">Meu PIN 🔑</Label>
              <Input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••"
                className="rounded-2xl mt-2 text-center text-2xl font-display font-bold tracking-[0.5em] h-14 bg-kids-yellow-light border-2 border-kids-yellow/30 focus:border-kids-yellow"
                maxLength={6}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full font-display font-bold text-xl rounded-2xl py-7 bg-kids-green text-accent-foreground hover:bg-kids-green/90 shadow-lg transition-all hover:scale-[1.02]"
            >
              {loading ? "Entrando... 🐷" : "🚀 Entrar!"}
            </Button>
          </form>
        </div>

        <div className="flex flex-col items-center gap-3 mt-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="font-body text-sm text-muted-foreground hover:text-primary">
              ← Voltar para o início
            </Link>
            <span className="text-muted-foreground">|</span>
            <Link to="/login" className="font-body text-sm text-muted-foreground hover:text-primary">
              Sou responsável →
            </Link>
          </div>
          <Link to="/">
            <Button variant="outline" type="button" className="rounded-xl gap-2">
              <Home size={16} /> Início
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default KidLogin;
