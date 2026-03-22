import { motion } from "framer-motion";
import { BellRing, LockKeyhole, PiggyBank, Shield, Smile, Sparkles } from "lucide-react";

const benefits = [
  {
    icon: Shield,
    title: "Pais no controle com leveza",
    description:
      "Acompanhe saldo, limites, transferencias e aprovacoes sem tirar a magia da experiencia infantil.",
  },
  {
    icon: PiggyBank,
    title: "Aprendizado brincando com a rotina",
    description:
      "A crianca aprende a guardar, gastar e cumprir metas usando situacoes reais do dia a dia.",
  },
  {
    icon: Smile,
    title: "Visual acolhedor para o publico kids",
    description:
      "A experiencia conversa com a infancia com mais cor, simpatia e linguagem simples.",
  },
  {
    icon: LockKeyhole,
    title: "Autonomia com rede de seguranca",
    description:
      "Configure PIN, limites diarios e autorizacoes para deixar a liberdade mais segura.",
  },
  {
    icon: BellRing,
    title: "Acompanhamento em tempo real",
    description:
      "Receba contexto das movimentacoes e ajude a orientar cada decisao no momento certo.",
  },
  {
    icon: Sparkles,
    title: "Metas que viram pequenas conquistas",
    description:
      "Historicos e objetivos ajudam a familia a enxergar progresso de um jeito mais motivador.",
  },
];

const BenefitsSection = () => {
  return (
    <section id="beneficios" className="bg-[linear-gradient(180deg,#fffdf5_0%,#f8fbff_100%)] py-20 md:py-28">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/75">
            Por que as familias gostam
          </p>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">
            Um app infantil que continua parecendo seguro para quem cuida da conta.
          </h2>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            O Pix Kids mistura cor, clareza e acompanhamento real para deixar o
            assunto dinheiro mais leve para as criancas e mais confiavel para os pais.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 xl:grid-cols-3">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;

            return (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="rounded-[28px] border border-border/70 bg-white/95 p-7 shadow-[0_18px_60px_-35px_rgba(15,23,42,0.24)]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-gradient-to-br from-primary/15 to-yellow-300/25 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display text-xl font-bold tracking-tight text-foreground">
                  {benefit.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {benefit.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
