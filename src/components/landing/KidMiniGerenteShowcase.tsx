import { motion } from "framer-motion";
import { ArrowDownToLine, Copy, DollarSign, Sparkles, TrendingUp, UserPlus, Users } from "lucide-react";

const referrals = [
  { id: "1", name: "Rafael Souza", code: "00145", date: "21/03/2026", commission: "R$ 6,00" },
  { id: "2", name: "Larissa Lima", code: "00152", date: "20/03/2026", commission: "R$ 4,00" },
];

const commissions = [
  { id: "1", deposit: "R$ 120,00", rate: "5%", date: "21/03/2026 14:10", value: "R$ 6,00" },
  { id: "2", deposit: "R$ 80,00", rate: "5%", date: "20/03/2026 09:25", value: "R$ 4,00" },
];

const KidMiniGerenteShowcase = () => {
  return (
    <div className="mx-auto max-w-sm space-y-4 overflow-hidden rounded-[2rem] border border-border bg-background shadow-[0_24px_80px_-30px_rgba(15,23,42,0.2)] dark:border-white/10 dark:bg-slate-950 dark:shadow-[0_24px_80px_-30px_rgba(0,0,0,0.55)]">
      <div className="rounded-t-[2rem] bg-gradient-to-r from-kids-yellow to-kids-orange px-5 py-5 text-center">
        <Sparkles className="mx-auto h-10 w-10 text-slate-900" />
        <h3 className="mt-2 font-display text-xl font-bold text-slate-900">Mini Gerente Pix Kids</h3>
        <p className="mt-1 text-sm text-slate-800/80">Indique amigos e ganhe comissões.</p>
      </div>
      <div className="space-y-4 px-4 pb-5">
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <p className="mb-2 text-sm text-muted-foreground">Seu código de indicação:</p>
          <button className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-6 py-3 font-display text-2xl font-bold text-primary transition-colors hover:bg-primary/20">00012<Copy size={20} /></button>
          <p className="mt-2 text-xs text-muted-foreground">Compartilhe este código com amigos.</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2"><UserPlus size={18} className="text-kids-orange" /><p className="text-sm font-semibold">Meu Mini Gerente</p></div>
          <div className="flex items-center justify-between rounded-xl bg-muted p-3"><div><p className="text-xs text-muted-foreground">Mini Gerente cadastrado:</p><p className="font-display text-sm font-bold">Sophia Farias Gonçalves</p><p className="text-xs text-muted-foreground">Código: 00012</p></div><Sparkles className="h-7 w-7 text-primary" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3"><StatCard icon={<Users size={18} className="mx-auto mb-1 text-primary" />} value="12" label="Indicados" /><StatCard icon={<TrendingUp size={18} className="mx-auto mb-1 text-kids-green" />} value="R$ 18,00" label="Total ganho" /><StatCard icon={<DollarSign size={18} className="mx-auto mb-1 text-kids-yellow" />} value="R$ 18,00" label="Disponível" /></div>
        <div className="rounded-2xl border border-border bg-card p-4"><button className="w-full rounded-xl bg-kids-green px-4 py-3 font-display font-bold text-accent-foreground hover:bg-kids-green/90"><span className="inline-flex items-center"><ArrowDownToLine size={18} className="mr-2" />Sacar para meu saldo</span></button></div>
        <div className="overflow-hidden rounded-2xl border border-border bg-card"><div className="border-b border-border px-4 py-3"><h4 className="font-display text-sm font-bold">Meus indicados</h4></div><div className="divide-y divide-border">{referrals.map((ref) => (<div key={ref.id} className="flex items-start justify-between gap-3 px-4 py-3"><div><p className="text-sm font-semibold">{ref.name}</p><p className="text-xs text-muted-foreground">ID: {ref.code} • {ref.date}</p></div><span className="text-right font-display text-sm font-bold text-kids-green">+{ref.commission}</span></div>))}</div></div>
        <div className="overflow-hidden rounded-2xl border border-border bg-card"><div className="border-b border-border px-4 py-3"><h4 className="font-display text-sm font-bold">Histórico de ganhos</h4></div><div className="divide-y divide-border">{commissions.map((com) => (<div key={com.id} className="flex items-start justify-between gap-3 px-4 py-3"><div><p className="text-xs text-muted-foreground">Depósito de {com.deposit} ({com.rate})</p><p className="text-[10px] text-muted-foreground">{com.date}</p></div><span className="text-right font-display text-sm font-bold text-kids-green">+{com.value}</span></div>))}</div></div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) => (
  <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="rounded-xl border border-border bg-card p-3 text-center">
    {icon}
    <p className="font-display text-xl font-bold">{value}</p>
    <p className="text-[10px] text-muted-foreground">{label}</p>
  </motion.div>
);

export default KidMiniGerenteShowcase;
