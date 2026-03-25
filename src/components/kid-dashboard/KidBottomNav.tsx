import { useLocation, useNavigate } from "react-router-dom";
import { CreditCard, Home, PiggyBank } from "lucide-react";

const navItems = [
  { path: "/crianca/dashboard", label: "InÃ­cio", icon: Home },
  { path: "/crianca/pagar", label: "Pagar", icon: CreditCard },
  { path: "/crianca/poupar", label: "Poupar", icon: PiggyBank },
];

const KidBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[2rem] border-t border-border bg-card px-4 py-3 shadow-2xl">
      <div className="mx-auto flex max-w-lg justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 rounded-2xl px-4 py-2 font-body text-xs font-semibold transition-all ${
                isActive
                  ? "scale-105 bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={20} />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default KidBottomNav;
