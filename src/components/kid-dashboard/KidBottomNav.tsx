import { useNavigate, useLocation } from "react-router-dom";
import { Home, CreditCard, PiggyBank, History } from "lucide-react";

const navItems = [
  { path: "/crianca/dashboard", label: "Início", emoji: "🏠", icon: Home },
  { path: "/crianca/pagar", label: "Pagar", emoji: "💸", icon: CreditCard },
  { path: "/crianca/poupar", label: "Poupar", emoji: "🐷", icon: PiggyBank },
];

const KidBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-2xl rounded-t-[2rem] px-4 py-3 z-50">
      <div className="max-w-lg mx-auto flex justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all font-body text-xs font-semibold ${
                isActive
                  ? "bg-primary/10 text-primary scale-105"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="text-xl">{item.emoji}</span>
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default KidBottomNav;
