import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TermsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "termos_uso" | "politica_privacidade";
}

const copy = {
  termos_uso: {
    title: "Termos de Uso",
  },
  politica_privacidade: {
    title: "Política de Proteção de Dados",
  },
} as const;

export default function TermsDialog({ open, onOpenChange, type }: TermsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!open) return;

    const loadContent = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", type)
        .maybeSingle();

      setContent(data?.value || "Conteúdo não disponível no momento.");
      setLoading(false);
    };

    loadContent();
  }, [open, type]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle className="font-display text-xl text-left">
            {copy[type].title}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          {loading ? (
            <p className="font-body text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <div className="whitespace-pre-wrap font-body text-sm leading-relaxed text-foreground">
              {content}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
