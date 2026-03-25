import { motion } from "framer-motion";
import { BadgeDollarSign, Eye, Gift, Users } from "lucide-react";

import KidMiniGerenteShowcase from "@/components/landing/KidMiniGerenteShowcase";

const steps = [
  {
    title: "A criança ativa o modo Mini Gerente",
    description:
      "Ao ativar o recurso, ela recebe um código de indicação que pode ser compartilhado com amigos e familiares.",
    tone: "from-rose-50 to-orange-50 dark:from-rose-950/25 dark:to-orange-950/20",
  },
  {
    title: "O convite gera uma nova entrada na plataforma",
    description:
      "Quando um novo responsável usa esse código, a indicação fica registrada com rastreabilidade.",
    tone: "from-amber-50 to-lime-50 dark:from-amber-950/25 dark:to-lime-950/20",
  },
  {
    title: "A movimentação valida a recomendação",
    description:
      "Assim que a conta indicada começa a usar a plataforma, o sistema identifica quem originou a relação.",
    tone: "from-sky-50 to-cyan-50 dark:from-sky-950/25 dark:to-cyan-950/20",
  },
  {
    title: "A comissão entra como incentivo educativo",
    description:
      "A recompensa vai para a carteira da criança de forma controlada, com supervisão do responsável.",
    tone: "from-violet-50 to-fuchsia-50 dark:from-violet-950/25 dark:to-fuchsia-950/20",
  },
];

const controlBlocks = [
  {
    icon: Users,
    title: "Visão para a criança",
    items: [
      "quantidade de indicações",
      "histórico de ganhos",
      "saldo acumulado com comissão",
      "valor disponível para saque",
    ],
    tone: "from-sky-50 to-cyan-50 dark:from-sky-950/25 dark:to-cyan-950/20",
    iconTone: "from-sky-400 to-cyan-400",
  },
  {
    icon: Eye,
    title: "Visão para o responsável",
    items: [
      "quem foi indicado",
      "quais movimentos geraram comissão",
      "quanto entrou em cada período",
      "pedidos de saque e acompanhamento",
    ],
    tone: "from-emerald-50 to-lime-50 dark:from-emerald-950/25 dark:to-lime-950/20",
    iconTone: "from-emerald-400 to-lime-400",
  },
];

const MiniGerenteSection = () => {
  return (
    <section id="mini-gerente" className="relative overflow-hidden py-20 md:py-28">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(255,251,235,0.72),rgba(240,249,255,0.78),rgba(250,245,255,0.82))] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(17,24,39,0.98),rgba(24,24,27,0.98))]" />

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/75 dark:text-sky-200/75">
            Mini Gerente
          </p>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground md:text-5xl dark:text-white">
            Um recurso que transforma indicação em aprendizado sobre iniciativa e responsabilidade.
          </h2>
          <p className="mt-5 text-lg leading-8 text-muted-foreground dark:text-slate-300/85">
            O Mini Gerente foi pensado para apresentar noção de recompensa, acompanhamento de desempenho e autonomia
            supervisionada em um formato mais seguro para famílias.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.06 }}
          className="mx-auto mt-12 max-w-md"
        >
          <KidMiniGerenteShowcase />
        </motion.div>

        <div className="mt-14 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-[32px] border border-white/50 bg-[linear-gradient(135deg,rgba(255,255,255,0.86),rgba(254,240,138,0.26),rgba(191,219,254,0.18))] p-8 backdrop-blur dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.82),rgba(88,28,135,0.18),rgba(2,132,199,0.15))]"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#fb7185,#f59e0b,#22c55e,#38bdf8,#8b5cf6)] text-white shadow-lg shadow-fuchsia-300/25 dark:shadow-fuchsia-950/25">
              <BadgeDollarSign className="h-7 w-7" />
            </div>
            <h3 className="mt-6 font-display text-2xl font-bold text-foreground dark:text-white">
              Um programa de indicação com leitura educativa
            </h3>
            <p className="mt-4 leading-8 text-muted-foreground dark:text-slate-300/82">
              Em vez de parecer uma promessa exagerada, o recurso apresenta uma experiência controlada: a criança
              convida, acompanha resultados e entende que ganhos dependem de contexto, uso real e supervisão.
            </p>
            <div className="mt-8 space-y-3">
              {[
                "recompensa vinculada ao uso da plataforma",
                "supervisão integral do responsável",
                "histórico claro de cada ganho",
              ].map((item, index) => (
                <div
                  key={item}
                  className={`rounded-2xl border border-white/50 px-4 py-3 text-sm font-medium dark:border-white/10 ${
                    index === 0
                      ? "bg-rose-50/85 text-rose-900 dark:bg-rose-950/25 dark:text-rose-100"
                      : index === 1
                        ? "bg-sky-50/85 text-sky-900 dark:bg-sky-950/25 dark:text-sky-100"
                        : "bg-violet-50/85 text-violet-900 dark:bg-violet-950/25 dark:text-violet-100"
                  }`}
                >
                  {item}
                </div>
              ))}
            </div>
          </motion.div>

          <div className="grid gap-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className={`rounded-[28px] border border-white/50 bg-gradient-to-br ${step.tone} p-6 backdrop-blur dark:border-white/10`}
              >
                <p className="text-xs font-black uppercase tracking-[0.22em] text-primary/70 dark:text-sky-200/75">
                  Etapa {index + 1}
                </p>
                <h3 className="mt-3 font-display text-xl font-bold text-foreground dark:text-white">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground dark:text-slate-300/80">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {controlBlocks.map((block) => {
            const Icon = block.icon;

            return (
              <motion.div
                key={block.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`rounded-[30px] border border-white/50 bg-gradient-to-br ${block.tone} p-8 backdrop-blur dark:border-white/10`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r ${block.iconTone} text-white shadow-sm`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground dark:text-white">{block.title}</h3>
                </div>

                <div className="mt-6 grid gap-3">
                  {block.items.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/50 bg-white/70 px-4 py-3 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-950/35 dark:text-slate-200"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 rounded-[32px] border border-white/50 bg-[linear-gradient(135deg,rgba(251,113,133,0.12),rgba(250,204,21,0.18),rgba(56,189,248,0.16),rgba(168,85,247,0.12))] p-8 text-center backdrop-blur dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(244,63,94,0.12),rgba(245,158,11,0.12),rgba(14,165,233,0.12),rgba(139,92,246,0.12))]"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#fb7185,#f59e0b,#22c55e,#38bdf8,#8b5cf6)] text-white shadow-lg shadow-fuchsia-300/25 dark:shadow-fuchsia-950/25">
            <Gift className="h-6 w-6" />
          </div>
          <h3 className="mt-5 font-display text-2xl font-bold text-foreground dark:text-white">
            Empreendedorismo infantil sem perder contexto nem segurança
          </h3>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-muted-foreground dark:text-slate-300/80">
            O resultado esperado não é apenas gerar indicações, mas estimular iniciativa, leitura de resultado e
            responsabilidade financeira dentro de um ambiente acompanhado.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default MiniGerenteSection;
