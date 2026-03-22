import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,#fb7185_0%,#f59e0b_18%,#22c55e_42%,#38bdf8_68%,#8b5cf6_100%)] dark:bg-[linear-gradient(135deg,#4c0519_0%,#78350f_18%,#14532d_42%,#0c4a6e_68%,#4c1d95_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.16),transparent_28%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.05),transparent_28%)]" />

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-5xl rounded-[36px] border border-white/20 bg-white/12 p-8 text-center shadow-[0_30px_120px_-40px_rgba(15,23,42,0.6)] backdrop-blur md:p-12 dark:border-white/10 dark:bg-slate-950/30"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-4 py-2 text-sm font-semibold text-white/90">
            <BadgeCheck className="h-4 w-4" />
            Um convite colorido para criar, brincar e aprender
          </div>

          <h2 className="mx-auto max-w-3xl font-display text-3xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
            Uma landing em clima de arco-iris para deixar a experiencia mais inesquecivel.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/82">
            No modo claro ela fica vibrante e divertida. No modo escuro, continua
            magica, com contrastes fortes e profundidade visual.
          </p>

          <div className="mt-6 flex justify-center text-white/85">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Mesada, metas e educacao financeira com energia colorida o dia todo
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="group h-14 rounded-full bg-white px-8 text-base font-bold text-slate-950 hover:bg-white/92"
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
              className="h-14 rounded-full border-white/25 bg-transparent px-8 text-base font-bold text-white hover:bg-white/10 hover:text-white"
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
