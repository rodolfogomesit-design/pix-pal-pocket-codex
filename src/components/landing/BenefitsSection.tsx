import { motion } from "framer-motion";
import { BellRing, ChartNoAxesCombined, LockKeyhole, PiggyBank, Shield, Smartphone } from "lucide-react";

const benefits = [
  {
    icon: Shield,
    title: "Governanca financeira para os pais",
    description:
      "Acompanhe saldo, limites, transferencias e aprovacoes em um unico painel com mais clareza.",
  },
  {
    icon: PiggyBank,
    title: "Educacao financeira com contexto real",
    description:
      "A crianca aprende a guardar, gastar e cumprir metas usando a propria rotina, nao so teoria.",
  },
  {
    icon: Smartphone,
    title: "Experiencia simples para a familia",
    description:
      "Acesso intuitivo para responsavel e crianca, com fluxos curtos e linguagem facil de entender.",
  },
  {
    icon: LockKeyhole,
    title: "Mais controle, menos improviso",
    description:
      "Configure PIN, limites diarios e autorizacoes para transformar autonomia em seguranca pratica.",
  },
  {
    icon: BellRing,
    title: "Acompanhamento em tempo real",
    description:
      "Receba o contexto das movimentacoes e reaja rapido sempre que precisar orientar ou corrigir.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Visibilidade para evolucao financeira",
    description:
      "Historicos, relatorios e metas ajudam a familia a enxergar progresso de forma objetiva.",
  },
];

const BenefitsSection = () => {
  return (
    <section id="beneficios" className="bg-slate-50 py-20 md:py-28">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/75">
            Beneficios reais
          </p>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">
            Tudo o que a familia precisa para tratar dinheiro com mais maturidade desde cedo.
          </h2>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            O foco nao e parecer infantil demais nem tecnico demais. A proposta e
            combinar organizacao, supervisao e aprendizado em uma experiencia que
            passe confianca.
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
                className="rounded-[28px] border border-border/70 bg-white p-7 shadow-[0_18px_60px_-35px_rgba(15,23,42,0.35)]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
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
