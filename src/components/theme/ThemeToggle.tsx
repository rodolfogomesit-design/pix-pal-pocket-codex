import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative p-2 rounded-xl hover:bg-muted transition-colors"
      title={theme === "dark" ? "Modo claro" : "Modo escuro"}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {theme === "dark" ? (
          <Sun size={18} className="text-kids-yellow" />
        ) : (
          <Moon size={18} className="text-muted-foreground" />
        )}
      </motion.div>
    </button>
  );
};

export default ThemeToggle;
