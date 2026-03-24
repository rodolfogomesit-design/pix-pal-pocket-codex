import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

import EmojiBrand from "@/components/branding/EmojiBrand";
import LoginChoiceDialog from "@/components/landing/LoginChoiceDialog";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#mini-gerente", label: "Mini gerente" },
  { href: "#beneficios", label: "Benefícios" },
  { href: "#faq", label: "FAQ" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/30 bg-white/75 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-3 sm:gap-4">
          <EmojiBrand
            size={48}
            className="dark:bg-slate-900/80 dark:shadow-fuchsia-900/25"
          />
          <div>
            <p className="font-display text-[1.35rem] font-extrabold tracking-tight text-foreground sm:text-xl">
              Pix Kids
            </p>
            <p className="hidden text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground sm:block">
              Pix infantil com controle para toda a família
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
                className="rounded-full border-white/40 bg-white/70 px-6 font-bold text-foreground hover:bg-white dark:border-white/15 dark:bg-slate-900/80 dark:hover:bg-slate-900"
              >
                Entrar
              </Button>
            }
          />
          <Button
            asChild
            className="rounded-full border-0 bg-[linear-gradient(135deg,#fb7185,#f59e0b,#22c55e,#38bdf8,#8b5cf6)] px-6 font-bold text-white shadow-lg shadow-fuchsia-300/30 hover:opacity-95 dark:shadow-fuchsia-950/30"
          >
            <Link to="/cadastro">Criar conta</Link>
          </Button>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/40 bg-white/70 text-foreground dark:border-white/15 dark:bg-slate-900/80 md:hidden"
          onClick={() => setIsOpen((value) => !value)}
          aria-label="Abrir menu"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-white/30 bg-white/90 px-4 pb-5 pt-4 dark:border-white/10 dark:bg-slate-950/95 md:hidden">
          <div className="space-y-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block rounded-2xl px-3 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/5"
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
                  className="w-full rounded-full border-white/40 bg-white/70 font-bold dark:border-white/15 dark:bg-slate-900/80"
                >
                  Entrar
                </Button>
              }
            />
            <Button
              asChild
              className="w-full rounded-full border-0 bg-[linear-gradient(135deg,#fb7185,#f59e0b,#22c55e,#38bdf8,#8b5cf6)] font-bold text-white"
            >
              <Link to="/cadastro">Criar conta</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
