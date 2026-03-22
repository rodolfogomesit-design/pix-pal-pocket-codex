import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles, Star, WalletCards } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

const highlights = [
  "Mesada, metas e saldo em um espaco mais divertido para a crianca",
  "Responsavel acompanha tudo em tempo real com seguranca",
  "Aprendizado financeiro na pratica, sem perder leveza e encanto",
];

const metrics = [
  { label: "Conta gratuita", value: "R$ 0" },
  { label: "Controle dos pais", value: "100%" },
  { label: "Pequenas conquistas", value: "24/7" },
];

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden pb-24 pt-32 md:pb-32 md:pt-40">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.22),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(250,204,21,0.28),transparent_24%),radial-gradient(circle_at_72%_72%,rgba(74,222,128,0.18),transparent_28%),linear-gradient(180deg,rgba(255,251,235,0.72),rgba(255,255,255,1))]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="absolute left-[8%] top-28 -z-10 rounded-full bg-yellow-300/50 p-3 text-yellow-700 shadow-lg shadow-yellow-200/70">
        <Star className="h-5 w-5" />
      </div>
      <div className="absolute right-[12%] top-36 -z-10 rounded-full bg-sky-200/60 p-3 text-sky-700 shadow-lg shadow-sky-200/70">
        <Sparkles className="h-5 w-5" />
      </div>

      <div className="container mx-auto grid gap-14 px-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
          className="max-w-2xl"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/85 px-4 py-2 text-sm font-semibold text-primary shadow-sm backdrop-blur">
            <ShieldCheck className="h-4 w-4" />
            Um jeitinho mais colorido de aprender a cuidar do dinheiro
          </div>

          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-lg font-black text-primary-foreground shadow-lg shadow-primary/20">
              PK
            </div>
            <div>
              <p className="font-display text-2xl font-extrabold tracking-tight text-foreground">
                Pix Kids
              </p>
              <p className="text-sm text-muted-foreground">
                Diversao para a crianca, tranquilidade para a familia
              </p>
            </div>
          </div>

          <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-6xl">
            O universo financeiro da crianca pode ser leve, divertido e cheio de descobertas.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground md:text-xl">
            No Pix Kids, o responsavel acompanha cada passo e a crianca aprende
            com metas, mesada, pequenas recompensas e uma experiencia feita para
            conversar com o mundo infantil.
          </p>

          <div className="mt-8 flex flex-col gap-3 text-sm text-foreground/85">
            {highlights.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary/12 text-xs font-black text-primary">
                  +
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button
              asChild
              size="lg"
              className="group h-14 rounded-full bg-primary px-8 text-base font-bold shadow-xl shadow-primary/20"
            >
              <Link to="/cadastro">
                Criar conta gratuita
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>

            <LoginButton />
          </div>

          <div className="mt-10 grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-3">
            {metrics.map((metric, index) => (
              <div
                key={metric.label}
                className={`rounded-[24px] border border-border/70 p-4 shadow-sm backdrop-blur ${
                  index === 0
                    ? "bg-yellow-50"
                    : index === 1
                      ? "bg-sky-50"
                      : "bg-emerald-50"
                }`}
              >
                <p className="text-2xl font-extrabold tracking-tight text-foreground">
                  {metric.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{metric.label}</p>
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
          <div className="absolute -left-8 top-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -right-8 bottom-6 h-28 w-28 rounded-full bg-yellow-300/25 blur-3xl" />

          <div className="relative overflow-hidden rounded-[34px] border border-border/70 bg-white shadow-[0_30px_90px_-30px_rgba(15,23,42,0.28)]">
            <div className="border-b border-border/70 bg-gradient-to-r from-sky-50 via-white to-yellow-50 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/70">
                    Painel da familia
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
                    Dinheiro com cara de conquista e brincadeira
                  </h2>
                </div>
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <WalletCards className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-6">
              <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-3xl bg-slate-950 p-6 text-white">
                  <p className="text-sm text-white/70">Missao da semana</p>
                  <p className="mt-3 text-4xl font-black tracking-tight">Juntar R$ 80,00</p>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-yellow-300 to-emerald-300" />
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-white/60">
                        Saldo da familia
                      </p>
                      <p className="mt-2 text-xl font-bold">R$ 1.840,00</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-white/60">
                        Meta infantil
                      </p>
                      <p className="mt-2 text-xl font-bold">68%</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-border bg-gradient-to-br from-yellow-50 to-sky-50 p-5">
                  <p className="text-sm font-semibold text-slate-600">
                    Aventuras do dia
                  </p>
                  <div className="mt-4 space-y-3">
                    {[
                      "Guardar parte da mesada",
                      "Concluir uma pequena meta",
                      "Acompanhar o historico com os pais",
                    ].map((action) => (
                      <div
                        key={action}
                        className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm font-medium text-slate-700"
                      >
                        {action}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { name: "Sophia", status: "Guardando para um patins novo", amount: "R$ 480,00" },
                  { name: "Miguel", status: "Missao da semana quase completa", amount: "R$ 320,00" },
                  { name: "Laura", status: "Mesada recebida e meta atualizada", amount: "R$ 420,00" },
                ].map((kid, index) => (
                  <div
                    key={kid.name}
                    className={`rounded-3xl border border-border p-5 shadow-sm ${
                      index === 0
                        ? "bg-yellow-50"
                        : index === 1
                          ? "bg-sky-50"
                          : "bg-emerald-50"
                    }`}
                  >
                    <p className="text-sm font-semibold text-muted-foreground">{kid.name}</p>
                    <p className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">
                      {kid.amount}
                    </p>
                    <p className="mt-3 text-sm text-muted-foreground">{kid.status}</p>
                  </div>
                ))}
              </div>
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
      className="h-14 rounded-full border-primary/20 bg-white/75 px-8 text-base font-bold text-foreground shadow-sm backdrop-blur hover:bg-white"
    >
      <Link to="/login">Entrar e explorar</Link>
    </Button>
  );
};

export default HeroSection;
