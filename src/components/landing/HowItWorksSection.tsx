import { motion } from "framer-motion";
import { ChartSpline, CreditCard, HandCoins, UserRoundPlus } from "lucide-react";

import ParentDashboardShowcase from "@/components/landing/ParentDashboardShowcase";

const steps = [
  {
    step: "01",
    icon: UserRoundPlus,
    title: "O responsável cria a conta",
    description:
      "O cadastro é rápido e já libera o painel da família para acompanhar saldo, metas e movimentações.",
    chip: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200",
    iconBg: "from-rose-100 to-orange-100 dark:from-rose-500/15 dark:to-orange-500/10",
  },
  {
    step: "02",
    icon: CreditCard,
    title: "A criança recebe seu próprio painel",
    description:
      "Cada criança entra no app com seu código, visualiza saldo, poupança, histórico e aprende usando o próprio espaço.",
    chip: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
    iconBg: "from-amber-100 to-lime-100 dark:from-amber-500/15 dark:to-lime-500/10",
  },
  {
    step: "03",
    icon: HandCoins,
    title: "Pix, mesada e metas entram na rotina",
    description:
      "O responsável envia dinheiro, define limites e a criança passa a guardar, receber e usar com clareza.",
    chip: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200",
    iconBg: "from-sky-100 to-cyan-100 dark:from-sky-500/15 dark:to-cyan-500/10",
  },
  {
    step: "04",
    icon: ChartSpline,
    title: "Cada movimento vira aprendizado",
    description:
      "Histórico, Mini Gerente, comissões e metas ajudam a transformar uso do dinheiro em educação financeira prática.",
    chip: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200",
    iconBg: "from-violet-100 to-fuchsia-100 dark:from-violet-500/15 dark:to-fuchsia-500/10",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <p className="text-base font-extrabold uppercase tracking-[0.24em] text-primary dark:text-sky-200 md:text-lg">
            Como funciona
          </p>
          <h2 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-foreground md:text-6xl dark:text-white">
            Quatro passos para usar o Pix Kids na prática.
          </h2>
          <p className="mt-5 text-lg leading-8 text-muted-foreground dark:text-slate-300/85">
            O responsável controla tudo em um painel, a criança aprende no próprio app e a família acompanha tudo com
            clareza.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          className="mx-auto mb-16 max-w-md"
        >
          <ParentDashboardShowcase />
        </motion.div>

        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="relative"
              >
                <div className="h-full rounded-[30px] border border-white/50 bg-white/80 p-7 shadow-[0_18px_60px_-35px_rgba(15,23,42,0.22)] backdrop-blur dark:border-white/10 dark:bg-slate-950/60 dark:shadow-[0_18px_60px_-35px_rgba(0,0,0,0.55)]">
                  <div className="flex items-center justify-between">
                    <span className={`rounded-full px-3 py-1 text-xs font-black tracking-[0.24em] ${step.chip}`}>
                      {step.step}
                    </span>
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${step.iconBg} text-primary dark:text-white`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="mt-8 font-display text-xl font-bold tracking-tight text-foreground dark:text-white">
                    {step.title}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground dark:text-slate-300/80">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
