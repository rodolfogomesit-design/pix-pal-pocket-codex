import { useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentGuardianProfile, useKids, useParentBalance, useParentProfile } from "@/hooks/useDashboard";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useGuardianRole } from "@/hooks/useGuardianRole";
import AddKidDialog from "@/components/dashboard/AddKidDialog";
import KidCard from "@/components/dashboard/KidCard";
import GuardianManagement from "@/components/dashboard/GuardianManagement";
import ThemeToggle from "@/components/theme/ThemeToggle";
import {
  LogOut,
  Users,
  Shield,
  ArrowLeft,
  UserCircle,
  DollarSign,
  Wallet,
  History,
  Settings,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: kids, isLoading: kidsLoading } = useKids();
  const { data: isAdmin } = useIsAdmin();
  const { data: guardianRole } = useGuardianRole();

  const { data: parentBalance = 0 } = useParentBalance();
  const { data: profile } = useParentProfile();
  const { data: currentGuardianProfile } = useCurrentGuardianProfile();
  const currentFirstName = currentGuardianProfile?.nome?.split(" ")[0] || profile?.nome?.split(" ")[0] || "Responsável";
  const currentDisplayName = currentGuardianProfile?.nome || profile?.nome || currentFirstName;
  const currentDisplayCode = currentGuardianProfile?.codigo_usuario || profile?.codigo_usuario || null;

  const firstName = profile?.nome?.split(" ")[0] || "Responsável";

  const processReferral = useCallback(async () => {
    if (!user) return;

    const code = localStorage.getItem("pix_kids_referral_code");
    if (!code) return;

    try {
      const { data } = await supabase.rpc("register_referral", {
        _referral_code: code,
        _referred_user_id: user.id,
      });
      const result = data as any;

      if (result?.success) {
        toast.success("Indicação registrada com sucesso! 🎉");
      }
    } catch {
      // Silently fail, referral registration is not critical to app usage.
    } finally {
      localStorage.removeItem("pix_kids_referral_code");
    }
  }, [user]);

  useEffect(() => {
    processReferral();
  }, [processReferral]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <span className="text-4xl animate-bounce-coin">🐷</span>
          <p className="font-display text-xl mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const kidsBalance = kids?.reduce((sum, kid) => sum + kid.saldo, 0) || 0;
  const familyBalance = parentBalance + kidsBalance;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-3 sm:px-4 py-3 sm:py-4 sticky top-0 z-40">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/" className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <span className="text-2xl">🐷</span>
            <span className="font-display text-lg sm:text-2xl font-bold text-primary">Pix Kids</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="font-body text-sm text-muted-foreground hidden sm:block">
              Ol?, {currentFirstName} ??
            </span>
            {isAdmin && (
              <Link to="/admin" className="flex items-center gap-1 font-body text-sm text-primary hover:underline">
                <Shield size={14} />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}
            <Link to="/perfil" className="flex items-center gap-1 font-body text-sm text-muted-foreground hover:text-primary transition-colors">
              <UserCircle size={16} />
              <span className="hidden sm:inline">Perfil</span>
            </Link>
            <Link to="/configuracoes" className="flex items-center gap-1 font-body text-sm text-muted-foreground hover:text-primary transition-colors">
              <Settings size={16} />
              <span className="hidden sm:inline">Config</span>
            </Link>
            <ThemeToggle />
            <button
              onClick={signOut}
              className="flex items-center gap-1 font-body text-sm text-destructive hover:underline"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-5 sm:py-8 max-w-5xl">
        <div className="mb-4 px-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display font-bold text-lg sm:text-xl">{currentDisplayName}</p>
          </div>
          {currentDisplayCode && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(currentDisplayCode);
                toast.success("Código copiado!");
              }}
              className="font-display text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 transition-colors"
            >
              ID: {currentDisplayCode} <Copy size={12} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            whileHover={{ scale: 1.03, y: -2 }}
            className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-primary-foreground cursor-default"
          >
            <p className="font-body text-xs sm:text-sm opacity-80">Saldo de {currentFirstName}</p>
            <p className="font-display text-2xl sm:text-3xl font-extrabold mt-1">
              R$ {parentBalance.toFixed(2)}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            whileHover={{ scale: 1.03, y: -2 }}
            className="bg-gradient-to-br from-kids-blue to-kids-blue/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-primary-foreground cursor-default"
          >
            <p className="font-body text-xs sm:text-sm opacity-80">Saldo total da família</p>
            <p className="font-display text-2xl sm:text-3xl font-extrabold mt-1">
              R$ {familyBalance.toFixed(2)}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            whileHover={{ scale: 1.03, y: -2 }}
            className="bg-gradient-to-br from-kids-green to-kids-green/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-primary-foreground cursor-default"
          >
            <p className="font-body text-xs sm:text-sm opacity-80">Saldo total dos filhos</p>
            <p className="font-display text-2xl sm:text-3xl font-extrabold mt-1">
              R$ {kidsBalance.toFixed(2)}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            whileHover={{ scale: 1.03, y: -2 }}
            className="bg-gradient-to-br from-kids-yellow to-kids-yellow/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-secondary-foreground cursor-default"
          >
            <p className="font-body text-xs sm:text-sm opacity-80">Filhos cadastrados</p>
            <p className="font-display text-2xl sm:text-3xl font-extrabold mt-1">
              {kids?.length || 0}
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="grid grid-cols-3 gap-3 sm:gap-4 mb-8"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={() => navigate("/depositar")}
              className="w-full h-14 sm:h-16 rounded-2xl text-sm sm:text-base font-bold bg-accent text-accent-foreground hover:bg-accent/90 shadow-md"
            >
              <DollarSign size={20} className="mr-2" />
              Depositar
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={() => navigate("/sacar")}
              className="w-full h-14 sm:h-16 rounded-2xl text-sm sm:text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
            >
              <Wallet size={20} className="mr-2" />
              Sacar
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={() => navigate("/historico")}
              className="w-full h-14 sm:h-16 rounded-2xl text-sm sm:text-base font-bold bg-kids-pink text-secondary-foreground hover:bg-kids-pink/80 shadow-md"
            >
              <History size={20} className="mr-2" />
              Histórico
            </Button>
          </motion.div>
        </motion.div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Users size={22} className="text-primary" />
              <h2 className="font-display text-2xl font-bold">Meus filhos</h2>
            </div>
            <AddKidDialog />
          </div>

          {kidsLoading ? (
            <div className="bg-card rounded-3xl border border-border p-8 text-center">
              <p className="font-body text-muted-foreground">Carregando...</p>
            </div>
          ) : !kids || kids.length === 0 ? (
            <div className="bg-kids-blue-light rounded-3xl p-10 text-center border border-border">
              <span className="text-5xl mb-4 inline-block">👧</span>
              <h3 className="font-display text-xl font-bold mb-2">Nenhum filho cadastrado</h3>
              <p className="font-body text-muted-foreground mb-4">
                Cadastre seu primeiro filho para começar a enviar mesadas!
              </p>
              <AddKidDialog />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {kids.map((kid) => (
                <KidCard key={kid.id} kid={kid} />
              ))}
            </div>
          )}
        </div>

        <div className="mb-8">
          <GuardianManagement />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;



