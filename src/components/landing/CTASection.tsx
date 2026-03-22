import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-20 md:py-28 bg-primary relative overflow-hidden">
      {/* Decorations */}
      <div className="absolute top-6 left-10 text-5xl opacity-20 animate-bounce-coin">💰</div>
      <div className="absolute bottom-10 right-14 text-4xl opacity-20 animate-wiggle">🐷</div>
      <div className="absolute top-1/2 left-1/4 text-3xl opacity-10 animate-bounce-coin" style={{ animationDelay: "0.7s" }}>⭐</div>

      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl md:text-5xl font-extrabold text-primary-foreground mb-6">
            Comece hoje mesmo! 🚀
          </h2>
          <p className="font-body text-lg text-primary-foreground/80 max-w-xl mx-auto mb-10 leading-relaxed">
            Crie uma conta gratuita e comece a ensinar seu filho a cuidar do dinheiro. 
            <strong className="text-primary-foreground"> O futuro financeiro começa na infância.</strong>
          </p>
          <Button
            asChild
            size="lg"
            className="font-display font-bold text-lg rounded-full px-12 py-7 bg-kids-yellow text-secondary-foreground hover:bg-kids-yellow/90 shadow-2xl transition-all hover:scale-105"
          >
            <Link to="/cadastro">🚀 CRIAR CONTA GRATUITA</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
