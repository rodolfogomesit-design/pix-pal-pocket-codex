import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Copy, LogOut } from "lucide-react";
import { toast } from "sonner";

import { useKidAuth } from "@/contexts/KidAuthContext";
import { supabase } from "@/integrations/supabase/client";
import KidActions from "@/components/kid-dashboard/KidActions";
import KidBalance from "@/components/kid-dashboard/KidBalance";
import KidHistory from "@/components/kid-dashboard/KidHistory";
import KidMiniGerente from "@/components/kid-dashboard/KidMiniGerente";
import ThemeToggle from "@/components/theme/ThemeToggle";

type Tab = "home" | "historico" | "gerente";

const KidDashboard = () => {
  const { kid, logout, setKid } = useKidAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("home");
  const [codeCopied, setCodeCopied] = useState(false);

  const copyCode = useCallback(() => {
    if (!kid) return;
    navigator.clipboard.writeText(kid.codigo_publico);
    setCodeCopied(true);
    toast.success("Código copiado!");
    setTimeout(() => setCodeCopied(false), 2000);
  }, [kid]);

  useEffect(() => {
    if (!kid) {
      navigate("/crianca");
    }
  }, [kid, navigate]);

  useEffect(() => {
    if (!kid) return;

    const channel = supabase
      .channel(`kid-balance-${kid.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "kids_profiles",
          filter: `id=eq.${kid.id}`,
        },
        (payload) => {
          const updated = payload.new as any;
          setKid((currentKid) => {
            if (!currentKid) return currentKid;

            return {
              ...currentKid,
              saldo: Number(updated.saldo),
              saldo_poupanca: Number(updated.saldo_poupanca ?? currentKid.saldo_poupanca),
              is_frozen: updated.is_frozen,
              limite_diario: updated.limite_diario,
              aprovacao_transferencias: updated.aprovacao_transferencias,
              bloqueio_envio: updated.bloqueio_envio,
              ...(updated.is_mini_gerente !== undefined && { is_mini_gerente: updated.is_mini_gerente }),
              ...(updated.referral_code !== undefined && { referral_code: updated.referral_code }),
              ...(updated.saldo_comissao !== undefined && { saldo_comissao: Number(updated.saldo_comissao) }),
            } as any;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [kid, setKid]);

  if (!kid) return null;

  const handleLogout = () => {
    logout();
    navigate("/crianca");
  };

  const isMiniGerente = (kid as any).is_mini_gerente;
  const tabs = [
    { id: "home" as Tab, label: "🏠 Início", emoji: "🏠" },
    { id: "historico" as Tab, label: "📊 Histórico", emoji: "📊" },
    ...(isMiniGerente ? [{ id: "gerente" as Tab, label: "👑 Gerente", emoji: "👑" }] : []),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-kids-blue-light via-background to-kids-green-light">
      <header className="rounded-b-[2rem] bg-primary px-4 py-4 text-primary-foreground shadow-lg">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setTab("home")} className="text-primary-foreground/80 transition-colors hover:text-primary-foreground">
              <ArrowLeft size={18} />
            </button>
            <div>
              <p className="font-display text-lg font-bold">Olá, {kid.apelido || kid.nome}! 👋</p>
              <button onClick={copyCode} className="flex items-center gap-1 font-body text-xs opacity-80 transition-colors hover:opacity-100">
                Código: {kid.codigo_publico}
                {codeCopied ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={handleLogout} className="flex items-center gap-1 text-sm font-body opacity-80 hover:opacity-100">
              <LogOut size={16} /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 pb-24">
        <AnimatePresence mode="wait">
          {tab === "home" && (
            <motion.div key="home" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
              <KidBalance saldo={kid.saldo} />
              <KidActions kid={kid} />
            </motion.div>
          )}

          {tab === "historico" && (
            <motion.div key="historico" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <KidHistory kidId={kid.id} />
            </motion.div>
          )}

          {tab === "gerente" && isMiniGerente && (
            <motion.div key="gerente" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <KidMiniGerente />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[2rem] border-t border-border bg-card px-4 py-3 shadow-2xl">
        <div className="mx-auto flex max-w-lg justify-around">
          {tabs.map((currentTab) => (
            <button
              key={currentTab.id}
              onClick={() => setTab(currentTab.id)}
              className={`flex flex-col items-center gap-1 rounded-2xl px-4 py-2 text-xs font-body font-semibold transition-all ${
                tab === currentTab.id ? "scale-105 bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="text-xl">{currentTab.emoji}</span>
              {currentTab.label.split(" ")[1]}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default KidDashboard;
