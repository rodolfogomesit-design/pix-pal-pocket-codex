import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";
import LoginChoiceDialog from "@/components/landing/LoginChoiceDialog";


const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-display text-2xl font-bold text-primary">
            🐷 Pix Kids
          </span>
        </div>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#como-funciona" className="font-body font-semibold text-muted-foreground hover:text-primary transition-colors">
            Como funciona
          </a>
          <a href="#mini-gerente" className="font-body font-semibold text-muted-foreground hover:text-primary transition-colors">
            Mini Gerente
          </a>
          <a href="#beneficios" className="font-body font-semibold text-muted-foreground hover:text-primary transition-colors">
            Benefícios
          </a>
          <a href="#faq" className="font-body font-semibold text-muted-foreground hover:text-primary transition-colors">
            FAQ
          </a>
          <ThemeToggle />
          <LoginChoiceDialog
            trigger={
              <Button variant="outline" size="lg" className="font-display font-bold text-lg rounded-full px-8">
                Entrar
              </Button>
            }
          />
          <Button asChild size="lg" className="font-display font-bold text-lg rounded-full px-8 bg-kids-yellow text-secondary-foreground hover:bg-kids-yellow/90 shadow-lg">
            <Link to="/cadastro">🚀 Criar conta</Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-card border-b border-border px-4 pb-4 space-y-3">
          <a href="#como-funciona" className="block font-body font-semibold text-muted-foreground py-2" onClick={() => setIsOpen(false)}>
            Como funciona
          </a>
          <a href="#mini-gerente" className="block font-body font-semibold text-muted-foreground py-2" onClick={() => setIsOpen(false)}>
            Mini Gerente
          </a>
          <a href="#beneficios" className="block font-body font-semibold text-muted-foreground py-2" onClick={() => setIsOpen(false)}>
            Benefícios
          </a>
          <a href="#faq" className="block font-body font-semibold text-muted-foreground py-2" onClick={() => setIsOpen(false)}>
            FAQ
          </a>
          <LoginChoiceDialog
            trigger={
              <Button variant="outline" className="w-full font-display font-bold rounded-full">
                Entrar
              </Button>
            }
          />
          <Button asChild className="w-full font-display font-bold rounded-full bg-kids-yellow text-secondary-foreground hover:bg-kids-yellow/90">
            <Link to="/cadastro">🚀 Criar conta</Link>
          </Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
