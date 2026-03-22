import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(255,251,235,0.65),rgba(240,249,255,0.78),rgba(250,245,255,0.88))] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(17,24,39,0.98),rgba(24,24,27,0.98))]" />

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-5xl rounded-[36px] border border-white/50 bg-[linear-gradient(135deg,rgba(251,113,133,0.14),rgba(250,204,21,0.18),rgba(34,197,94,0.12),rgba(56,189,248,0.16),rgba(168,85,247,0.14))] p-8 text-center shadow-[0_30px_120px_-40px_rgba(15,23,42,0.35)] backdrop-blur md:p-12 dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(244,63,94,0.12),rgba(245,158,11,0.12),rgba(34,197,94,0.10),rgba(14,165,233,0.12),rgba(139,92,246,0.12))]"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/70 px-4 py-2 text-sm font-semibold text-primary shadow-sm dark:border-white/10 dark:bg-slate-950/35 dark:text-sky-200">
            <BadgeCheck className="h-4 w-4" />
            Comece a usar o Pix Kids com foco em Pix, mesada e educação financeira
          </div>

          <h2 className="mx-auto max-w-3xl font-display text-3xl font-extrabold leading-tight tracking-tight text-foreground md:text-5xl dark:text-white">
            Crie a conta e leve Pix, metas e controle financeiro para a rotina da criança.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground dark:text-slate-300/82">
            O responsável acompanha tudo em um painel simples, e a criança aprende
            a receber, guardar e usar dinheiro com mais responsabilidade.
          </p>

          <div className="mt-6 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/70 px-4 py-2 text-sm font-medium text-foreground dark:border-white/10 dark:bg-slate-950/35 dark:text-slate-200">
              <Sparkles className="h-4 w-4 text-primary dark:text-sky-200" />
              Pix, mesada e metas financeiras em um único app
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="group h-14 rounded-full border-0 bg-[linear-gradient(135deg,#fb7185,#f59e0b,#22c55e,#38bdf8,#8b5cf6)] px-8 text-base font-bold text-white shadow-xl shadow-fuchsia-300/30 hover:opacity-95 dark:shadow-fuchsia-950/30"
            >
              <Link to="/cadastro">
                Criar conta gratuita
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-14 rounded-full border-white/40 bg-white/70 px-8 text-base font-bold text-foreground hover:bg-white dark:border-white/10 dark:bg-slate-950/35 dark:text-white dark:hover:bg-slate-900/70"
            >
              <Link to="/login">Entrar na plataforma</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
