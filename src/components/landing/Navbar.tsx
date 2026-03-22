import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

import LoginChoiceDialog from "@/components/landing/LoginChoiceDialog";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#mini-gerente", label: "Mini gerente" },
  { href: "#beneficios", label: "Beneficios" },
  { href: "#faq", label: "FAQ" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-white/85 backdrop-blur-xl">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-sm font-black text-primary-foreground shadow-lg shadow-primary/20">
            PK
          </div>
          <div>
            <p className="font-display text-xl font-extrabold tracking-tight text-foreground">
              Pix Kids
            </p>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              carteira digital familiar
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <LoginChoiceDialog
            trigger={
              <Button
                variant="outline"
                className="rounded-full border-primary/15 bg-white px-6 font-bold text-foreground hover:bg-slate-50"
              >
                Entrar
              </Button>
            }
          />
          <Button asChild className="rounded-full px-6 font-bold shadow-lg shadow-primary/15">
            <Link to="/cadastro">Criar conta</Link>
          </Button>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-foreground md:hidden"
          onClick={() => setIsOpen((value) => !value)}
          aria-label="Abrir menu"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-border/70 bg-white px-4 pb-5 pt-4 md:hidden">
          <div className="space-y-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block rounded-2xl px-3 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-slate-50 hover:text-foreground"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <LoginChoiceDialog
              trigger={
                <Button
                  variant="outline"
                  className="w-full rounded-full border-primary/15 bg-white font-bold"
                >
                  Entrar
                </Button>
              }
            />
            <Button asChild className="w-full rounded-full font-bold">
              <Link to="/cadastro">Criar conta</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
