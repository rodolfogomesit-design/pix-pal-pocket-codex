import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useKids } from "@/hooks/useDashboard";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NotificationBell = () => {
  const { user } = useAuth();
  const { data: kids } = useKids();
  const queryClient = useQueryClient();
  const [count, setCount] = useState(0);
  const [animate, setAnimate] = useState(false);

  // Get initial pending count
  useEffect(() => {
    if (!user || !kids || kids.length === 0) return;

    const fetchPending = async () => {
      const kidIds = kids.map((k) => k.id);
      const { data, error } = await supabase
        .from("transactions")
        .select("id", { count: "exact", head: true })
        .eq("status", "pendente")
        .eq("tipo", "transferencia")
        .in("from_kid", kidIds);

      if (!error && data !== null) {
        // Use count from response
      }
      // Alternative: just count
      const { count: c } = await supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .eq("status", "pendente")
        .eq("tipo", "transferencia")
        .in("from_kid", kidIds);

      setCount(c || 0);
    };

    fetchPending();
  }, [user, kids]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!user || !kids || kids.length === 0) return;

    const kidIds = kids.map((k) => k.id);

    const channel = supabase
      .channel("pending-transfers")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transactions",
          filter: `tipo=eq.transferencia`,
        },
        (payload) => {
          const newTx = payload.new as { from_kid: string; status: string; to_kid: string; valor: number };
          // Only notify if it's from one of my kids and pending
          if (newTx.status === "pendente" && kidIds.includes(newTx.from_kid)) {
            setCount((prev) => prev + 1);
            setAnimate(true);
            setTimeout(() => setAnimate(false), 1000);

            // Find kid name
            const kid = kids.find((k) => k.id === newTx.from_kid);
            const kidName = kid?.apelido || kid?.nome || "Seu filho(a)";

            toast.info(`${kidName} quer fazer uma transferência de R$ ${Number(newTx.valor).toFixed(2)}! `, {
              duration: 8000,
            });

            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["kids"] });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "transactions",
          filter: `tipo=eq.transferencia`,
        },
        (payload) => {
          const updatedTx = payload.new as { from_kid: string; status: string };
          // If a pending transfer was approved/rejected, decrease count
          if (
            updatedTx.status !== "pendente" &&
            kidIds.includes(updatedTx.from_kid)
          ) {
            setCount((prev) => Math.max(0, prev - 1));
            queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["kids"] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, kids, queryClient]);

  return (
    <button className="relative p-2 rounded-xl hover:bg-muted transition-colors" title="Notificações">
      <motion.div animate={animate ? { rotate: [0, -15, 15, -10, 10, 0] } : {}} transition={{ duration: 0.5 }}>
        <Bell size={18} className={count > 0 ? "text-kids-orange" : "text-muted-foreground"} />
      </motion.div>
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center"
          >
            {count > 9 ? "9+" : count}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
};

export default NotificationBell;
