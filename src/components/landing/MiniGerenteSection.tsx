import { motion } from "framer-motion";

const steps = [
  {
    number: "1️⃣",
    title: "A criança ativa o modo Mini Gerente",
    desc: "Dentro da conta do Pix Kids, a criança pode ativar a função Mini Gerente Pix Kids. Ela recebe um código ou link exclusivo de indicação.",
  },
  {
    number: "2️⃣",
    title: "A criança convida amigos",
    desc: "A criança pode compartilhar seu código com amigos, colegas ou familiares. Quando alguém cria uma conta através desse código, a indicação fica registrada no sistema.",
  },
  {
    number: "3️⃣",
    title: "O indicado começa a usar o Pix Kids",
    desc: "Quando o responsável da nova conta realiza um depósito na plataforma, o sistema identifica quem fez a indicação.",
  },
  {
    number: "4️⃣",
    title: "A criança recebe comissão",
    desc: "Uma pequena comissão é automaticamente gerada para quem fez a indicação. Essa comissão se chama Pix Kids e fica disponível no saldo da criança.",
  },
];

const kidTracking = [
  "quantas pessoas ela indicou",
  "nomes e identificadores dos indicados",
  "saldo total acumulado em Pix Kids",
  "histórico de ganhos",
  "valor disponível para saque",
];

const parentControls = [
  "ver quem o filho indicou",
  "acompanhar os valores recebidos",
  "acompanhar depósitos que geraram comissão",
  "monitorar histórico de ganhos",
  "acompanhar solicitações de saque",
];

const benefits = [
  "Incentiva empreendedorismo desde cedo",
  "Ensina educação financeira de forma prática",
  "Recompensa a iniciativa da criança",
  "Funciona com total supervisão dos pais",
  "Tudo dentro de um ambiente seguro",
];

const learnings = [
  { emoji: "💰", text: "administrar dinheiro" },
  { emoji: "📊", text: "acompanhar ganhos" },
  { emoji: "📈", text: "desenvolver responsabilidade financeira" },
  { emoji: "🚀", text: "aprender a empreender" },
];

const MiniGerenteSection = () => {
  return (
    <section id="mini-gerente" className="py-20 md:py-28">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-5xl font-extrabold mb-4">
            Torne seu filho um Mini Gerente Pix Kids 🧑‍💼
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto">
            Uma forma divertida de ensinar seu filho a ganhar dinheiro
          </p>
        </motion.div>

        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-card rounded-3xl p-8 border border-border shadow-md mb-8 space-y-4 font-body text-muted-foreground leading-relaxed"
        >
          <p>
            Com o Mini Gerente Pix Kids, seu filho pode aprender desde cedo sobre{" "}
            <strong className="text-foreground">empreendedorismo</strong>,{" "}
            <strong className="text-foreground">responsabilidade financeira</strong> e{" "}
            <strong className="text-foreground">recompensas por indicação</strong>.
          </p>
          <p>
            A funcionalidade permite que a criança convide novos usuários para a plataforma Pix Kids e receba uma pequena comissão sempre que uma conta indicada começar a usar o aplicativo.
          </p>
          <p>
            Essa comissão é chamada de <strong className="text-foreground">Pix Kids</strong> e fica disponível diretamente na carteira digital da criança.
          </p>
          <p className="font-semibold text-foreground">
            🔒 Tudo isso acontece com total supervisão dos pais.
          </p>
        </motion.div>

        {/* O que é */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <h3 className="font-display text-2xl font-bold mb-4">O que é o Mini Gerente Pix Kids</h3>
          <div className="bg-card rounded-3xl p-8 border border-border shadow-md space-y-4 font-body text-muted-foreground leading-relaxed">
            <p>
              O Mini Gerente Pix Kids é um recurso educativo dentro da plataforma que transforma as crianças em pequenos promotores do aplicativo.
            </p>
            <p>Cada criança participante recebe um código ou link de indicação exclusivo.</p>
            <p>
              Quando um novo usuário se cadastra utilizando essa indicação e começa a utilizar o aplicativo, a criança que indicou pode ganhar uma{" "}
              <strong className="text-foreground">comissão automática</strong> sobre depósitos realizados na conta do indicado.
            </p>
            <p>Esse valor vai direto para a carteira digital da criança dentro do Pix Kids.</p>
          </div>
        </motion.div>

        {/* Como funciona na prática */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <h3 className="font-display text-2xl font-bold mb-6">Como funciona na prática</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-3xl p-6 border border-border shadow-md"
              >
                <div className="text-2xl mb-2">{step.number}</div>
                <h4 className="font-display font-bold text-lg mb-2">{step.title}</h4>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Two columns: kid tracking + parent controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-kids-blue-light to-card rounded-3xl p-8 border border-border shadow-md"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🧒</span>
              <h3 className="font-display text-xl font-bold">O que a criança pode acompanhar</h3>
            </div>
            <p className="font-body text-sm text-muted-foreground mb-4">
              Dentro do aplicativo, a criança pode ver:
            </p>
            <ul className="space-y-3">
              {kidTracking.map((item) => (
                <li key={item} className="flex items-center gap-3 bg-card/60 rounded-2xl p-3 font-body text-sm font-semibold">
                  <span className="text-primary">•</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="font-body text-xs text-muted-foreground mt-4">
              Tudo isso de forma simples, visual e educativa.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-kids-green-light to-card rounded-3xl p-8 border border-border shadow-md"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">👨‍👩‍👧</span>
              <h3 className="font-display text-xl font-bold">Total controle para os pais</h3>
            </div>
            <p className="font-body text-sm text-muted-foreground mb-4">
              No painel dos pais é possível:
            </p>
            <ul className="space-y-3">
              {parentControls.map((item) => (
                <li key={item} className="flex items-center gap-3 bg-card/60 rounded-2xl p-3 font-body text-sm font-semibold">
                  <span className="text-accent">•</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="font-body text-xs text-muted-foreground mt-4">
              Assim os pais participam da educação financeira da criança com segurança.
            </p>
          </motion.div>
        </div>

        {/* Benefícios */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-card rounded-3xl p-8 border border-border shadow-md mb-8"
        >
          <h3 className="font-display text-2xl font-bold mb-5">Benefícios do Mini Gerente Pix Kids ⭐</h3>
          <div className="space-y-3">
            {benefits.map((b) => (
              <div key={b} className="flex items-center gap-3 font-body font-semibold text-sm">
                <span className="text-accent text-lg">✔</span>
                {b}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Educação financeira */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-kids-yellow-light to-card rounded-3xl p-8 border border-border shadow-md text-center"
        >
          <h3 className="font-display text-2xl font-bold mb-3">Educação financeira que começa cedo</h3>
          <p className="font-body text-muted-foreground mb-6">
            O Pix Kids não é apenas uma carteira digital. É uma forma de ensinar crianças e adolescentes a:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {learnings.map((l) => (
              <div key={l.text} className="bg-card/60 rounded-2xl p-4 text-center">
                <span className="text-3xl block mb-2">{l.emoji}</span>
                <span className="font-body font-semibold text-sm">{l.text}</span>
              </div>
            ))}
          </div>
          <p className="font-display font-extrabold text-xl text-primary">Pix Kids</p>
          <p className="font-body text-sm text-muted-foreground">
            A primeira experiência financeira digital do seu filho.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default MiniGerenteSection;
