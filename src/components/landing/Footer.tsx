import EmojiBrand from "@/components/branding/EmojiBrand";

const Footer = () => {
  return (
    <footer className="border-t border-border/70 bg-slate-950 py-12 text-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-md">
            <div className="flex items-center gap-3">
              <EmojiBrand size={48} className="bg-white" />
              <div>
                <p className="font-display text-2xl font-extrabold tracking-tight">
                  Pix Kids
                </p>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/55">
                  educação financeira para famílias
                </p>
              </div>
            </div>

            <p className="mt-5 text-sm leading-7 text-white/62">
              Uma plataforma para organizar mesadas, limites, metas e
              acompanhamentos com uma experiência mais segura, clara e profissional.
            </p>
          </div>

          <div className="grid gap-2 text-sm text-white/62 md:text-right">
            <span>Controle parental e acompanhamento em tempo real</span>
            <span>Fluxos simples para responsável e criança</span>
            <span>Ambiente pensado para a rotina financeira familiar</span>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-sm text-white/45">
          <p>&copy; {new Date().getFullYear()} Pix Kids. Todos os direitos reservados.</p>
          <p className="mt-2">CNPJ 65.637.227/0001-98 - Ps Intermediadora de Pagamento LTDA.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
