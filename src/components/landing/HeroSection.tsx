import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles, Star, WalletCards } from "lucide-react";
import { Link } from "react-router-dom";

import KidDashboardPreview from "@/components/landing/KidDashboardPreview";
import { Button } from "@/components/ui/button";

const highlights = [
  "Mesada, metas e saldo em um espaço divertido para a criança.",
  "Responsável acompanha tudo em tempo real com segurança.",
  "Aprendizado financeiro na prática com cor, leveza e autonomia.",
  "Mini Gerente Pix Kids: aprender, indicar e ganhar.",
];

const metrics = [
  { label: "Conta gratuita", value: "R$ 0", tone: "from-rose-100 to-orange-100 dark:from-rose-950/50 dark:to-orange-950/40" },
  { label: "Controle dos pais", value: "100%", tone: "from-sky-100 to-cyan-100 dark:from-sky-950/50 dark:to-cyan-950/40" },
  { label: "Conquistas diárias", value: "24/7", tone: "from-emerald-100 to-lime-100 dark:from-emerald-950/50 dark:to-lime-950/40" },
];

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden pb-24 pt-32 md:pb-32 md:pt-40">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(251,113,133,0.24),transparent_28%),radial-gradient(circle_at_82%_16%,rgba(250,204,21,0.25),transparent_23%),radial-gradient(circle_at_78%_54%,rgba(34,197,94,0.18),transparent_24%),radial-gradient(circle_at_16%_78%,rgba(56,189,248,0.2),transparent_26%),radial-gradient(circle_at_64%_82%,rgba(168,85,247,0.18),transparent_28%),linear-gradient(180deg,rgba(255,252,242,0.88),rgba(255,255,255,1))] dark:bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.26),transparent_28%),radial-gradient(circle_at_82%_16%,rgba(245,158,11,0.22),transparent_23%),radial-gradient(circle_at_78%_54%,rgba(34,197,94,0.18),transparent_24%),radial-gradient(circle_at_16%_78%,rgba(14,165,233,0.2),transparent_26%),radial-gradient(circle_at_64%_82%,rgba(139,92,246,0.22),transparent_28%),linear-gradient(180deg,rgba(2,6,23,0.96),rgba(15,23,42,1))]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="absolute left-[8%] top-28 -z-10 rounded-full bg-yellow-300/60 p-3 text-yellow-700 shadow-lg shadow-yellow-200/70 dark:bg-yellow-400/15 dark:text-yellow-200 dark:shadow-yellow-950/20">
        <Star className="h-5 w-5" />
      </div>
      <div className="absolute right-[12%] top-36 -z-10 rounded-full bg-fuchsia-200/70 p-3 text-fuchsia-700 shadow-lg shadow-fuchsia-200/70 dark:bg-fuchsia-400/15 dark:text-fuchsia-200 dark:shadow-fuchsia-950/20">
        <Sparkles className="h-5 w-5" />
      </div>

      <div className="container mx-auto grid gap-14 px-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
          className="max-w-2xl"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/75 px-4 py-2 text-sm font-semibold text-primary shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 dark:text-sky-200">
            <ShieldCheck className="h-4 w-4" />
            Pix infantil com mesada, metas e supervisão dos pais
          </div>

          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#fb7185,#f59e0b,#22c55e,#38bdf8,#8b5cf6)] text-lg font-black text-white shadow-lg shadow-fuchsia-300/40 dark:shadow-fuchsia-950/30">
              PK
            </div>
            <div>
              <p className="font-display text-2xl font-extrabold tracking-tight text-foreground">Pix Kids</p>
              <p className="text-sm text-muted-foreground dark:text-slate-300/80">
                Pix para crianças com uma experiência simples para toda a família
              </p>
            </div>
          </div>

          <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-6xl dark:text-white">
            O Pix Kids ajuda a criança a aprender sobre dinheiro usando Pix, metas e mesada digital.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground md:text-xl dark:text-slate-300/85">
            O responsável acompanha saldo, limites e transferências em um único painel, enquanto a criança usa o app
            para receber, guardar e entender melhor como cuidar do próprio dinheiro.
          </p>

          <div className="mt-8 flex flex-col gap-3 text-sm text-foreground/85 dark:text-slate-200/90">
            {highlights.map((item, index) => {
              const tones = [
                "from-rose-500 to-orange-400",
                "from-sky-500 to-cyan-400",
                "from-violet-500 to-fuchsia-400",
                "from-emerald-500 to-lime-400",
              ];

              return (
                <div key={item} className="flex items-start gap-3">
                  <span
                    className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r ${tones[index]} text-xs font-black text-white shadow-sm`}
                  >
                    +
                  </span>
                  <span>{item}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button
              asChild
              size="lg"
              className="group h-14 rounded-full border-0 bg-[linear-gradient(135deg,#fb7185,#f59e0b,#22c55e,#38bdf8,#8b5cf6)] px-8 text-base font-bold text-white shadow-xl shadow-fuchsia-300/30 hover:opacity-95 dark:shadow-fuchsia-950/30"
            >
              <Link to="/cadastro">
                Criar conta gratuita
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>

            <LoginButton />
          </div>

          <div className="mt-10 grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-3">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className={`rounded-[24px] border border-white/40 bg-gradient-to-br ${metric.tone} p-4 shadow-sm backdrop-blur dark:border-white/10`}
              >
                <p className="text-2xl font-extrabold tracking-tight text-foreground dark:text-white">{metric.value}</p>
                <p className="mt-1 text-sm text-muted-foreground dark:text-slate-300/80">{metric.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="relative"
        >
          <div className="absolute -left-8 top-10 h-32 w-32 rounded-full bg-fuchsia-300/20 blur-3xl dark:bg-fuchsia-700/20" />
          <div className="absolute -right-8 bottom-6 h-28 w-28 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-700/20" />

          <div className="relative overflow-hidden rounded-[34px] border border-white/50 bg-white/80 shadow-[0_30px_90px_-30px_rgba(15,23,42,0.28)] backdrop-blur dark:border-white/10 dark:bg-slate-950/70 dark:shadow-[0_30px_90px_-30px_rgba(0,0,0,0.75)]">
            <div className="border-b border-white/40 bg-[linear-gradient(90deg,rgba(251,191,36,0.22),rgba(255,255,255,0.55),rgba(56,189,248,0.22),rgba(168,85,247,0.18))] px-6 py-4 dark:border-white/10 dark:bg-[linear-gradient(90deg,rgba(251,191,36,0.08),rgba(30,41,59,0.58),rgba(56,189,248,0.12),rgba(168,85,247,0.1))]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/70 dark:text-sky-200/80">
                    Painel da família
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Pix, metas e acompanhamento financeiro no mesmo lugar
                  </h2>
                </div>
                <div className="rounded-2xl bg-primary/10 p-3 text-primary dark:bg-white/10 dark:text-sky-200">
                  <WalletCards className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <KidDashboardPreview />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const LoginButton = () => {
  return (
    <Button
      asChild
      size="lg"
      variant="outline"
      className="h-14 rounded-full border-white/40 bg-white/75 px-8 text-base font-bold text-foreground shadow-sm backdrop-blur hover:bg-white dark:border-white/10 dark:bg-slate-950/60 dark:text-white dark:hover:bg-slate-900"
    >
      <Link to="/login">Entrar e explorar</Link>
    </Button>
  );
};

export default HeroSection;
