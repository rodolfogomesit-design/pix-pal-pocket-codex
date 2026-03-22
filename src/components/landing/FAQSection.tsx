import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";

const faqs = [
  {
    question: "O Pix Kids foi pensado para uso familiar real?",
    answer:
      "Sim. A proposta combina cadastro do responsavel, perfis infantis, limites, acompanhamento e historico em uma estrutura de uso continuo, nao apenas demonstrativa.",
  },
  {
    question: "A crianca movimenta dinheiro sem supervisao?",
    answer:
      "Nao necessariamente. O responsavel pode configurar limites, acompanhar movimentos e decidir quais fluxos exigem mais controle.",
  },
  {
    question: "O responsavel consegue acompanhar tudo em um unico lugar?",
    answer:
      "Sim. O painel centraliza saldo, historico, criancas vinculadas e configuracoes importantes para a rotina da familia.",
  },
  {
    question: "Existe uma logica educativa ou e apenas uma conta digital?",
    answer:
      "A proposta do produto e justamente unir rotina financeira e educacao pratica, com metas, historico, controle e incentivos supervisionados.",
  },
  {
    question: "O recurso Mini Gerente e opcional?",
    answer:
      "Sim. Ele funciona como uma camada complementar para familias que querem estimular iniciativa, indicacao e acompanhamento de recompensas.",
  },
  {
    question: "A criacao de conta e gratuita?",
    answer:
      "Sim. A conta pode ser criada sem custo para a familia comecar a organizar a rotina financeira dentro da plataforma.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="container mx-auto max-w-4xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/75">
            Perguntas frequentes
          </p>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">
            As principais duvidas respondidas de forma objetiva.
          </h2>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            Uma landing mais profissional tambem precisa responder objecoes com
            clareza, sem excesso de promessas e sem texto confuso.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={faq.question}
                value={`faq-${index}`}
                className="overflow-hidden rounded-[24px] border border-border/70 bg-white px-6 shadow-sm"
              >
                <AccordionTrigger className="py-5 text-left font-display text-lg font-bold tracking-tight hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-7 text-muted-foreground">
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
