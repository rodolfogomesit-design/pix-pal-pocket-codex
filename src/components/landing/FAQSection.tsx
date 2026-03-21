import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";

const faqs = [
  {
    question: "O Pix Kids é seguro?",
    answer: "Sim! O aplicativo possui autenticação segura, PIN infantil, aprovação dos pais para transações e registro completo de atividades. Tudo para garantir um ambiente digital seguro.",
  },
  {
    question: "Crianças podem enviar dinheiro?",
    answer: "Sim, mas os pais podem definir limites de valor ou exigir aprovação antes de cada transferência ser concluída.",
  },
  {
    question: "Posso controlar os gastos do meu filho?",
    answer: "Com certeza! O painel do responsável permite acompanhar todas as movimentações, definir limites diários, aprovar transferências e até congelar a conta.",
  },
  {
    question: "Existe idade mínima?",
    answer: "O Pix Kids foi criado para crianças e adolescentes. A conta é sempre vinculada a um responsável adulto.",
  },
  {
    question: "Como meu filho recebe dinheiro?",
    answer: "Cada criança recebe um código público exclusivo de 5 dígitos. Outros usuários podem enviar dinheiro usando esse código dentro da plataforma.",
  },
  {
    question: "Quanto custa?",
    answer: "A criação de conta é gratuita! O Pix Kids é uma plataforma acessível para todas as famílias.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-5xl font-extrabold mb-4">
            Perguntas frequentes ❓
          </h2>
          <p className="font-body text-lg text-muted-foreground">
            Tire suas dúvidas sobre o Pix Kids.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-border rounded-2xl px-6 overflow-hidden"
              >
                <AccordionTrigger className="font-display font-bold text-left hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="font-body text-muted-foreground leading-relaxed pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
