import { motion } from "framer-motion";
import { ArrowLeft, Check, Copy, DollarSign, History, LogOut, Settings, Sparkles, UserCircle, Users, Wallet } from "lucide-react";

const kids = [
  { id: "1", nome: "Sophia Farias Gonçalves", apelido: "Sophia", codigo_publico: "00012", saldo: 320, is_frozen: false, aprovacao_transferencias: true, bloqueio_envio: false, miniGerente: true },
  { id: "2", nome: "Nicole Farias Gonçalves", apelido: "Nicole", codigo_publico: "00013", saldo: 185, is_frozen: false, aprovacao_transferencias: true, bloqueio_envio: false, miniGerente: false },
];

const parentBalance = 1120;
const kidsBalance = kids.reduce((sum, kid) => sum + kid.saldo, 0);
const familyBalance = parentBalance + kidsBalance;
const formatCurrency = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const ParentDashboardShowcase = () => {
  return (
    <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-border bg-background shadow-[0_24px_90px_-34px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-slate-950 dark:shadow-[0_24px_90px_-34px_rgba(0,0,0,0.55)]">
      <header className="border-b border-border bg-card px-3 py-3 sm:px-4 sm:py-4"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 sm:gap-3"><div className="flex items-center gap-1 text-muted-foreground"><ArrowLeft size={18} /></div><span className="font-display text-lg font-bold text-primary sm:text-2xl">Pix Kids</span></div><div className="flex items-center gap-2 text-muted-foreground sm:gap-4"><span className="hidden text-sm sm:block">Olá, Rodolfo</span><UserCircle size={16} /><Settings size={16} /><LogOut size={14} className="text-destructive" /></div></div></header>
      <main className="px-3 py-5 sm:px-4 sm:py-8">
        <div className="mb-4 px-1"><div className="flex flex-wrap items-center gap-2"><p className="font-display text-lg font-bold sm:text-xl">Rodolfo Gomes Gonçalves</p></div><button className="inline-flex items-center gap-1 font-display text-sm text-muted-foreground transition-colors hover:text-primary">ID: 00001 <Copy size={12} /></button></div>
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4"><MetricCard delay={0} label="Saldo de Rodolfo" value={formatCurrency(parentBalance)} className="from-primary to-primary/80 text-primary-foreground" /><MetricCard delay={0.1} label="Saldo total da família" value={formatCurrency(familyBalance)} className="from-kids-blue to-kids-blue/80 text-primary-foreground" /><MetricCard delay={0.2} label="Saldo total dos filhos" value={formatCurrency(kidsBalance)} className="from-kids-green to-kids-green/80 text-primary-foreground" /><MetricCard delay={0.3} label="Filhos cadastrados" value={`${kids.length}`} className="from-kids-yellow to-kids-yellow/80 text-secondary-foreground" /></div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4"><ActionButton label="Depositar" icon={DollarSign} className="bg-accent text-accent-foreground" /><ActionButton label="Sacar" icon={Wallet} className="bg-primary text-primary-foreground" /><ActionButton label="Histórico" icon={History} className="bg-kids-pink text-secondary-foreground" /></motion.div>
        <div className="mb-8"><div className="mb-5 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Users size={22} className="text-primary" /><h2 className="font-display text-2xl font-bold">Meus filhos</h2></div><button className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Adicionar filho</button></div><div className="grid grid-cols-1 gap-6 md:grid-cols-2">{kids.map((kid) => (<KidCardPreview key={kid.id} kid={kid} />))}</div></div>
      </main>
    </div>
  );
};

const MetricCard = ({ label, value, className, delay }: { label: string; value: string; className: string; delay: number }) => (
  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay }} whileHover={{ scale: 1.03, y: -2 }} className={`cursor-default rounded-2xl bg-gradient-to-br p-4 sm:rounded-3xl sm:p-5 xl:min-h-[138px] ${className}`}><div className="flex min-h-[98px] flex-col justify-between sm:min-h-[108px]"><p className="max-w-[14ch] text-balance font-body text-xs leading-5 opacity-80 sm:text-sm">{label}</p><p className="mt-3 break-words text-left font-display text-xl font-extrabold leading-tight sm:text-2xl xl:text-[1.75rem]">{value}</p></div></motion.div>
);

const ActionButton = ({ label, icon: Icon, className }: { label: string; icon: typeof DollarSign; className: string }) => (
  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}><button className={`h-14 w-full rounded-2xl text-sm font-bold shadow-md sm:h-16 sm:text-base ${className}`}><div className="flex items-center justify-center"><Icon size={20} className="mr-2" />{label}</div></button></motion.div>
);

const KidCardPreview = ({ kid }: { kid: (typeof kids)[number] }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -4, boxShadow: "0 20px 40px -12px hsl(var(--primary) / 0.15)" }} transition={{ duration: 0.3 }} className={`overflow-hidden rounded-3xl border border-border bg-card shadow-md ${kid.is_frozen ? "opacity-75" : ""}`}>
    <div className="flex items-center justify-between bg-gradient-to-r from-kids-blue-light to-kids-yellow-light px-6 py-4"><div className="flex items-center gap-3"><motion.span className="inline-flex rounded-2xl bg-white/80 p-2 text-primary" whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }} transition={{ duration: 0.5 }}><Users className="h-6 w-6" /></motion.span><div><h3 className="font-display text-lg font-bold">{kid.apelido || kid.nome}</h3><button className="mt-0.5 flex items-center gap-1 font-body text-xs text-primary hover:underline">ID: {kid.codigo_publico}<Copy size={10} /></button></div></div></div>
    <div className="px-6 py-5"><div className="mb-4 text-center"><p className="font-body text-sm text-muted-foreground">Saldo disponível</p><p className="font-display text-3xl font-extrabold text-primary">{formatCurrency(kid.saldo)}</p></div><div className="mb-5 flex flex-wrap gap-2">{kid.aprovacao_transferencias && (<span className="inline-flex items-center gap-1 rounded-full bg-kids-yellow-light px-3 py-1 text-xs font-body font-semibold text-secondary-foreground"><Check size={12} /> Aprovação ativa</span>)}</div><div className="mb-3"><button className="w-full rounded-2xl bg-primary px-4 py-3 font-bold text-primary-foreground">Enviar mesada</button></div>{kid.miniGerente && (<div className="mt-4 rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-950/20"><div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /><p className="text-sm font-semibold text-foreground dark:text-white">Mini Gerente ativo</p></div><p className="mt-1 text-xs text-muted-foreground">Aprender, indicar e ganhar comissão dentro do app.</p></div>)}</div>
  </motion.div>
);

export default ParentDashboardShowcase;
