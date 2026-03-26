import { useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useKids, useParentBalance, useParentProfile } from "@/hooks/useDashboard";
import { useIsAdmin } from "@/hooks/useAdmin";
import AddKidDialog from "@/components/dashboard/AddKidDialog";
import KidCard from "@/components/dashboard/KidCard";
import ThemeToggle from "@/components/theme/ThemeToggle";
import AnimatedPig from "@/components/branding/AnimatedPig";
import { LogOut, Users, Shield, ArrowLeft, UserCircle, DollarSign, Wallet, History, Settings, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: kids, isLoading: kidsLoading } = useKids();
  const { data: isAdmin } = useIsAdmin();
  const { data: parentBalance = 0 } = useParentBalance();
  const { data: profile } = useParentProfile();

  const firstName = profile?.nome?.split(" ")[0] || "Responsável";
  const displayName = profile?.nome || firstName;
  const displayCode = profile?.codigo_usuario || null;

  const processReferral = useCallback(async () => {
    if (!user) return;
    const code = localStorage.getItem("pix_kids_referral_code");
    if (!code) return;
    try {
      const { data } = await supabase.rpc("register_referral", { _referral_code: code, _referred_user_id: user.id });
      const result = data as { success?: boolean } | null;
      if (result?.success) toast.success("Indicação registrada com sucesso!");
    } catch {
      // Ignora falha silenciosamente.
    } finally {
      localStorage.removeItem("pix_kids_referral_code");
    }
  }, [user]);

  useEffect(() => { processReferral(); }, [processReferral]);
  useEffect(() => { if (!loading && !user) navigate("/login"); }, [user, loading, navigate]);
  useEffect(() => {
    const enforceBlockedAccess = async () => {
      if (!user) return;
      const { data, error } = await supabase.rpc("is_current_user_blocked");
      if (error) {
        await signOut();
        navigate("/login");
        return;
      }
      if (data) {
        toast.error("Sua conta esta bloqueada.");
        await signOut();
        navigate("/login");
      }
    };

    void enforceBlockedAccess();
  }, [user, signOut, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center"><AnimatedPig size={56} className="mx-auto" /><p className="mt-4 font-display text-xl text-muted-foreground">Carregando...</p></div>
      </div>
    );
  }

  if (!user) return null;

  const kidsBalance = kids?.reduce((sum, kid) => sum + kid.saldo, 0) || 0;
  const familyBalance = parentBalance + kidsBalance;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card px-3 py-3 sm:px-4 sm:py-4"><div className="container mx-auto flex items-center justify-between"><div className="flex items-center gap-2 sm:gap-3"><Link to="/" className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-primary"><ArrowLeft size={18} /></Link><AnimatedPig size={34} /><span className="font-display text-lg font-bold text-primary sm:text-2xl">Pix Kids</span></div><div className="flex items-center gap-2 sm:gap-4"><span className="hidden font-body text-sm text-muted-foreground sm:block">Olá, {firstName}</span>{isAdmin && (<Link to="/admin" className="flex items-center gap-1 font-body text-sm text-primary hover:underline"><Shield size={14} /><span className="hidden sm:inline">Admin</span></Link>)}<Link to="/perfil" className="flex items-center gap-1 font-body text-sm text-muted-foreground transition-colors hover:text-primary"><UserCircle size={16} /><span className="hidden sm:inline">Perfil</span></Link><Link to="/configuracoes" className="flex items-center gap-1 font-body text-sm text-muted-foreground transition-colors hover:text-primary"><Settings size={16} /><span className="hidden sm:inline">Config</span></Link><ThemeToggle /><button onClick={signOut} className="flex items-center gap-1 font-body text-sm text-destructive hover:underline"><LogOut size={14} /><span className="hidden sm:inline">Sair</span></button></div></div></header>
      <main className="container mx-auto max-w-5xl px-3 py-5 sm:px-4 sm:py-8"><div className="mb-4 px-1"><div className="flex flex-wrap items-center gap-2"><p className="font-display text-lg font-bold sm:text-xl">{displayName}</p></div>{displayCode && (<button onClick={() => { navigator.clipboard.writeText(displayCode); toast.success("Código copiado!"); }} className="inline-flex items-center gap-1 font-display text-sm text-muted-foreground transition-colors hover:text-primary">ID: {displayCode} <Copy size={12} /></button>)}</div><div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 sm:gap-4"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} whileHover={{ scale: 1.03, y: -2 }} className="cursor-default rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-4 text-primary-foreground sm:rounded-3xl sm:p-6"><p className="font-body text-xs opacity-80 sm:text-sm">Seu saldo</p><p className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">R$ {parentBalance.toFixed(2)}</p></motion.div><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.1 }} whileHover={{ scale: 1.03, y: -2 }} className="cursor-default rounded-2xl bg-gradient-to-br from-kids-blue to-kids-blue/80 p-4 text-primary-foreground sm:rounded-3xl sm:p-6"><p className="font-body text-xs opacity-80 sm:text-sm">Saldo total</p><p className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">R$ {familyBalance.toFixed(2)}</p></motion.div><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.2 }} whileHover={{ scale: 1.03, y: -2 }} className="cursor-default rounded-2xl bg-gradient-to-br from-kids-green to-kids-green/80 p-4 text-primary-foreground sm:rounded-3xl sm:p-6"><p className="font-body text-xs opacity-80 sm:text-sm">Saldo total dos filhos</p><p className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">R$ {kidsBalance.toFixed(2)}</p></motion.div><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.3 }} whileHover={{ scale: 1.03, y: -2 }} className="cursor-default rounded-2xl bg-gradient-to-br from-kids-yellow to-kids-yellow/80 p-4 text-secondary-foreground sm:rounded-3xl sm:p-6"><p className="font-body text-xs opacity-80 sm:text-sm">Filhos cadastrados</p><p className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">{kids?.length || 0}</p></motion.div></div><motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} className="mb-8 grid grid-cols-3 gap-3 sm:gap-4"><motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}><Button onClick={() => navigate("/depositar")} className="h-14 w-full rounded-2xl bg-accent text-sm font-bold text-accent-foreground shadow-md hover:bg-accent/90 sm:h-16 sm:text-base"><DollarSign size={20} className="mr-2" />Depositar</Button></motion.div><motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}><Button onClick={() => navigate("/sacar")} className="h-14 w-full rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90 sm:h-16 sm:text-base"><Wallet size={20} className="mr-2" />Sacar</Button></motion.div><motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}><Button onClick={() => navigate("/historico")} className="h-14 w-full rounded-2xl bg-kids-pink text-sm font-bold text-secondary-foreground shadow-md hover:bg-kids-pink/80 sm:h-16 sm:text-base"><History size={20} className="mr-2" />Histórico</Button></motion.div></motion.div><div className="mb-8"><div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-2"><Users size={22} className="text-primary" /><h2 className="font-display text-2xl font-bold">Meus filhos</h2></div><AddKidDialog /></div>{kidsLoading ? (<div className="rounded-3xl border border-border bg-card p-8 text-center"><p className="font-body text-muted-foreground">Carregando...</p></div>) : !kids || kids.length === 0 ? (<div className="rounded-3xl border border-border bg-kids-blue-light p-10 text-center"><AnimatedPig size={60} className="mx-auto mb-4" /><h3 className="mb-2 font-display text-xl font-bold">Nenhum filho cadastrado</h3><p className="mb-4 font-body text-muted-foreground">Cadastre seu primeiro filho para começar a enviar mesadas!</p><AddKidDialog /></div>) : (<div className="grid grid-cols-1 gap-6 md:grid-cols-2">{kids.map((kid) => (<KidCard key={kid.id} kid={kid} />))}</div>)}</div></main>
    </div>
  );
};

export default Dashboard;
