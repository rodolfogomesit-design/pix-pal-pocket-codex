import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AdminMiniGerente from "@/components/admin/AdminMiniGerente";
import LimitesUsuarioSection from "@/components/admin/LimitesUsuarioSection";
import TaxasUsuarioSection from "@/components/admin/TaxasUsuarioSection";
import TransacoesTab from "@/components/admin/TransacoesTab";
import { useAuth } from "@/contexts/AuthContext";
import {
  useIsAdmin,
  useAdminMetrics,
  useAdminDetailedMetrics,
  useAdminSearchUsers,
  useAdminUserKids,
  useAdminToggleFreeze,
  useAdminRecentTransactions,
} from "@/hooks/useAdmin";
import type { AdminUser } from "@/hooks/useAdmin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdminUserActions from "@/components/admin/AdminUserActions";
import {
  LogOut,
  Search,
  Users,
  Baby,
  ArrowLeftRight,
  DollarSign,
  Clock,
  Shield,
  Snowflake,
  Sun,
  ArrowLeft,
  Eye,
  Settings,
  Save,
  ChevronLeft,
  ChevronRight,
  Download,
  LayoutDashboard,
  Sliders,
  Receipt,
  FileText,
  ScrollText,
  Briefcase,
  ArrowUpFromLine,
  Send,
  Wallet,
  Star,
} from "lucide-react";

const usePlatformSettings = () => {
  return useQuery({
    queryKey: ["platform-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("*");
      if (error) throw error;
      return data as { id: string; key: string; value: string; label: string | null }[];
    },
  });
};

const Admin = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: metrics } = useAdminMetrics();
  const { data: detailedMetrics } = useAdminDetailedMetrics();
  const { data: platformSettings } = usePlatformSettings();
  const { data: recentTransactions } = useAdminRecentTransactions();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const { data: usersData } = useAdminSearchUsers(debouncedQuery, currentPage, pageSize);
  const users = usersData?.users;
  const totalUsers = usersData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const { data: userKids } = useAdminUserKids(selectedUser?.user_id || null);
  const toggleFreeze = useAdminToggleFreeze();
  const [feeValues, setFeeValues] = useState<Record<string, string>>({});
  const [savingFees, setSavingFees] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Asaas balance state
  const { data: asaasData, isLoading: asaasLoading } = useQuery({
    queryKey: ["asaas-balance"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("asaas-balance");
      if (error) throw error;
      return data as { ok: boolean; balance?: number; error?: string };
    },
    enabled: !!isAdmin,
  });
  const asaasBalance = asaasData?.ok ? (asaasData.balance ?? null) : null;
  const asaasError = asaasData?.ok === false ? asaasData.error : null;

  // Deposit metrics
  const { data: depositMetrics } = useQuery({
    queryKey: ["admin-deposit-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_deposit_metrics" as any);
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error);
      return result;
    },
    enabled: !!isAdmin,
  });

  // Financial metrics (saques, transferências, pix, comissões)
  const { data: financialMetrics } = useQuery({
    queryKey: ["admin-financial-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_financial_metrics" as any);
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error);
      return result;
    },
    enabled: !!isAdmin,
  });

  // Limites state
  const [limitValues, setLimitValues] = useState({
    limite_diario_padrao: "50",
    limite_transferencia: "200",
    limite_pix: "500",
    limite_deposito: "1000",
    idade_minima: "6",
  });
  const [savingLimits, setSavingLimits] = useState(false);

  // Termos state
  const [termsText, setTermsText] = useState("");
  const [privacyText, setPrivacyText] = useState("");
  const [savingTerms, setSavingTerms] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  // Load limits, terms & privacy from platform_settings
  useEffect(() => {
    if (platformSettings) {
      const terms = platformSettings.find((s) => s.key === "termos_uso");
      const privacy = platformSettings.find((s) => s.key === "politica_privacidade");
      if (terms) setTermsText(terms.value);
      if (privacy) setPrivacyText(privacy.value);

      const limitKeys = ["limite_diario_padrao", "limite_transferencia", "limite_pix", "limite_deposito", "idade_minima"];
      const newLimits: Record<string, string> = {};
      limitKeys.forEach((k) => {
        const found = platformSettings.find((s) => s.key === k);
        if (found) newLimits[k] = found.value;
      });
      if (Object.keys(newLimits).length > 0) {
        setLimitValues((prev) => ({ ...prev, ...newLimits }));
      }
    }
  }, [platformSettings]);

  // Logs state (mock)
  const [logs] = useState([
    { id: "1", action: "Login admin", user: "pixkids@gmail.com", date: new Date().toISOString(), details: "Acesso ao painel administrativo" },
    { id: "2", action: "Congelamento de conta", user: "pixkids@gmail.com", date: new Date(Date.now() - 3600000).toISOString(), details: "Conta da criança #ABC123 congelada" },
    { id: "3", action: "Atualização de taxas", user: "pixkids@gmail.com", date: new Date(Date.now() - 7200000).toISOString(), details: "Taxa de depósito alterada de 2% para 1.5%" },
    { id: "4", action: "Exportação CSV", user: "pixkids@gmail.com", date: new Date(Date.now() - 86400000).toISOString(), details: "Exportação de 150 registros de usuários" },
    { id: "5", action: "Nova configuração", user: "pixkids@gmail.com", date: new Date(Date.now() - 172800000).toISOString(), details: "Limite diário padrão alterado para R$ 50,00" },
  ]);

  const exportCSV = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase.rpc("admin_search_users", {
        _query: "",
        _limit: 10000,
        _offset: 0,
      });
      if (error) throw error;
      const result = data as unknown as { success: boolean; users: AdminUser[]; error?: string };
      if (!result.success) throw new Error(result.error);

      const rows = result.users;
      const headers = ["Nome", "Email", "Telefone", "CPF", "Filhos", "Saldo Total", "Data Cadastro"];
      const csvRows = [
        headers.join(";"),
        ...rows.map((u) =>
          [
            u.nome,
            u.email,
            u.telefone || "",
            u.cpf || "",
            u.kids_count,
            Number(u.total_balance).toFixed(2).replace(".", ","),
            format(new Date(u.created_at), "dd/MM/yyyy", { locale: ptBR }),
          ].join(";")
        ),
      ];

      const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `usuarios_${format(new Date(), "yyyy-MM-dd")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exportado com sucesso!");
    } catch {
      toast.error("Erro ao exportar CSV");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    if (platformSettings) {
      const map: Record<string, string> = {};
      platformSettings.forEach((s) => { map[s.key] = s.value; });
      setFeeValues(map);
    }
  }, [platformSettings]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!adminLoading && isAdmin === false) {
      toast.error("Acesso negado");
      navigate("/dashboard");
    }
  }, [isAdmin, adminLoading, navigate]);

  if (loading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Shield className="w-12 h-12 text-primary mx-auto animate-pulse" />
          <p className="font-display text-xl mt-4 text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  const metricCards = [
    { label: "Responsáveis", value: metrics?.total_users ?? "—", icon: <Users size={20} />, color: "from-primary to-primary/70" },
    { label: "Crianças", value: metrics?.total_kids ?? "—", icon: <Baby size={20} />, color: "from-kids-yellow to-kids-yellow/70" },
    { label: "Transações", value: metrics?.total_transactions ?? "—", icon: <ArrowLeftRight size={20} />, color: "from-accent to-accent/70" },
    { label: "Saldo total", value: metrics ? `R$ ${Number(metrics.total_balance).toFixed(2)}` : "—", icon: <DollarSign size={20} />, color: "from-kids-green to-kids-green/70" },
    { label: "Volume aprovado", value: metrics ? `R$ ${Number(metrics.total_volume).toFixed(2)}` : "—", icon: <DollarSign size={20} />, color: "from-kids-purple to-kids-purple/70" },
    { label: "Pendentes", value: metrics?.pending_approvals ?? "—", icon: <Clock size={20} />, color: "from-kids-orange to-kids-orange/70" },
  ];

  const tipoLabel: Record<string, string> = { mesada: "💰 Mesada", transferencia: "👫 Transferência", pagamento: "🛒 Pagamento" };
  const statusStyle: Record<string, string> = {
    aprovado: "bg-kids-green-light text-kids-green",
    pendente: "bg-kids-yellow-light text-kids-orange",
    recusado: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-3 sm:px-4 py-3 sm:py-4 sticky top-0 z-40">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <Shield size={20} className="text-primary sm:hidden" />
            <Shield size={24} className="text-primary hidden sm:block" />
            <span className="font-display text-xl sm:text-3xl font-extrabold text-primary">Painel Admin</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="font-body text-xs sm:text-sm px-2 sm:px-3">
              <ArrowLeft size={14} />
              <span className="hidden sm:inline ml-1">Dashboard</span>
            </Button>
            <ThemeToggle />
            <button onClick={signOut} className="flex items-center gap-1 font-body text-xs sm:text-sm text-destructive hover:underline">
              <LogOut size={14} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-6xl">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1.5 rounded-xl mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-1.5 text-sm sm:text-base font-bold rounded-lg">
              <LayoutDashboard size={16} />
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Dash</span>
            </TabsTrigger>
            <TabsTrigger value="usuarios" className="flex items-center gap-1.5 text-sm sm:text-base font-bold rounded-lg">
              <Users size={16} />
              <span className="hidden sm:inline">Usuários</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>
            <TabsTrigger value="transacoes" className="flex items-center gap-1.5 text-sm sm:text-base font-bold rounded-lg">
              <ArrowLeftRight size={16} />
              <span className="hidden sm:inline">Transações</span>
              <span className="sm:hidden">Trans</span>
            </TabsTrigger>
            <TabsTrigger value="limites" className="flex items-center gap-1.5 text-sm sm:text-base font-bold rounded-lg">
              <Sliders size={16} />
              Limites
            </TabsTrigger>
            <TabsTrigger value="taxas" className="flex items-center gap-1.5 text-sm sm:text-base font-bold rounded-lg">
              <Receipt size={16} />
              Taxas
            </TabsTrigger>
            <TabsTrigger value="termos" className="flex items-center gap-1.5 text-sm sm:text-base font-bold rounded-lg">
              <FileText size={16} />
              Termos
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-1.5 text-sm sm:text-base font-bold rounded-lg">
              <ScrollText size={16} />
              Logs
            </TabsTrigger>
            <TabsTrigger value="gerente" className="flex items-center gap-1.5 text-sm sm:text-base font-bold rounded-lg">
              <Briefcase size={16} />
              <span className="hidden sm:inline">Mini Gerente</span>
              <span className="sm:hidden">Gerente</span>
            </TabsTrigger>
          </TabsList>

          {/* ==================== DASHBOARD ==================== */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Saldos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-card rounded-2xl border border-border p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <DollarSign size={22} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-display text-sm font-bold text-foreground">Saldo Total Carteira</p>
                    <p className="font-body text-xs text-muted-foreground">Soma de todos os clientes</p>
                  </div>
                </div>
                <p className="font-display text-3xl font-extrabold text-primary">
                  {detailedMetrics ? `R$ ${Number(detailedMetrics.total_balance).toFixed(2)}` : "Carregando..."}
                </p>
              </div>

              <div className="bg-card rounded-2xl border border-border p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-kids-green/10 flex items-center justify-center">
                    <DollarSign size={22} className="text-kids-green" />
                  </div>
                  <div>
                    <p className="font-display text-sm font-bold text-foreground">Saldo Asaas (API)</p>
                    <p className="font-body text-xs text-muted-foreground">Conta do gateway de pagamento</p>
                  </div>
                </div>
                {asaasLoading ? (
                  <p className="font-display text-3xl font-extrabold text-muted-foreground">Carregando...</p>
                ) : asaasBalance !== null ? (
                  <p className="font-display text-3xl font-extrabold text-kids-green">
                    R$ {asaasBalance.toFixed(2)}
                  </p>
                ) : (
                  <p className="font-body text-sm text-muted-foreground">
                    {asaasError || "Não disponível"}
                  </p>
                )}
              </div>
            </div>

            {/* Totais cadastrados */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-card rounded-2xl border border-border p-4 text-center">
                <Users size={20} className="text-primary mx-auto mb-2" />
                <p className="font-display text-2xl font-extrabold text-foreground">{detailedMetrics?.total_responsaveis ?? "—"}</p>
                <p className="font-body text-xs font-semibold text-muted-foreground">Responsáveis</p>
              </div>
              <div className="bg-card rounded-2xl border border-border p-4 text-center">
                <Baby size={20} className="text-kids-yellow mx-auto mb-2" />
                <p className="font-display text-2xl font-extrabold text-foreground">{detailedMetrics?.total_criancas ?? "—"}</p>
                <p className="font-body text-xs font-semibold text-muted-foreground">Crianças</p>
              </div>
              <div className="bg-card rounded-2xl border border-border p-4 text-center">
                <Users size={20} className="text-kids-green mx-auto mb-2" />
                <p className="font-display text-2xl font-extrabold text-foreground">
                  {detailedMetrics ? `${detailedMetrics.responsaveis_hoje + detailedMetrics.criancas_hoje}` : "—"}
                </p>
                <p className="font-body text-xs font-semibold text-muted-foreground">Cadastros Hoje</p>
              </div>
              <div className="bg-card rounded-2xl border border-border p-4 text-center">
                <Users size={20} className="text-kids-purple mx-auto mb-2" />
                <p className="font-display text-2xl font-extrabold text-foreground">
                  {detailedMetrics ? `${detailedMetrics.responsaveis_mes + detailedMetrics.criancas_mes}` : "—"}
                </p>
                <p className="font-body text-xs font-semibold text-muted-foreground">Cadastros no Mês</p>
              </div>
              <div className="bg-card rounded-2xl border border-border p-4 text-center">
                <Clock size={20} className="text-kids-orange mx-auto mb-2" />
                <p className="font-display text-2xl font-extrabold text-foreground">{detailedMetrics?.ativos_24h ?? "—"}</p>
                <p className="font-body text-xs font-semibold text-muted-foreground">Ativos 24h</p>
              </div>
              <div className="bg-card rounded-2xl border border-border p-4 text-center">
                <Clock size={20} className="text-accent mx-auto mb-2" />
                <p className="font-display text-2xl font-extrabold text-foreground">{detailedMetrics?.ativos_30d ?? "—"}</p>
                <p className="font-body text-xs font-semibold text-muted-foreground">Ativos 30 dias</p>
              </div>
            </div>

            {/* Depósitos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-kids-green/10 flex items-center justify-center">
                    <DollarSign size={18} className="text-kids-green" />
                  </div>
                  <p className="font-display text-sm font-bold text-foreground">Depósitos Hoje</p>
                </div>
                <p className="font-display text-2xl font-extrabold text-foreground">
                  R$ {depositMetrics ? Number(depositMetrics.hoje_valor).toFixed(2) : "—"}
                </p>
              </div>

              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <DollarSign size={18} className="text-primary" />
                  </div>
                  <p className="font-display text-sm font-bold text-foreground">Depósitos Mês</p>
                </div>
                <p className="font-display text-2xl font-extrabold text-foreground">
                  R$ {depositMetrics ? Number(depositMetrics.mes_valor).toFixed(2) : "—"}
                </p>
              </div>

              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-kids-purple/10 flex items-center justify-center">
                    <DollarSign size={18} className="text-kids-purple" />
                  </div>
                  <p className="font-display text-sm font-bold text-foreground">Depósitos Total</p>
                </div>
                <p className="font-display text-2xl font-extrabold text-foreground">
                  R$ {depositMetrics ? Number(depositMetrics.total_valor).toFixed(2) : "—"}
                </p>
              </div>
            </div>

            {/* Saques */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
                    <ArrowUpFromLine size={18} className="text-destructive" />
                  </div>
                  <p className="font-display text-sm font-bold text-foreground">Saques Hoje</p>
                </div>
                <p className="font-display text-2xl font-extrabold text-foreground">
                  R$ {financialMetrics ? Number(financialMetrics.saques_hoje).toFixed(2) : "—"}
                </p>
              </div>
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
                    <ArrowUpFromLine size={18} className="text-destructive" />
                  </div>
                  <p className="font-display text-sm font-bold text-foreground">Saques Mês</p>
                </div>
                <p className="font-display text-2xl font-extrabold text-foreground">
                  R$ {financialMetrics ? Number(financialMetrics.saques_mes).toFixed(2) : "—"}
                </p>
              </div>
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
                    <ArrowUpFromLine size={18} className="text-destructive" />
                  </div>
                  <p className="font-display text-sm font-bold text-foreground">Saques Total</p>
                </div>
                <p className="font-display text-2xl font-extrabold text-foreground">
                  R$ {financialMetrics ? Number(financialMetrics.saques_total).toFixed(2) : "—"}
                </p>
              </div>
            </div>

            {/* Transferências Internas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Send size={18} className="text-accent" />
                  </div>
                  <p className="font-display text-sm font-bold text-foreground">Transferências Hoje</p>
                </div>
                <p className="font-display text-2xl font-extrabold text-foreground">
                  R$ {financialMetrics ? Number(financialMetrics.transf_hoje).toFixed(2) : "—"}
                </p>
              </div>
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Send size={18} className="text-accent" />
                  </div>
                  <p className="font-display text-sm font-bold text-foreground">Transferências Mês</p>
                </div>
                <p className="font-display text-2xl font-extrabold text-foreground">
                  R$ {financialMetrics ? Number(financialMetrics.transf_mes).toFixed(2) : "—"}
                </p>
              </div>
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Send size={18} className="text-accent" />
                  </div>
                  <p className="font-display text-sm font-bold text-foreground">Transferências Total</p>
                </div>
                <p className="font-display text-2xl font-extrabold text-foreground">
                  R$ {financialMetrics ? Number(financialMetrics.transf_total).toFixed(2) : "—"}
                </p>
              </div>
            </div>

            {/* Pagamentos Pix */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-kids-orange/10 flex items-center justify-center">
                    <Wallet size={18} className="text-kids-orange" />
                  </div>
                  <p className="font-display text-sm font-bold text-foreground">Pix Hoje</p>
                </div>
                <p className="font-display text-2xl font-extrabold text-foreground">
                  R$ {financialMetrics ? Number(financialMetrics.pix_hoje).toFixed(2) : "—"}
                </p>
              </div>
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-kids-orange/10 flex items-center justify-center">
                    <Wallet size={18} className="text-kids-orange" />
                  </div>
                  <p className="font-display text-sm font-bold text-foreground">Pix Mês</p>
                </div>
                <p className="font-display text-2xl font-extrabold text-foreground">
                  R$ {financialMetrics ? Number(financialMetrics.pix_mes).toFixed(2) : "—"}
                </p>
              </div>
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-kids-orange/10 flex items-center justify-center">
                    <Wallet size={18} className="text-kids-orange" />
                  </div>
                  <p className="font-display text-sm font-bold text-foreground">Pix Total</p>
                </div>
                <p className="font-display text-2xl font-extrabold text-foreground">
                  R$ {financialMetrics ? Number(financialMetrics.pix_total).toFixed(2) : "—"}
                </p>
              </div>
            </div>

            {/* Comissões Mini Gerente */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-kids-yellow/10 flex items-center justify-center">
                    <Star size={18} className="text-kids-yellow" />
                  </div>
                  <p className="font-display text-sm font-bold text-foreground">Comissões Hoje</p>
                </div>
                <p className="font-display text-2xl font-extrabold text-foreground">
                  R$ {financialMetrics ? Number(financialMetrics.comissao_hoje).toFixed(2) : "—"}
                </p>
              </div>
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-kids-yellow/10 flex items-center justify-center">
                    <Star size={18} className="text-kids-yellow" />
                  </div>
                  <p className="font-display text-sm font-bold text-foreground">Comissões Mês</p>
                </div>
                <p className="font-display text-2xl font-extrabold text-foreground">
                  R$ {financialMetrics ? Number(financialMetrics.comissao_mes).toFixed(2) : "—"}
                </p>
              </div>
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-kids-yellow/10 flex items-center justify-center">
                    <Star size={18} className="text-kids-yellow" />
                  </div>
                  <p className="font-display text-sm font-bold text-foreground">Comissões Total</p>
                </div>
                <p className="font-display text-2xl font-extrabold text-foreground">
                  R$ {financialMetrics ? Number(financialMetrics.comissao_total).toFixed(2) : "—"}
                </p>
              </div>
            </div>
          </TabsContent>

          {/* ==================== USUÁRIOS ==================== */}
          <TabsContent value="usuarios">
            <div className="bg-card rounded-xl sm:rounded-3xl border border-border overflow-hidden mb-4 sm:mb-6">
              <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                <h3 className="font-display text-xl font-extrabold flex items-center gap-2">
                  <Users size={20} className="text-primary" />
                  Todos os usuários cadastrados
                </h3>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64 sm:flex-none">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar por nome, email, CPF ou código..."
                      className="pl-9 rounded-xl"
                    />
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl shrink-0" disabled={exporting} onClick={exportCSV}>
                    <Download size={14} />
                    <span className="hidden sm:inline ml-1">{exporting ? "Exportando..." : "CSV"}</span>
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                       <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-display font-bold text-foreground text-xs sm:text-sm">Nome</th>
                       <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-display font-bold text-foreground text-xs sm:text-sm hidden sm:table-cell">Email</th>
                       <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-display font-bold text-foreground text-xs sm:text-sm hidden md:table-cell">Telefone</th>
                       <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-display font-bold text-foreground text-xs sm:text-sm hidden lg:table-cell">CPF</th>
                       <th className="px-3 sm:px-6 py-2 sm:py-3 text-center font-display font-bold text-foreground text-xs sm:text-sm">Filhos</th>
                       <th className="px-3 sm:px-6 py-2 sm:py-3 text-right font-display font-bold text-foreground text-xs sm:text-sm">Saldo</th>
                       <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-display font-bold text-foreground text-xs sm:text-sm hidden sm:table-cell">Cadastro</th>
                       <th className="px-3 sm:px-6 py-2 sm:py-3 text-center font-display font-bold text-foreground text-xs sm:text-sm">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users?.map((u) => (
                      <tr key={u.id} className={`hover:bg-muted/50 transition-colors ${selectedUser?.id === u.id ? "bg-primary/5" : ""}`}>
                        <td className="px-3 sm:px-6 py-2 sm:py-3 font-body font-semibold text-xs sm:text-sm">
                          <div>{u.nome}</div>
                          <div className="text-[10px] sm:hidden text-muted-foreground font-normal truncate max-w-[120px]">{u.email}</div>
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-3 font-body text-muted-foreground text-sm hidden sm:table-cell">{u.email}</td>
                        <td className="px-3 sm:px-6 py-2 sm:py-3 font-body text-muted-foreground hidden md:table-cell">{u.telefone || "—"}</td>
                        <td className="px-3 sm:px-6 py-2 sm:py-3 font-body text-muted-foreground hidden lg:table-cell">{u.cpf || "—"}</td>
                        <td className="px-3 sm:px-6 py-2 sm:py-3 text-center font-body">
                          <span className="bg-muted rounded-full px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs">👧 {u.kids_count}</span>
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-3 text-right font-body font-semibold text-xs sm:text-sm">R$ {Number(u.total_balance).toFixed(2)}</td>
                        <td className="px-3 sm:px-6 py-2 sm:py-3 font-body text-muted-foreground text-xs hidden sm:table-cell">
                          {format(new Date(u.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-3 text-center">
                          <Button
                            size="sm"
                            variant={selectedUser?.id === u.id ? "default" : "outline"}
                            className="rounded-xl text-xs h-7 sm:h-8 px-2 sm:px-3"
                            onClick={() => setSelectedUser(u)}
                          >
                            <Eye size={14} />
                            <span className="hidden sm:inline ml-1">Ver</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users && users.length === 0 && (
                  <p className="px-6 py-8 text-center font-body text-sm text-muted-foreground">Nenhum usuário encontrado</p>
                )}
              </div>
              {totalPages > 1 && (
                <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-border flex items-center justify-between">
                  <p className="font-body text-xs sm:text-sm text-muted-foreground">
                    {totalUsers} usuário{totalUsers !== 1 ? "s" : ""} • Página {currentPage} de {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="rounded-xl" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>
                      <ChevronLeft size={14} />
                      <span className="hidden sm:inline ml-1">Anterior</span>
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-xl" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                      <span className="hidden sm:inline mr-1">Próxima</span>
                      <ChevronRight size={14} />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* User Detail */}
            {selectedUser ? (
              <div className="bg-card rounded-xl sm:rounded-3xl border border-border overflow-hidden">
                <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-border">
                  <h3 className="font-display text-xl font-bold">{selectedUser.nome}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    <div className="flex items-center gap-2 font-body text-sm">
                      <span className="text-muted-foreground">📧 Email:</span>
                      <span className="font-semibold text-foreground">{selectedUser.email}</span>
                    </div>
                    <div className="flex items-center gap-2 font-body text-sm">
                      <span className="text-muted-foreground">📱 Telefone:</span>
                      <span className="font-semibold text-foreground">{selectedUser.telefone || "Não informado"}</span>
                    </div>
                    <div className="flex items-center gap-2 font-body text-sm">
                      <span className="text-muted-foreground">🪪 CPF:</span>
                      <span className="font-semibold text-foreground">{selectedUser.cpf || "Não informado"}</span>
                    </div>
                    <div className="flex items-center gap-2 font-body text-sm">
                      <span className="text-muted-foreground">🔢 Código:</span>
                      <span className="font-semibold text-foreground">{(selectedUser as any).codigo_usuario || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 font-body text-sm">
                      <span className="text-muted-foreground">👧 Filhos:</span>
                      <span className="font-semibold text-foreground">{selectedUser.kids_count}</span>
                    </div>
                    <div className="flex items-center gap-2 font-body text-sm">
                      <span className="text-muted-foreground">💰 Saldo Total:</span>
                      <span className="font-semibold text-foreground">R$ {Number(selectedUser.total_balance).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2 font-body text-sm">
                      <span className="text-muted-foreground">📅 Cadastro:</span>
                      <span className="font-semibold text-foreground">{format(new Date(selectedUser.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                    </div>
                  </div>
                </div>
                {/* Ações do usuário */}
                <div className="px-4 sm:px-6 py-4 border-b border-border">
                  <h4 className="font-display font-bold text-sm mb-3">Ações</h4>
                  <AdminUserActions user={selectedUser} onUserDeleted={() => setSelectedUser(null)} globalLimits={limitValues} />
                </div>

                <div className="px-4 sm:px-6 py-4">
                  <h4 className="font-display font-bold text-sm mb-3">Filhos cadastrados</h4>
                  {userKids && userKids.length > 0 ? (
                    <div className="space-y-3">
                      {userKids.map((kid) => (
                        <div key={kid.id} className="bg-muted/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                          <div>
                            <p className="font-body font-semibold text-sm">
                              {kid.apelido || kid.nome}
                              {kid.is_frozen && " ❄️"}
                            </p>
                            <p className="font-body text-xs text-muted-foreground">
                              {kid.idade} anos • Código: {kid.codigo_publico} • R$ {Number(kid.saldo).toFixed(2)}
                            </p>
                            <div className="flex gap-1 mt-1">
                              {kid.aprovacao_transferencias && (
                                <span className="text-[10px] bg-kids-yellow-light rounded-full px-2 py-0.5">Aprovação</span>
                              )}
                              {kid.bloqueio_envio && (
                                <span className="text-[10px] bg-destructive/10 text-destructive rounded-full px-2 py-0.5">Envio bloqueado</span>
                              )}
                              {kid.limite_diario && (
                                <span className="text-[10px] bg-muted rounded-full px-2 py-0.5">
                                  Limite: R$ {Number(kid.limite_diario).toFixed(0)}/dia
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant={kid.is_frozen ? "default" : "outline"}
                            className="rounded-xl self-end sm:self-auto"
                            onClick={() => {
                              toggleFreeze.mutate(
                                { kidId: kid.id, freeze: !kid.is_frozen },
                                { onSuccess: () => toast.success(kid.is_frozen ? "Conta descongelada ☀️" : "Conta congelada ❄️") }
                              );
                            }}
                            disabled={toggleFreeze.isPending}
                          >
                            {kid.is_frozen ? <Sun size={14} /> : <Snowflake size={14} />}
                            <span className="ml-1 text-xs">{kid.is_frozen ? "Descongelar" : "Congelar"}</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="font-body text-sm text-muted-foreground">Nenhum filho cadastrado</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-xl sm:rounded-3xl border border-border p-8 sm:p-12 text-center">
                <Eye size={48} className="text-muted-foreground mx-auto mb-4 opacity-30" />
                <p className="font-display text-base sm:text-lg font-bold text-muted-foreground">Selecione um usuário</p>
                <p className="font-body text-xs sm:text-sm text-muted-foreground mt-1">Clique em um usuário na lista para ver os detalhes</p>
              </div>
            )}
          </TabsContent>

          {/* ==================== TRANSAÇÕES ==================== */}
          <TabsContent value="transacoes" className="space-y-6">
            <TransacoesTab tipoLabel={tipoLabel} statusStyle={statusStyle} recentTransactions={recentTransactions} />
          </TabsContent>

          {/* ==================== LIMITES ==================== */}
          <TabsContent value="limites">
            {/* Global Limits */}
            <div className="bg-card rounded-xl sm:rounded-3xl border border-border p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-6">
                <Sliders size={20} className="text-primary" />
                <h3 className="font-display text-lg font-bold">Limites Globais da Plataforma</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-body text-sm text-muted-foreground">Limite diário padrão (R$)</label>
                  <Input
                    type="number" step="1" min="0"
                    value={limitValues.limite_diario_padrao}
                    onChange={(e) => setLimitValues((prev) => ({ ...prev, limite_diario_padrao: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-body text-sm text-muted-foreground">Limite por transferência (R$)</label>
                  <Input
                    type="number" step="1" min="0"
                    value={limitValues.limite_transferencia}
                    onChange={(e) => setLimitValues((prev) => ({ ...prev, limite_transferencia: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-body text-sm text-muted-foreground">Limite por Pix (R$)</label>
                  <Input
                    type="number" step="1" min="0"
                    value={limitValues.limite_pix}
                    onChange={(e) => setLimitValues((prev) => ({ ...prev, limite_pix: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-body text-sm text-muted-foreground">Limite de depósito diário (R$)</label>
                  <Input
                    type="number" step="1" min="0"
                    value={limitValues.limite_deposito}
                    onChange={(e) => setLimitValues((prev) => ({ ...prev, limite_deposito: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-body text-sm text-muted-foreground">Idade mínima para cadastro</label>
                  <Input
                    type="number" step="1" min="0"
                    value={limitValues.idade_minima}
                    onChange={(e) => setLimitValues((prev) => ({ ...prev, idade_minima: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
              </div>
              <Button
                className="mt-6 rounded-xl"
                disabled={savingLimits}
                onClick={async () => {
                  setSavingLimits(true);
                  try {
                    const entries = Object.entries(limitValues);
                    for (const [key, value] of entries) {
                      const { error } = await supabase
                        .from("platform_settings")
                        .upsert({ key, value }, { onConflict: "key" });
                      if (error) throw error;
                    }
                    queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
                    toast.success("Limites salvos com sucesso!");
                  } catch (e: any) {
                    toast.error(e?.message || "Erro ao salvar limites");
                  } finally {
                    setSavingLimits(false);
                  }
                }}
              >
                <Save size={14} className="mr-2" />
                {savingLimits ? "Salvando..." : "Salvar Limites Globais"}
              </Button>
            </div>

            {/* Individual User Limits */}
            <LimitesUsuarioSection globalLimits={limitValues} />
          </TabsContent>

          {/* ==================== TAXAS ==================== */}
          <TabsContent value="taxas">
            <div className="bg-card rounded-xl sm:rounded-3xl border border-border p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-6">
                <Settings size={20} className="text-primary" />
                <h3 className="font-display text-lg font-bold">Taxas de Depósito</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {platformSettings
                  ?.filter((setting) => !["mini_gerente_ativado", "mini_gerente_enabled", "politica_privacidade", "termos_uso", "limite_diario_padrao", "limite_transferencia", "limite_pix", "limite_deposito", "idade_minima"].includes(setting.key))
                  .map((setting) => (
                  <div key={setting.key} className="space-y-1">
                    <label className="font-body text-sm text-muted-foreground">{setting.label || setting.key}</label>
                    <Input
                      type="number" step="0.01" min="0"
                      value={feeValues[setting.key] ?? setting.value}
                      onChange={(e) => setFeeValues((prev) => ({ ...prev, [setting.key]: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>
                ))}
              </div>
              <Button
                className="mt-6 rounded-xl"
                disabled={savingFees}
                onClick={async () => {
                  setSavingFees(true);
                  try {
                    for (const setting of platformSettings || []) {
                      const newVal = feeValues[setting.key];
                      if (newVal !== undefined && newVal !== setting.value) {
                        const { error } = await supabase
                          .from("platform_settings")
                          .update({ value: newVal, updated_at: new Date().toISOString() })
                          .eq("key", setting.key);
                        if (error) throw error;
                      }
                    }
                    queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
                    toast.success("Taxas atualizadas com sucesso!");
                  } catch {
                    toast.error("Erro ao salvar taxas");
                  } finally {
                    setSavingFees(false);
                  }
                }}
              >
                <Save size={14} className="mr-2" />
                {savingFees ? "Salvando..." : "Salvar Taxas"}
              </Button>
            </div>
            <TaxasUsuarioSection globalFees={feeValues} platformSettings={platformSettings} />
          </TabsContent>

          {/* ==================== TERMOS ==================== */}
          <TabsContent value="termos">
            <div className="space-y-6">
              {/* Termos de Uso */}
              <div className="bg-card rounded-xl sm:rounded-3xl border border-border p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-6">
                  <FileText size={20} className="text-primary" />
                  <h3 className="font-display text-lg font-bold">Termos de Uso</h3>
                </div>
                <Textarea
                  rows={12}
                  value={termsText}
                  onChange={(e) => setTermsText(e.target.value)}
                  placeholder="Escreva os termos de uso da plataforma..."
                  className="rounded-xl font-body text-sm"
                />
                <Button
                  className="mt-6 rounded-xl"
                  disabled={savingTerms}
                  onClick={async () => {
                    setSavingTerms(true);
                    const { error } = await supabase
                      .from("platform_settings")
                      .update({ value: termsText, updated_at: new Date().toISOString() })
                      .eq("key", "termos_uso");
                    setSavingTerms(false);
                    if (error) {
                      toast.error("Erro ao salvar termos");
                    } else {
                      toast.success("Termos salvos com sucesso!");
                      queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
                    }
                  }}
                >
                  <Save size={14} className="mr-2" />
                  {savingTerms ? "Salvando..." : "Salvar Termos"}
                </Button>
              </div>

              {/* Política de Privacidade */}
              <div className="bg-card rounded-xl sm:rounded-3xl border border-border p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Shield size={20} className="text-primary" />
                  <h3 className="font-display text-lg font-bold">Política de Privacidade</h3>
                </div>
                <Textarea
                  rows={12}
                  value={privacyText}
                  onChange={(e) => setPrivacyText(e.target.value)}
                  placeholder="Escreva a política de privacidade da plataforma..."
                  className="rounded-xl font-body text-sm"
                />
                <Button
                  className="mt-6 rounded-xl"
                  disabled={savingPrivacy}
                  onClick={async () => {
                    setSavingPrivacy(true);
                    const { error } = await supabase
                      .from("platform_settings")
                      .update({ value: privacyText, updated_at: new Date().toISOString() })
                      .eq("key", "politica_privacidade");
                    setSavingPrivacy(false);
                    if (error) {
                      toast.error("Erro ao salvar política de privacidade");
                    } else {
                      toast.success("Política de privacidade salva com sucesso!");
                      queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
                    }
                  }}
                >
                  <Save size={14} className="mr-2" />
                  {savingPrivacy ? "Salvando..." : "Salvar Política"}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ==================== LOGS ==================== */}
          <TabsContent value="logs">
            <div className="bg-card rounded-xl sm:rounded-3xl border border-border overflow-hidden">
              <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-border">
                <h3 className="font-display text-xl font-extrabold flex items-center gap-2">
                  <ScrollText size={20} className="text-primary" />
                  Logs de Atividade
                </h3>
              </div>
              <div className="divide-y divide-border">
                {logs.map((log) => (
                  <div key={log.id} className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <p className="font-body font-semibold text-sm">{log.action}</p>
                      <p className="font-body text-xs text-muted-foreground">{log.details}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-body shrink-0">
                      <span>{log.user}</span>
                      <span>{format(new Date(log.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ==================== MINI GERENTE ==================== */}
          <TabsContent value="gerente">
            <AdminMiniGerente />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;

