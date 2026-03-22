import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, WalletCards } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

const highlights = [
  "Acompanhe saldo, limites e movimentacoes em tempo real",
  "Dê autonomia para a crianca com supervisao completa do responsavel",
  "Transforme mesada, metas e rotina em educacao financeira pratica",
];

const metrics = [
  { label: "Controle parental", value: "100%" },
  { label: "Conta gratuita", value: "R$ 0" },
  { label: "Fluxo simplificado", value: "24/7" },
];

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden pb-24 pt-32 md:pb-32 md:pt-40">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(17,94,89,0.16),transparent_32%),radial-gradient(circle_at_85%_20%,rgba(250,204,21,0.18),transparent_28%),linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,1))]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="container mx-auto grid gap-14 px-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
          className="max-w-2xl"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-4 py-2 text-sm font-semibold text-primary shadow-sm backdrop-blur">
            <ShieldCheck className="h-4 w-4" />
            Plataforma para educacao financeira infantil com supervisao real
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
                Carteira digital pensada para familias
              </p>
            </div>
          </div>

          <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-6xl">
            Uma landing que promete menos e entrega mais controle para a familia.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground md:text-xl">
            Organize a rotina financeira dos filhos com uma experiencia clara,
            segura e profissional. O responsavel acompanha tudo em um unico
            painel e a crianca aprende na pratica, sem perder simplicidade.
          </p>

          <div className="mt-8 flex flex-col gap-3 text-sm text-foreground/85">
            {highlights.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button
              asChild
              size="lg"
              className="group h-14 rounded-full px-8 text-base font-bold shadow-xl shadow-primary/20"
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
                className="rounded-2xl border border-border/70 bg-white/80 p-4 shadow-sm backdrop-blur"
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
          <div className="absolute -right-8 bottom-6 h-28 w-28 rounded-full bg-yellow-300/20 blur-3xl" />

          <div className="relative overflow-hidden rounded-[32px] border border-border/70 bg-white shadow-[0_30px_90px_-30px_rgba(15,23,42,0.35)]">
            <div className="border-b border-border/70 bg-slate-50 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/70">
                    Painel da familia
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
                    Visao clara do saldo, limites e metas
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
                  <p className="text-sm text-white/70">Saldo total da familia</p>
                  <p className="mt-3 text-4xl font-black tracking-tight">R$ 1.840,00</p>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-white/60">
                        Responsavel
                      </p>
                      <p className="mt-2 text-xl font-bold">R$ 620,00</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-white/60">
                        Filhos
                      </p>
                      <p className="mt-2 text-xl font-bold">R$ 1.220,00</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-border bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-500">
                    Acoes mais usadas
                  </p>
                  <div className="mt-4 space-y-3">
                    {[
                      "Ajustar saldo com aprovacao",
                      "Definir limites por crianca",
                      "Acompanhar historico em tempo real",
                    ].map((action) => (
                      <div
                        key={action}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
                      >
                        {action}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { name: "Sophia", status: "Meta de economia ativa", amount: "R$ 480,00" },
                  { name: "Miguel", status: "Limite diario configurado", amount: "R$ 320,00" },
                  { name: "Laura", status: "Mesada recebida hoje", amount: "R$ 420,00" },
                ].map((kid) => (
                  <div
                    key={kid.name}
                    className="rounded-3xl border border-border bg-white p-5 shadow-sm"
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
      <Link to="/login">Ver demonstracao do acesso</Link>
    </Button>
  );
};

export default HeroSection;
