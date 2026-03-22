import { motion } from "framer-motion";
import { ChartSpline, CreditCard, HandCoins, UserRoundPlus } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: UserRoundPlus,
    title: "O responsavel cria a base da conta",
    description:
      "Cadastro rapido com acesso ao painel principal, configuracoes iniciais e visao consolidada da familia.",
  },
  {
    step: "02",
    icon: CreditCard,
    title: "Cada crianca recebe seu proprio perfil",
    description:
      "A familia separa usuarios, limites e PINs sem perder a administracao centralizada do responsavel.",
  },
  {
    step: "03",
    icon: HandCoins,
    title: "Mesadas, metas e repasses entram na rotina",
    description:
      "Depositos, ajustes e acompanhamentos passam a fazer parte do dia a dia com menos atrito.",
  },
  {
    step: "04",
    icon: ChartSpline,
    title: "O aprendizado aparece no comportamento",
    description:
      "Historico, objetivos e aprovacoes ajudam a transformar cada movimentacao em decisao educativa.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="como-funciona" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/75">
            Como funciona
          </p>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">
            Um fluxo simples para entrar rapido e continuar usando com consistencia.
          </h2>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            A plataforma foi desenhada para reduzir friccao e deixar claro o que
            cada membro da familia pode fazer em cada etapa.
          </p>
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
                <div className="h-full rounded-[30px] border border-border/70 bg-white p-7 shadow-[0_18px_60px_-35px_rgba(15,23,42,0.32)]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black tracking-[0.24em] text-primary/60">
                      {step.step}
                    </span>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="mt-8 font-display text-xl font-bold tracking-tight text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">
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
