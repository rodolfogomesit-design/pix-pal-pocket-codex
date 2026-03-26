import { motion } from "framer-motion";
import { Baby, Banknote, ChartColumn, HandCoins, Lock, ReceiptText, ShieldCheck, Smartphone, Snowflake, Wallet } from "lucide-react";

const kidFeatures = [
  { icon: Wallet, text: "Ver seu saldo" },
  { icon: ChartColumn, text: "Acompanhar movimentações" },
  { icon: HandCoins, text: "Enviar para amigos autorizados" },
  { icon: Smartphone, text: "Pagar com Pix ou QR Code" },
  { icon: Banknote, text: "Guardar dinheiro para objetivos" },
];

const parentControls = [
  { icon: ShieldCheck, text: "Visualizar todas as transações" },
  { icon: ChartColumn, text: "Definir limite de gastos" },
  { icon: HandCoins, text: "Aprovar transferências" },
  { icon: Lock, text: "Bloquear funções" },
  { icon: Snowflake, text: "Congelar a conta" },
  { icon: ReceiptText, text: "Histórico completo" },
];

const FeaturesSection = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16 text-center">
          <h2 className="mb-4 font-display text-3xl font-extrabold md:text-5xl">Feito para toda a família</h2>
          <p className="mx-auto max-w-xl font-body text-lg text-muted-foreground">Uma experiência divertida para crianças e um painel completo para quem cuida da conta.</p>
        </motion.div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="rounded-3xl border border-border bg-gradient-to-br from-kids-blue-light to-card p-8 shadow-lg md:p-10">
            <div className="mb-6 flex items-center gap-3"><span className="rounded-2xl bg-primary/10 p-3 text-primary"><Baby className="h-8 w-8" /></span><h3 className="font-display text-2xl font-bold">Para a criança</h3></div>
            <div className="space-y-4">{kidFeatures.map((feature) => (<div key={feature.text} className="flex items-center gap-3 rounded-2xl bg-card/60 p-4"><span className="rounded-xl bg-primary/10 p-2 text-primary"><feature.icon className="h-5 w-5" /></span><span className="font-body font-semibold">{feature.text}</span></div>))}</div>
            <p className="mt-5 font-body text-sm text-muted-foreground">Tudo com controle e limites definidos pelos pais.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="rounded-3xl border border-border bg-gradient-to-br from-kids-green-light to-card p-8 shadow-lg md:p-10">
            <div className="mb-6 flex items-center gap-3"><span className="rounded-2xl bg-primary/10 p-3 text-primary"><ShieldCheck className="h-8 w-8" /></span><h3 className="font-display text-2xl font-bold">Para os pais</h3></div>
            <div className="space-y-4">{parentControls.map((control) => (<div key={control.text} className="flex items-center gap-3 rounded-2xl bg-card/60 p-4"><span className="rounded-xl bg-primary/10 p-2 text-primary"><control.icon className="h-5 w-5" /></span><span className="font-body font-semibold">{control.text}</span></div>))}</div>
            <p className="mt-5 font-body text-sm text-muted-foreground">Liberdade para a criança, supervisão total para os pais.</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
