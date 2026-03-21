import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReactNode, useState } from "react";

interface LoginChoiceDialogProps {
  trigger: ReactNode;
}

const LoginChoiceDialog = ({ trigger }: LoginChoiceDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-center">
            Quem está entrando? 🤔
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
          <Button
            asChild
            variant="outline"
            className="h-auto flex flex-col items-center gap-3 p-6 rounded-2xl border-2 hover:border-primary hover:bg-primary/5 transition-all"
            onClick={() => setOpen(false)}
          >
            <Link to="/login">
              <span className="text-4xl">👨‍👩‍👧</span>
              <span className="font-display font-bold text-lg">Sou responsável</span>
              <span className="font-body text-xs text-muted-foreground text-center">
                Pai, mãe ou responsável
              </span>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-auto flex flex-col items-center gap-3 p-6 rounded-2xl border-2 hover:border-kids-green hover:bg-kids-green/5 transition-all"
            onClick={() => setOpen(false)}
          >
            <Link to="/crianca">
              <span className="text-4xl">🧒</span>
              <span className="font-display font-bold text-lg">Sou criança</span>
              <span className="font-body text-xs text-muted-foreground text-center">
                Entrar com código e PIN
              </span>
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginChoiceDialog;
