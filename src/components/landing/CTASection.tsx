import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(15,23,42,1),rgba(17,94,89,0.96)_62%,rgba(250,204,21,0.35))]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.1),transparent_26%)]" />

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-5xl rounded-[36px] border border-white/10 bg-white/6 p-8 text-center shadow-[0_30px_120px_-40px_rgba(15,23,42,0.7)] backdrop-blur md:p-12"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90">
            <BadgeCheck className="h-4 w-4" />
            Estrutura pronta para familias que querem comecar com clareza
          </div>

          <h2 className="mx-auto max-w-3xl font-display text-3xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
            Coloque sua familia em um ambiente financeiro mais organizado desde o primeiro acesso.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/78">
            Cadastre o responsavel, configure a rotina da crianca e acompanhe
            cada movimentacao em uma experiencia mais confiavel, limpa e
            profissional.
          </p>

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
