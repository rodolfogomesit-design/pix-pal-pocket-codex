import { motion } from "framer-motion";

const steps = [
  {
    number: "1",
    emoji: "👤",
    title: "Crie sua conta",
    description: "O pai ou responsável cria uma conta em poucos minutos.",
    color: "bg-kids-blue-light text-primary",
  },
  {
    number: "2",
    emoji: "👧",
    title: "Cadastre seu filho",
    description: "Crie o perfil da criança com nome e PIN infantil.",
    color: "bg-kids-yellow-light text-kids-orange",
  },
  {
    number: "3",
    emoji: "💸",
    title: "Envie mesada digital",
    description: "Envie dinheiro para seu filho diretamente pelo app.",
    color: "bg-kids-green-light text-accent",
  },
  {
    number: "4",
    emoji: "📊",
    title: "Acompanhe tudo",
    description: "Veja como seu filho usa o dinheiro e ajude-o a aprender.",
    color: "bg-kids-blue-light text-kids-purple",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="como-funciona" className="py-20 md:py-28 bg-card">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-5xl font-extrabold mb-4">
            Como funciona? 🤔
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-xl mx-auto">
            Em 4 passos simples, seu filho já começa a aprender sobre dinheiro.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="relative"
            >
              <div className="bg-background rounded-3xl p-8 text-center shadow-lg border border-border hover:shadow-xl transition-shadow h-full">
                <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center text-3xl mx-auto mb-5`}>
                  {step.emoji}
                </div>
                <div className="font-display text-sm font-bold text-muted-foreground mb-2">
                  PASSO {step.number}
                </div>
                <h3 className="font-display text-xl font-bold mb-3">
                  {step.title}
                </h3>
                <p className="font-body text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Connector arrow (desktop only) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-5 text-2xl text-muted-foreground/40">
                  →
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
