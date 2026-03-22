import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(2,132,199,1),rgba(17,94,89,0.92)_56%,rgba(250,204,21,0.45))]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.16),transparent_28%)]" />

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-5xl rounded-[36px] border border-white/15 bg-white/10 p-8 text-center shadow-[0_30px_120px_-40px_rgba(15,23,42,0.6)] backdrop-blur md:p-12"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90">
            <BadgeCheck className="h-4 w-4" />
            Feito para encantar as criancas e tranquilizar os pais
          </div>

          <h2 className="mx-auto max-w-3xl font-display text-3xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
            Comece hoje e transforme dinheiro em uma experiencia mais divertida para a familia.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/82">
            Crie a conta, monte o universo financeiro da crianca e acompanhe
            cada passo com um visual alegre, simples e cheio de pequenas conquistas.
          </p>

          <div className="mt-6 flex justify-center text-white/85">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Mesada, metas e educacao financeira com um toque mais magico
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
              className="h-14 rounded-full border-white/20 bg-transparent px-8 text-base font-bold text-white hover:bg-white/10 hover:text-white"
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
