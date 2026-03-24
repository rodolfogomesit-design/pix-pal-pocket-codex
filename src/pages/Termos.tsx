import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import EmojiBrand from "@/components/branding/EmojiBrand";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";

const Termos = () => {
  const [searchParams] = useSearchParams();
  const tipo = searchParams.get("tipo") || "termos_uso";
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  const titulo = tipo === "politica_privacidade" ? "Política de Proteção de Dados" : "Termos de Uso";

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);

      const { data } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", tipo)
        .maybeSingle();

      setContent(data?.value || "Conteúdo não disponível no momento.");
      setLoading(false);
    };

    fetchContent();
  }, [tipo]);

  return (
    <div className="relative min-h-screen bg-background px-4 py-10">
      <div className="absolute left-4 top-4">
        <Link
          to="/cadastro"
          className="flex items-center gap-1 font-body text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft size={16} /> Voltar
        </Link>
      </div>
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="mx-auto max-w-2xl pt-12">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-3">
            <EmojiBrand size={56} />
            <span className="font-display text-3xl font-bold text-primary">Pix Kids</span>
          </Link>
        </div>

        <h1 className="mb-6 text-center font-display text-2xl font-bold">{titulo}</h1>

        {loading ? (
          <p className="text-center font-body text-muted-foreground">Carregando...</p>
        ) : (
          <div className="whitespace-pre-wrap rounded-2xl border border-border bg-card p-6 font-body text-sm leading-relaxed text-foreground">
            {content}
          </div>
        )}
      </div>
    </div>
  );
};

export default Termos;

