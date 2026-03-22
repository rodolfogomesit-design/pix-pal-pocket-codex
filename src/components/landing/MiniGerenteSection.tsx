import { motion } from "framer-motion";
import { BadgeDollarSign, Eye, Gift, Users } from "lucide-react";

const steps = [
  {
    title: "A criança ativa o modo Mini Gerente",
    description:
      "Ao ativar o recurso, ela recebe um código de indicação que pode ser compartilhado com amigos e familiares.",
  },
  {
    title: "O convite gera uma nova entrada na plataforma",
    description:
      "Quando um novo responsável usa esse código, a indicação fica registrada com rastreabilidade.",
  },
  {
    title: "A movimentação valida a recomendação",
    description:
      "Assim que a conta indicada começa a usar a plataforma, o sistema identifica quem originou a relação.",
  },
  {
    title: "A comissão entra como incentivo educativo",
    description:
      "A recompensa vai para a carteira da criança de forma controlada, com supervisão do responsável.",
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
  },
];

const MiniGerenteSection = () => {
  return (
    <section id="mini-gerente" className="bg-slate-950 py-20 text-white md:py-28">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-200/80">
            Mini Gerente
          </p>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight md:text-5xl">
            Um recurso que transforma indicação em aprendizado sobre iniciativa e responsabilidade.
          </h2>
          <p className="mt-5 text-lg leading-8 text-white/72">
            O Mini Gerente foi pensado para apresentar noção de recompensa,
            acompanhamento de desempenho e autonomia supervisionada em um formato
            mais seguro para famílias.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-[32px] border border-white/10 bg-white/6 p-8 backdrop-blur"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-300/12 text-emerald-200">
              <BadgeDollarSign className="h-7 w-7" />
            </div>
            <h3 className="mt-6 font-display text-2xl font-bold">
              Um programa de indicação com leitura educativa
            </h3>
            <p className="mt-4 leading-8 text-white/72">
              Em vez de parecer uma promessa exagerada, o recurso apresenta uma
              experiência controlada: a criança convida, acompanha resultados e
              entende que ganhos dependem de contexto, uso real e supervisão.
            </p>
            <div className="mt-8 space-y-3">
              {[
                "recompensa vinculada ao uso da plataforma",
                "supervisão integral do responsável",
                "histórico claro de cada ganho",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-medium text-white/82"
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
                className="rounded-[28px] border border-white/10 bg-white/6 p-6 backdrop-blur"
              >
                <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200/75">
                  Etapa {index + 1}
                </p>
                <h3 className="mt-3 font-display text-xl font-bold">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/72">
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
                className="rounded-[30px] border border-white/10 bg-white/6 p-8 backdrop-blur"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-emerald-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-xl font-bold">{block.title}</h3>
                </div>

                <div className="mt-6 grid gap-3">
                  {block.items.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-white/78"
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
          className="mt-10 rounded-[32px] border border-white/10 bg-gradient-to-r from-white/8 to-emerald-300/10 p-8 text-center backdrop-blur"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-amber-200">
            <Gift className="h-6 w-6" />
          </div>
          <h3 className="mt-5 font-display text-2xl font-bold">
            Empreendedorismo infantil sem perder contexto nem segurança
          </h3>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-white/72">
            O resultado esperado não é apenas gerar indicações, mas estimular
            iniciativa, leitura de resultado e responsabilidade financeira dentro
            de um ambiente acompanhado.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default MiniGerenteSection;
