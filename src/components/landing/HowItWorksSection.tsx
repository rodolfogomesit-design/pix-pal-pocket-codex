import { motion } from "framer-motion";
import { ChartSpline, CreditCard, HandCoins, UserRoundPlus } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: UserRoundPlus,
    title: "O responsavel cria a aventura",
    description:
      "Tudo comeca com um cadastro rapido e um painel pronto para organizar a vida financeira da familia.",
  },
  {
    step: "02",
    icon: CreditCard,
    title: "A crianca ganha seu proprio perfil",
    description:
      "Cada filho pode ter seu espaco, seu PIN e suas metas sem perder a supervisao central.",
  },
  {
    step: "03",
    icon: HandCoins,
    title: "Mesada, metas e desafios entram no jogo",
    description:
      "Depositos, ajustes e combinados ficam mais claros e viram parte da rotina de aprendizado.",
  },
  {
    step: "04",
    icon: ChartSpline,
    title: "Cada movimento vira conquista",
    description:
      "O historico mostra progresso, ajuda a conversar sobre escolhas e reforca bons habitos.",
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
            Como a aventura comeca
          </p>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">
            Quatro passos para transformar mesada em aprendizado de verdade.
          </h2>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            Tudo foi desenhado para a crianca entender rapido e o responsavel
            sentir que continua no comando.
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
                <div className="h-full rounded-[30px] border border-border/70 bg-white p-7 shadow-[0_18px_60px_-35px_rgba(15,23,42,0.22)]">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-black tracking-[0.24em] text-amber-700">
                      {step.step}
                    </span>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-yellow-100 text-primary">
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
