import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

interface Props {
  kidId: string;
}

const KidGoals = ({ kidId }: Props) => {
  const { data: goals, isLoading } = useQuery({
    queryKey: ["kid-goals", kidId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_kid_goals", {
        _kid_id: kidId,
      });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-[2rem] p-8 text-center border border-border">
        <p className="font-body text-muted-foreground">Carregando metas... 🎯</p>
      </div>
    );
  }

  if (!goals || goals.length === 0) {
    return (
      <div className="bg-card rounded-[2rem] p-8 text-center border border-border">
        <motion.span
          className="text-6xl mb-3 inline-block"
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
        >
          🐷
        </motion.span>
        <p className="font-display text-lg font-bold">Nenhuma meta ainda</p>
        <p className="font-body text-sm text-muted-foreground">
          Peça para seus pais criarem uma meta de economia para você!
        </p>
        <p className="font-body text-xs text-muted-foreground mt-2">
          Exemplo: 🎮 Comprar um jogo novo — R$ 200,00
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-display text-lg font-bold mb-4">Minhas metas 🎯</h3>
      <div className="space-y-4">
        {goals.map((goal, index) => {
          const progress = goal.valor_alvo > 0
            ? Math.min((Number(goal.valor_atual) / Number(goal.valor_alvo)) * 100, 100)
            : 0;

          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-card rounded-2xl p-5 border border-border shadow-sm ${
                goal.concluido ? "bg-kids-green-light/50" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{goal.emoji}</span>
                  <div>
                    <p className="font-display font-bold text-sm">
                      {goal.titulo}
                      {goal.concluido && " ✅"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-display font-bold text-xs text-primary">
                    R$ {Number(goal.valor_atual).toFixed(2)}
                  </p>
                  <p className="font-body text-[10px] text-muted-foreground">
                    de R$ {Number(goal.valor_alvo).toFixed(2)}
                  </p>
                </div>
              </div>

              <Progress
                value={progress}
                className="h-4 rounded-full bg-muted"
              />

              <div className="flex items-center justify-between mt-2">
                <span className="font-body text-xs text-muted-foreground">
                  {progress.toFixed(0)}% completo
                </span>
                <span className="font-body text-xs text-muted-foreground">
                  Faltam R$ {Math.max(0, Number(goal.valor_alvo) - Number(goal.valor_atual)).toFixed(2)}
                </span>
              </div>

              {goal.concluido && (
                <div className="mt-3 bg-kids-green-light rounded-xl p-2 text-center">
                  <p className="font-display font-bold text-sm text-kids-green">
                    🎉 Meta alcançada! Parabéns!
                  </p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default KidGoals;
