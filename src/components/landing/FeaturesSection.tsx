import { motion } from "framer-motion";

const kidFeatures = [
  { emoji: "💰", text: "Ver seu saldo" },
  { emoji: "📊", text: "Acompanhar movimentações" },
  { emoji: "👫", text: "Enviar para amigos autorizados" },
  { emoji: "📱", text: "Pagar com Pix ou QR Code" },
  { emoji: "🏦", text: "Guardar dinheiro para objetivos" },
];

const parentControls = [
  { emoji: "✅", text: "Visualizar todas as transações" },
  { emoji: "📏", text: "Definir limite de gastos" },
  { emoji: "👍", text: "Aprovar transferências" },
  { emoji: "🚫", text: "Bloquear funções" },
  { emoji: "❄️", text: "Congelar a conta" },
  { emoji: "📜", text: "Histórico completo" },
];

const FeaturesSection = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-5xl font-extrabold mb-4">
            Feito para toda a família 👨‍👩‍👧‍👦
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-xl mx-auto">
            Interface divertida para crianças e controle total para os pais.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Kids card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-kids-blue-light to-card rounded-3xl p-8 md:p-10 border border-border shadow-lg"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">🧒</span>
              <h3 className="font-display text-2xl font-bold">Para a criança</h3>
            </div>
            <div className="space-y-4">
              {kidFeatures.map((feature) => (
                <div key={feature.text} className="flex items-center gap-3 bg-card/60 rounded-2xl p-4">
                  <span className="text-2xl">{feature.emoji}</span>
                  <span className="font-body font-semibold">{feature.text}</span>
                </div>
              ))}
            </div>
            <p className="font-body text-sm text-muted-foreground mt-5">
              Tudo com controle e limites definidos pelos pais.
            </p>
          </motion.div>

          {/* Parents card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-kids-green-light to-card rounded-3xl p-8 md:p-10 border border-border shadow-lg"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">👨‍👩‍👧</span>
              <h3 className="font-display text-2xl font-bold">Para os pais</h3>
            </div>
            <div className="space-y-4">
              {parentControls.map((control) => (
                <div key={control.text} className="flex items-center gap-3 bg-card/60 rounded-2xl p-4">
                  <span className="text-2xl">{control.emoji}</span>
                  <span className="font-body font-semibold">{control.text}</span>
                </div>
              ))}
            </div>
            <p className="font-body text-sm text-muted-foreground mt-5">
              Liberdade para a criança, supervisão total para os pais.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
