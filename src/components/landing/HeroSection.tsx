import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";


const HeroSection = () => {
  return (
    <section className="relative pt-28 pb-20 md:pt-40 md:pb-32 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-20 h-20 rounded-full bg-kids-yellow/20 animate-bounce-coin" />
        <div className="absolute top-40 right-20 w-16 h-16 rounded-full bg-kids-blue-light animate-bounce-coin" style={{ animationDelay: "0.5s" }} />
        <div className="absolute bottom-20 left-1/4 w-12 h-12 rounded-full bg-kids-green-light animate-bounce-coin" style={{ animationDelay: "1s" }} />
        <div className="absolute top-60 right-1/3 w-10 h-10 rounded-full bg-kids-yellow/30 animate-wiggle" />
      </div>

      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="flex items-center gap-4">
              <span className="font-display text-5xl md:text-7xl font-extrabold text-primary">🐷 Pix Kids</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-kids-blue-light text-primary font-display font-bold px-5 py-2 rounded-full text-sm">
              🐷 A primeira carteira digital infantil
            </div>
          </div>

          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6">
            Ensine seu filho a{" "}
            <span className="text-primary">cuidar</span>{" "}
            <br className="hidden md:block" />
            do{" "}
            <span className="text-kids-yellow drop-shadow-sm">dinheiro</span>{" "}
            <span className="inline-block animate-wiggle">💰</span>
          </h1>

          <p className="font-body text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Seu filho aprende desde cedo a receber, guardar e administrar dinheiro, 
            enquanto você acompanha tudo com <strong className="text-foreground">segurança total</strong>.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button 
            asChild
            size="lg" 
            className="font-display font-bold text-lg rounded-full px-10 py-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/25 transition-all hover:scale-105"
          >
            <Link to="/cadastro">🚀 CRIAR CONTA GRATUITA</Link>
          </Button>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="mt-14 flex flex-wrap items-center justify-center gap-6 md:gap-10"
        >
          {[
            { icon: "👨‍👩‍👧", text: "Controle total dos pais" },
            { icon: "💰", text: "Educação financeira" },
            { icon: "📱", text: "App simples e divertido" },
            { icon: "🔒", text: "Segurança em tempo real" },
          ].map((badge) => (
            <div key={badge.text} className="flex items-center gap-2 text-muted-foreground font-body font-semibold text-sm">
              <span className="text-xl">{badge.icon}</span>
              {badge.text}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
