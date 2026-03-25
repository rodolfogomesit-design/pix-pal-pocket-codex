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
      "Sim. A proposta combina cadastro do responsável, perfis infantis, limites, acompanhamento e histórico em uma estrutura de uso contínuo, não apenas demonstrativa.",
  },
  {
    question: "A criança movimenta dinheiro sem supervisão?",
    answer:
      "Não necessariamente. O responsável pode configurar limites, acompanhar movimentos e decidir quais fluxos exigem mais controle.",
  },
  {
    question: "O responsável consegue acompanhar tudo em um único lugar?",
    answer:
      "Sim. O painel centraliza saldo, histórico, crianças vinculadas e configurações importantes para a rotina da família.",
  },
  {
    question: "Existe uma lógica educativa ou é apenas uma conta digital?",
    answer:
      "A proposta do produto é justamente unir rotina financeira e educação prática, com metas, histórico, controle e incentivos supervisionados.",
  },
  {
    question: "O recurso Mini Gerente é opcional?",
    answer:
      "Sim. Ele funciona como uma camada complementar para famílias que querem estimular iniciativa, indicação e acompanhamento de recompensas.",
  },
  {
    question: "Como funciona a comissão do Mini Gerente Pix Kids e qual o valor?",
    answer:
      "A criança participante do Mini Gerente Pix Kids recebe uma comissão de 1% sobre todos os depósitos realizados pelos usuários indicados por ela. Essa comissão é vitalícia, ou seja, sempre que os indicados fizerem novos depósitos, a criança continuará recebendo sua porcentagem automaticamente. Tudo é acompanhado pelo responsável, garantindo transparência, segurança e aprendizado sobre ganhos recorrentes.",
  },
  {
    question: "A criação de conta é gratuita?",
    answer:
      "Sim. A conta pode ser criada sem custo para a família começar a organizar a rotina financeira dentro da plataforma.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="relative overflow-hidden py-20 md:py-28">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(255,251,235,0.68),rgba(240,249,255,0.76),rgba(250,245,255,0.82))] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(17,24,39,0.98),rgba(24,24,27,0.98))]" />

      <div className="container mx-auto max-w-4xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/75 dark:text-sky-200/75">
            Perguntas frequentes
          </p>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground md:text-5xl dark:text-white">
            As principais dúvidas respondidas de forma objetiva.
          </h2>
          <p className="mt-5 text-lg leading-8 text-muted-foreground dark:text-slate-300/85">
            Esta seção agora segue o mesmo clima visual da landing: fundo suave, leitura confortável e destaques
            coloridos sem comprometer o texto.
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
                className="overflow-hidden rounded-[24px] border border-white/50 bg-white/75 px-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/55"
              >
                <AccordionTrigger className="py-5 text-left font-display text-lg font-bold tracking-tight text-foreground hover:no-underline dark:text-white">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-7 text-muted-foreground dark:text-slate-300/80">
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
