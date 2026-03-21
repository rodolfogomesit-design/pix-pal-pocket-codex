import { motion } from "framer-motion";

interface Props {
  saldo: number;
}

const KidBalance = ({ saldo }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-[2rem] shadow-xl border border-border p-8 text-center"
    >
      <p className="font-body text-sm text-muted-foreground mb-1">Meu saldo 💰</p>
      <motion.p
        className="font-display text-5xl font-extrabold text-primary"
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 10 }}
      >
        R$ {saldo.toFixed(2)}
      </motion.p>
      <div className="mt-4 flex justify-center gap-2">
        <motion.span
          className="text-3xl"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
        >
          💰
        </motion.span>
        <motion.span
          className="text-3xl"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
        >
          💵
        </motion.span>
        <motion.span
          className="text-3xl"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
        >
          🪙
        </motion.span>
      </div>
    </motion.div>
  );
};

export default KidBalance;
