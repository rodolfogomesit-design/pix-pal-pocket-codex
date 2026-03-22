import { motion } from "framer-motion";
import { BellRing, LockKeyhole, PiggyBank, Shield, Smile, Sparkles } from "lucide-react";

const benefits = [
  {
    icon: Shield,
    title: "Pais no controle com leveza",
    description:
      "Acompanhe saldo, limites, transferencias e aprovacoes sem tirar a magia da experiencia infantil.",
    tone: "from-rose-50 to-orange-50 dark:from-rose-950/20 dark:to-orange-950/15",
  },
  {
    icon: PiggyBank,
    title: "Aprendizado brincando com a rotina",
    description:
      "A crianca aprende a guardar, gastar e cumprir metas usando situacoes reais do dia a dia.",
    tone: "from-amber-50 to-lime-50 dark:from-amber-950/20 dark:to-lime-950/15",
  },
  {
    icon: Smile,
    title: "Visual acolhedor para o publico kids",
    description:
      "A experiencia conversa com a infancia com mais cor, simpatia e linguagem simples.",
    tone: "from-sky-50 to-cyan-50 dark:from-sky-950/20 dark:to-cyan-950/15",
  },
  {
    icon: LockKeyhole,
    title: "Autonomia com rede de seguranca",
    description:
      "Configure PIN, limites diarios e autorizacoes para deixar a liberdade mais segura.",
    tone: "from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/15",
  },
  {
    icon: BellRing,
    title: "Acompanhamento em tempo real",
    description:
      "Receba contexto das movimentacoes e ajude a orientar cada decisao no momento certo.",
    tone: "from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/15",
  },
  {
    icon: Sparkles,
    title: "Metas que viram pequenas conquistas",
    description:
      "Historicos e objetivos ajudam a familia a enxergar progresso de um jeito mais motivador.",
    tone: "from-violet-50 to-fuchsia-50 dark:from-violet-950/20 dark:to-fuchsia-950/15",
  },
];

const BenefitsSection = () => {
  return (
    <section
      id="beneficios"
      className="bg-[linear-gradient(180deg,rgba(255,251,235,1)_0%,rgba(240,249,255,1)_30%,rgba(250,245,255,1)_100%)] py-20 md:py-28 dark:bg-[linear-gradient(180deg,rgba(15,23,42,1)_0%,rgba(17,24,39,1)_40%,rgba(24,24,27,1)_100%)]"
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/75 dark:text-sky-200/75">
            Cores, cuidado e aprendizado
          </p>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground md:text-5xl dark:text-white">
            Um arco-iris de beneficios para a crianca se encantar e a familia confiar.
          </h2>
          <p className="mt-5 text-lg leading-8 text-muted-foreground dark:text-slate-300/85">
            O Pix Kids ganha um visual mais vivo no claro e mais profundo no escuro,
            sem perder leitura, contraste nem a sensacao de brincadeira.
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
                className={`rounded-[28px] border border-white/50 bg-gradient-to-br ${benefit.tone} p-7 shadow-[0_18px_60px_-35px_rgba(15,23,42,0.24)] dark:border-white/10 dark:shadow-[0_18px_60px_-35px_rgba(0,0,0,0.55)]`}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,#fb7185,#f59e0b,#22c55e,#38bdf8,#8b5cf6)] text-white shadow-lg shadow-fuchsia-300/25 dark:shadow-fuchsia-950/25">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display text-xl font-bold tracking-tight text-foreground dark:text-white">
                  {benefit.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground dark:text-slate-300/80">
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
