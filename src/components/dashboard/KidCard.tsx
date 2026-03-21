import { useState } from "react";
import { motion } from "framer-motion";
import type { KidProfile } from "@/hooks/useDashboard";
import SendAllowanceDialog from "./SendAllowanceDialog";
import ParentalControlsDialog from "./ParentalControlsDialog";
import RescueAllowanceDialog from "./RescueAllowanceDialog";
import DeleteKidDialog from "./DeleteKidDialog";
import ResetPinDialog from "./ResetPinDialog";
import MiniGerenteToggle from "./MiniGerenteToggle";
import { Snowflake, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface Props {
  kid: KidProfile;
}

const KidCard = ({ kid }: Props) => {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(kid.codigo_publico);
    setCopied(true);
    toast.success("Código copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: "0 20px 40px -12px hsl(var(--primary) / 0.15)" }}
      transition={{ duration: 0.3 }}
      className={`bg-card rounded-3xl border border-border shadow-md overflow-hidden ${kid.is_frozen ? "opacity-75" : ""}`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-kids-blue-light to-kids-yellow-light px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.span className="text-3xl inline-block" whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.2 }} transition={{ duration: 0.5 }}>🧒</motion.span>
          <div>
            <h3 className="font-display text-lg font-bold">{kid.apelido || kid.nome}</h3>
            
            <button
              onClick={copyCode}
              className="flex items-center gap-1 font-body text-xs text-primary hover:underline mt-0.5"
            >
              ID: {kid.codigo_publico}
              {copied ? <Check size={10} /> : <Copy size={10} />}
            </button>
          </div>
        </div>
        {kid.is_frozen && (
          <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-body font-semibold">
            <Snowflake size={12} /> Congelada
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-6 py-5">
        {/* Balance */}
        <div className="text-center mb-4">
          <p className="font-body text-sm text-muted-foreground">Saldo disponível</p>
          <p className="font-display text-3xl font-extrabold text-primary">
            R$ {kid.saldo.toFixed(2)}
          </p>
        </div>


        {/* Status badges */}
        <div className="flex flex-wrap gap-2 mb-5">
          {kid.aprovacao_transferencias && (
            <span className="inline-flex items-center gap-1 bg-kids-yellow-light text-secondary-foreground px-3 py-1 rounded-full text-xs font-body font-semibold">
              ✅ Aprovação ativa
            </span>
          )}
          {kid.bloqueio_envio && (
            <span className="inline-flex items-center gap-1 bg-destructive/10 text-destructive px-3 py-1 rounded-full text-xs font-body font-semibold">
              🚫 Envio bloqueado
            </span>
          )}
        </div>

        {/* Send allowance - prominent */}
        <div className="mb-3">
          <SendAllowanceDialog kid={kid} />
        </div>

        {/* Other actions */}
        <div className="flex flex-wrap gap-2">
          <RescueAllowanceDialog kid={kid} />
          <ParentalControlsDialog kid={kid} />
          <ResetPinDialog kid={kid} />
          <DeleteKidDialog kid={kid} />
        </div>

        {/* Mini Gerente */}
        <MiniGerenteToggle kid={kid} />
      </div>
    </motion.div>
  );
};

export default KidCard;
