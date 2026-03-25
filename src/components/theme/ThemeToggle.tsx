import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === "dark";

  if (!mounted) {
    return <button className="relative rounded-xl p-2" aria-hidden="true" />;
  }

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative p-2 rounded-xl hover:bg-muted transition-colors"
      title={isDark ? "Modo claro" : "Modo escuro"}
    >
      <motion.div
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {isDark ? (
          <Sun size={18} className="text-kids-yellow" />
        ) : (
          <Moon size={18} className="text-muted-foreground" />
        )}
      </motion.div>
    </button>
  );
};

export default ThemeToggle;
