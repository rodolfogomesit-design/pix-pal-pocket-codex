import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface LoginChoiceDialogProps {
  trigger: ReactNode;
}

const LoginChoiceDialog = ({ trigger }: LoginChoiceDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center font-display text-2xl">
            Quem está entrando?
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
          <Button
            asChild
            variant="outline"
            className="h-auto flex-col items-center gap-3 rounded-2xl border-2 p-6 transition-all hover:border-primary hover:bg-primary/5"
            onClick={() => setOpen(false)}
          >
            <Link to="/login">
              <span className="text-4xl">👨‍👩‍👧</span>
              <span className="font-display text-lg font-bold text-black dark:text-white">Sou responsável</span>
              <span className="text-center font-body text-xs text-muted-foreground">
                Pai, mãe ou responsável
              </span>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-auto flex-col items-center gap-3 rounded-2xl border-2 p-6 transition-all hover:border-kids-green hover:bg-kids-green/5"
            onClick={() => setOpen(false)}
          >
            <Link to="/crianca">
              <span className="text-4xl">🧒</span>
              <span className="font-display text-lg font-bold text-black dark:text-white">Sou criança</span>
              <span className="text-center font-body text-xs text-muted-foreground">
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
