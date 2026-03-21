

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐷</span>
            <span className="font-display text-2xl font-bold text-primary">Pix Kids</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-body text-muted-foreground">
            <span>💰 Educação financeira</span>
            <span>👨‍👩‍👧 Controle dos pais</span>
            <span>📱 Tecnologia</span>
            <span>🔒 Segurança</span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border text-center space-y-3">
          <p className="font-body text-sm text-muted-foreground">
            © {new Date().getFullYear()} Pix Kids. Aprender a cuidar do dinheiro nunca foi tão simples.
          </p>
          <p className="font-body text-sm text-muted-foreground">
            CNPJ 65.637.227/0001-98 — Ps Intermediadora de Pagamento LTDA.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
