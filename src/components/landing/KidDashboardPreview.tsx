import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ChartNoAxesColumn, House, PiggyBank, Sparkles, Star, WalletCards } from "lucide-react";

type KidPreviewScreen = "inicio" | "historico" | "gerente" | "pagar" | "pix" | "poupar" | "comissao";

const PREVIEW_ORDER: KidPreviewScreen[] = ["inicio", "historico", "gerente", "pagar", "pix", "poupar", "comissao"];
const actionCards = [
  { id: "pagar" as KidPreviewScreen, label: "Pagar um amigo", tone: "bg-[#FFE082] text-slate-900" },
  { id: "pix" as KidPreviewScreen, label: "Pagar com Pix", tone: "bg-[#86EFAC] text-slate-900" },
  { id: "poupar" as KidPreviewScreen, label: "Poupar", tone: "bg-[#BFDBFE] text-slate-900" },
  { id: "comissao" as KidPreviewScreen, label: "Sacar comissão", tone: "bg-gradient-to-br from-[#FDE68A] to-[#FDBA74] text-slate-900" },
];
const tabItems = [
  { id: "inicio" as KidPreviewScreen, label: "Início", icon: House },
  { id: "historico" as KidPreviewScreen, label: "Histórico", icon: ChartNoAxesColumn },
  { id: "gerente" as KidPreviewScreen, label: "Gerente", icon: Sparkles },
];

const KidDashboardPreview = () => {
  const [activeKidName, setActiveKidName] = useState("Sophia Farias Gonçalves");
  const [activePreview, setActivePreview] = useState<KidPreviewScreen>("inicio");

  useEffect(() => {
    const names = ["Sophia Farias Gonçalves", "Nicole Farias Gonçalves"];
    const interval = window.setInterval(() => setActiveKidName((current) => (current === names[0] ? names[1] : names[0])), 5000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const delay = activePreview === "inicio" ? 7000 : 4000;
    const timeout = window.setTimeout(() => {
      setActivePreview((current) => {
        const currentIndex = PREVIEW_ORDER.indexOf(current);
        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % PREVIEW_ORDER.length;
        return PREVIEW_ORDER[nextIndex];
      });
    }, delay);
    return () => window.clearTimeout(timeout);
  }, [activePreview]);

  return (
    <div className="mx-auto max-w-sm overflow-hidden rounded-[2.2rem] border border-primary/10 bg-gradient-to-b from-kids-blue-light via-background to-kids-green-light shadow-[0_24px_80px_-32px_rgba(124,58,237,0.5)] dark:border-white/10 dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 dark:shadow-[0_24px_80px_-32px_rgba(0,0,0,0.65)]">
      <div className="flex items-center justify-between bg-primary px-5 py-4 text-primary-foreground">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-primary-foreground/70">Painel da Criança</p>
          <div className="mt-1 h-7 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p key={activeKidName} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.28 }} className="font-display text-xl font-bold">Olá, {activeKidName}!</motion.p>
            </AnimatePresence>
          </div>
          <p className="mt-1 text-xs text-primary-foreground/75">Código: 00012</p>
        </div>
        <div className="rounded-2xl bg-white/10 p-3"><PiggyBank className="h-5 w-5" /></div>
      </div>
      <div className="min-h-[31rem] space-y-5 px-4 py-5 sm:min-h-[32rem]">
        <AnimatePresence mode="wait">
          {activePreview === "inicio" && (<motion.div key="inicio" initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 18 }} transition={{ duration: 0.22 }} className="space-y-5"><div className="rounded-[2rem] border border-border bg-card p-6 text-center shadow-xl"><p className="mb-1 text-sm text-muted-foreground">Meu saldo</p><p className="font-display text-5xl font-extrabold text-primary">R$ 320,00</p><div className="mt-4 flex justify-center gap-2 text-primary"><WalletCards className="h-6 w-6" /><PiggyBank className="h-6 w-6" /><Star className="h-6 w-6" /></div></div><div><p className="mb-3 font-display text-lg font-bold text-foreground dark:text-white">O que você quer fazer?</p><div className="grid grid-cols-2 gap-3">{actionCards.map((action) => (<button key={action.label} onClick={() => setActivePreview(action.id)} className={`${action.tone} rounded-2xl border border-white/40 p-4 text-center shadow-sm transition-transform hover:scale-[1.02] dark:border-white/10`}><span className="font-display text-sm font-bold">{action.label}</span></button>))}</div></div><div className="flex flex-wrap gap-2"><span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground dark:bg-slate-800 dark:text-slate-200">Limite: R$ 50/dia</span><span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground dark:bg-slate-800 dark:text-slate-200">R$ 120,00 guardados</span></div></motion.div>)}
          {activePreview === "historico" && (<motion.div key="historico" initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 18 }} transition={{ duration: 0.22 }} className="space-y-3"><p className="font-display text-lg font-bold text-foreground dark:text-white">Histórico</p>{[["Mesada recebida", "+ R$ 25,00", "Hoje"],["Guardado no cofrinho", "- R$ 10,00", "Ontem"],["Pagamento para amigo", "- R$ 8,00", "Ontem"]].map(([title, amount, date]) => (<div key={title} className="rounded-2xl border border-border bg-card p-4 shadow-sm"><div className="flex items-center justify-between gap-4"><div><p className="font-semibold text-foreground">{title}</p><p className="text-xs text-muted-foreground">{date}</p></div><p className="font-display font-bold text-primary">{amount}</p></div></div>))}</motion.div>)}
          {activePreview === "gerente" && (<motion.div key="gerente" initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 18 }} transition={{ duration: 0.22 }} className="space-y-4"><div className="rounded-[2rem] border border-border bg-card p-5 shadow-xl"><p className="font-display text-lg font-bold text-foreground">Mini Gerente Pix Kids</p><p className="mt-1 text-sm text-muted-foreground dark:text-slate-300">Aprender, indicar e ganhar.</p><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-2xl border border-white/40 bg-[#FFE082] p-4 text-center dark:border-white/10"><p className="text-xs text-slate-700">Indicações</p><p className="mt-1 font-display text-2xl font-bold text-slate-900">12</p></div><div className="rounded-2xl border border-white/40 bg-[#86EFAC] p-4 text-center dark:border-white/10"><p className="text-xs text-slate-700">Comissão</p><p className="mt-1 font-display text-2xl font-bold text-slate-900">R$ 18,00</p></div></div></div></motion.div>)}
          {activePreview === "pagar" && (<motion.div key="pagar" initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 18 }} transition={{ duration: 0.22 }} className="space-y-4"><div className="rounded-[2rem] border border-border bg-card p-5 shadow-xl"><p className="font-display text-lg font-bold text-foreground">Pagar um amigo</p><div className="mt-4 space-y-3"><div className="rounded-2xl bg-muted p-3 text-sm text-muted-foreground dark:bg-slate-800 dark:text-slate-200">Código do amigo: 00008</div><div className="rounded-2xl bg-muted p-3 text-sm text-muted-foreground dark:bg-slate-800 dark:text-slate-200">Valor: R$ 8,00</div><button className="w-full rounded-2xl border border-white/40 bg-[#FFE082] px-4 py-3 font-display font-bold text-slate-900 dark:border-white/10">Confirmar pagamento</button></div></div></motion.div>)}
          {activePreview === "pix" && (<motion.div key="pix" initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 18 }} transition={{ duration: 0.22 }} className="space-y-4"><div className="rounded-[2rem] border border-border bg-card p-5 shadow-xl"><p className="font-display text-lg font-bold text-foreground">Pagar com Pix</p><div className="mt-4 space-y-3"><div className="rounded-2xl bg-muted p-3 text-sm text-muted-foreground dark:bg-slate-800 dark:text-slate-200">Chave Pix: amigo@pixkids.app</div><div className="rounded-2xl bg-muted p-3 text-sm text-muted-foreground dark:bg-slate-800 dark:text-slate-200">Valor: R$ 12,00</div><button className="w-full rounded-2xl border border-white/40 bg-[#86EFAC] px-4 py-3 font-display font-bold text-slate-900 dark:border-white/10">Enviar Pix</button></div></div></motion.div>)}
          {activePreview === "poupar" && (<motion.div key="poupar" initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 18 }} transition={{ duration: 0.22 }} className="space-y-4"><div className="rounded-[2rem] border border-border bg-card p-5 shadow-xl"><p className="font-display text-lg font-bold text-foreground">Poupar</p><p className="mt-1 text-sm text-muted-foreground dark:text-slate-300">Guardar parte do saldo no cofrinho.</p><div className="mt-4 h-3 overflow-hidden rounded-full bg-muted"><div className="h-full w-[68%] rounded-full bg-[linear-gradient(90deg,#fb7185,#f59e0b,#22c55e,#38bdf8,#8b5cf6)]" /></div><p className="mt-3 text-sm font-semibold text-primary">R$ 120,00 guardados</p></div></motion.div>)}
          {activePreview === "comissao" && (<motion.div key="comissao" initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 18 }} transition={{ duration: 0.22 }} className="space-y-4"><div className="rounded-[2rem] border border-border bg-card p-5 shadow-xl"><p className="font-display text-lg font-bold text-foreground dark:text-white">Sacar comissão</p><p className="mt-1 text-sm text-muted-foreground dark:text-slate-300">Disponível para transferir ao saldo.</p><div className="mt-4 rounded-2xl bg-muted p-3 text-sm text-muted-foreground dark:bg-slate-800 dark:text-slate-200">Comissão disponível: R$ 18,00</div><button className="mt-3 w-full rounded-2xl border border-white/40 bg-gradient-to-br from-[#FDE68A] to-[#FDBA74] px-4 py-3 font-display font-bold text-slate-900 dark:border-white/10">Transferir para meu saldo</button></div></motion.div>)}
        </AnimatePresence>
      </div>
      <div className="border-t border-border bg-card px-4 py-3"><div className="flex items-center justify-around">{tabItems.map((tab) => (<button key={tab.label} onClick={() => setActivePreview(tab.id)} className={`flex flex-col items-center gap-1 rounded-2xl px-4 py-2 text-xs font-semibold ${activePreview === tab.id ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}><tab.icon className="h-5 w-5" /><span>{tab.label}</span></button>))}</div></div>
    </div>
  );
};

export default KidDashboardPreview;
