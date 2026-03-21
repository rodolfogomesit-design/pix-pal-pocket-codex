import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { KidProfile } from "@/hooks/useDashboard";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface Props {
  kid: KidProfile;
}

const DeleteKidDialog = ({ kid }: Props) => {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const hasSaldo = kid.saldo > 0;

  const handleDelete = async () => {
    if (hasSaldo) return;
    setLoading(true);
    const { data, error } = await (supabase.rpc as any)("delete_kid_account", { _kid_id: kid.id });
    if (error) {
      toast.error("Erro ao excluir conta.");
    } else {
      const result = data as any;
      if (!result?.success) {
        toast.error(result?.error || "Erro ao excluir.");
      } else {
        toast.success(`Conta de ${kid.nome} excluída.`);
        queryClient.invalidateQueries({ queryKey: ["kids"] });
      }
    }
    setLoading(false);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl gap-1 font-body">
          <Trash2 size={14} /> Excluir
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display">Excluir conta de {kid.nome}?</AlertDialogTitle>
          <AlertDialogDescription className="font-body">
            {hasSaldo
              ? `${kid.apelido || kid.nome} ainda possui R$ ${kid.saldo.toFixed(2)} de saldo. Resgate o dinheiro antes de excluir a conta.`
              : "Esta ação é irreversível. Todos os dados, histórico e mensagens serão apagados permanentemente."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl font-body">{hasSaldo ? "Entendi" : "Cancelar"}</AlertDialogCancel>
          {!hasSaldo && (
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="rounded-xl font-body bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Excluindo..." : "Sim, excluir"}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteKidDialog;
