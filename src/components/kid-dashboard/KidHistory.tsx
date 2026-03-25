import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { Printer } from "lucide-react";
import { printReceipt } from "@/lib/printReceipt";

interface Props {
  kidId: string;
}

const statusColors: Record<string, string> = {
  aprovado: "bg-kids-green-light text-kids-green",
  pendente: "bg-kids-yellow-light text-kids-orange",
  recusado: "bg-destructive/10 text-destructive",
};

const KidHistory = ({ kidId }: Props) => {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["kid-transactions", kidId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_kid_transactions", {
        _kid_id: kidId,
      });
      if (error) throw error;
      return data as Array<{
        id: string;
        tipo: string;
        valor: number;
        descricao: string | null;
        status: string;
        created_at: string;
        from_name: string;
        to_name: string;
        direction: string;
        from_codigo: string;
        to_codigo: string;
      }>;
    },
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-[2rem] p-8 text-center border border-border">
        <p className="font-body text-muted-foreground">Carregando... </p>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-card rounded-[2rem] p-8 text-center border border-border">
        <span className="text-5xl mb-3 inline-block"></span>
        <p className="font-display text-lg font-bold">Nenhuma movimentação</p>
        <p className="font-body text-sm text-muted-foreground">
          Quando você receber ou enviar dinheiro, vai aparecer aqui!
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-display text-lg font-bold mb-4">Minhas movimentações </h3>
      <div className="space-y-3">
        {transactions.map((tx, index) => {
          const isSent = tx.direction === "sent";
          const emoji = isSent ? "" : "";
          const statusStyle = statusColors[tx.status] || statusColors.aprovado;

          return (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-2xl p-4 border border-border shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{emoji}</span>
                  <div>
                    <p className="font-body font-semibold text-sm">
                      {tx.descricao || tx.tipo}
                    </p>
                    <p className="font-body text-xs text-muted-foreground">
                      {isSent ? (
                        <>Enviado para <span className="font-semibold text-foreground">{tx.to_name}</span>
                        {tx.to_codigo && <span className="text-muted-foreground"> (ID: {tx.to_codigo})</span>}</>
                      ) : (
                        <>Recebido de <span className="font-semibold text-foreground">{tx.from_name}</span>
                        {tx.from_codigo && <span className="text-muted-foreground"> (ID: {tx.from_codigo})</span>}</>
                      )}
                    </p>
                    <p className="font-body text-xs text-muted-foreground">
                      {format(new Date(tx.created_at), "dd MMM, HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <p className={`font-display font-bold ${isSent ? "text-destructive" : "text-kids-green"}`}>
                    {isSent ? "-" : "+"} R$ {Number(tx.valor).toFixed(2)}
                  </p>
                  <span className={`text-[10px] font-body font-semibold px-2 py-0.5 rounded-full ${statusStyle}`}>
                    {tx.status}
                  </span>
                  <button
                    onClick={() => printReceipt({
                      tipo: tx.tipo,
                      valor: Number(tx.valor),
                      data: tx.created_at,
                      de: tx.from_name,
                      para: tx.to_name,
                      status: tx.status,
                      descricao: tx.descricao,
                    })}
                    className="text-muted-foreground hover:text-primary transition-colors p-1"
                    title="Imprimir comprovante"
                  >
                    <Printer size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default KidHistory;
