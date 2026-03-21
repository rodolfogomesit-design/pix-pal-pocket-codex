import { motion } from "framer-motion";

const benefits = [
  {
    emoji: "👨‍👩‍👧",
    title: "Controle dos pais",
    description: "Acompanhe e gerencie o dinheiro dos seus filhos em tempo real.",
    bg: "bg-kids-blue-light",
  },
  {
    emoji: "💰",
    title: "Educação financeira",
    description: "Ensine responsabilidade financeira desde cedo, na prática.",
    bg: "bg-kids-yellow-light",
  },
  {
    emoji: "📱",
    title: "App simples",
    description: "Interface intuitiva e fácil de usar para todas as idades.",
    bg: "bg-kids-green-light",
  },
  {
    emoji: "🔒",
    title: "Mais segurança",
    description: "Seu filho movimenta dinheiro sem exposição a riscos.",
    bg: "bg-kids-blue-light",
  },
  {
    emoji: "🎓",
    title: "Aprendizado na prática",
    description: "Crianças aprendem fazendo, com metas e histórico real.",
    bg: "bg-kids-yellow-light",
  },
  {
    emoji: "🎯",
    title: "Metas de economia",
    description: "Seu filho define objetivos e aprende a guardar dinheiro.",
    bg: "bg-kids-green-light",
  },
];

const BenefitsSection = () => {
  return (
    <section id="beneficios" className="py-20 md:py-28 bg-card">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-5xl font-extrabold mb-4">
            Por que escolher o Pix Kids? ⭐
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-xl mx-auto">
            Benefícios para pais e filhos que transformam a relação com dinheiro.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-background rounded-3xl p-7 border border-border shadow-md hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className={`w-14 h-14 ${benefit.bg} rounded-2xl flex items-center justify-center text-3xl mb-4`}>
                {benefit.emoji}
              </div>
              <h3 className="font-display text-lg font-bold mb-2">{benefit.title}</h3>
              <p className="font-body text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
