import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CalendarIcon,
  FileDown,
  Landmark,
  Printer,
  Repeat,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useFamilyOwner } from "@/hooks/useFamilyOwner";
import { useKids, useParentProfile, useTransactions } from "@/hooks/useDashboard";
import { supabase } from "@/integrations/supabase/client";
import { printReceipt } from "@/lib/printReceipt";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type UnifiedEntry = {
  id: string;
  tipo: string;
  valor: number;
  descricao: string | null;
  status: string;
  created_at: string;
  from_user?: string | null;
  to_user?: string | null;
  from_kid?: string | null;
  to_kid?: string | null;
  referrer_kid_id?: string | null;
};

const typeConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  mesada: { icon: <ArrowDownLeft size={16} />, label: "Mesada", color: "text-kids-green bg-kids-green-light" },
  transferencia: { icon: <Repeat size={16} />, label: "Transferência", color: "text-primary bg-kids-blue-light" },
  pagamento: { icon: <ArrowUpRight size={16} />, label: "Pagamento", color: "text-kids-orange bg-kids-yellow-light" },
  comissao: { icon: <Star size={16} />, label: "Comissão Mini Gerente", color: "text-kids-orange bg-kids-yellow-light" },
  deposito: { icon: <Banknote size={16} />, label: "Depósito", color: "text-kids-green bg-kids-green-light" },
  saque: { icon: <Landmark size={16} />, label: "Saque", color: "text-destructive bg-destructive/10" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  aprovado: { label: "Aprovado", color: "bg-kids-green-light text-kids-green" },
  confirmado: { label: "Confirmado", color: "bg-kids-green-light text-kids-green" },
  pendente: { label: "Pendente", color: "bg-kids-yellow-light text-kids-orange" },
  recusado: { label: "Recusado", color: "bg-destructive/10 text-destructive" },
  solicitado: { label: "Solicitado", color: "bg-kids-yellow-light text-kids-orange" },
};

const TransactionHistory = () => {
  const { user } = useAuth();
  const { data: transactions, isLoading: txLoading } = useTransactions();
  const { data: kids } = useKids();
  const { data: profile } = useParentProfile();
  const { data: familyOwner, isLoading: familyOwnerLoading } = useFamilyOwner();
  const [filter, setFilter] = useState<string>("parent");
  const [period, setPeriod] = useState<string>("tudo");
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const historyOwnerUserId = familyOwner?.ownerId ?? user?.id;

  const { data: ownerProfile } = useQuery({
    queryKey: ["owner-profile", user?.id, familyOwner?.ownerId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_guardians_for_user");
      if (error) throw error;

      const principal = ((data as Array<{ tipo: string; nome: string | null; codigo_usuario?: string | null }>) || [])
        .find((guardian) => guardian.tipo === "principal");

      return {
        nome: principal?.nome || "Responsável",
        codigo_usuario: principal?.codigo_usuario || null,
      };
    },
    enabled: !!user && !!familyOwner?.isSecondary,
  });

  const kidIds = kids?.map((kid) => kid.id) || [];
  const { data: commissions, isLoading: commLoading } = useQuery({
    queryKey: ["referral-commissions-parent", user?.id],
    queryFn: async () => {
      if (!kidIds.length) return [];
      const { data, error } = await supabase
        .from("referral_commissions")
        .select("id, referrer_kid_id, valor_comissao, valor_deposito, taxa_percentual, status, created_at")
        .in("referrer_kid_id", kidIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && kidIds.length > 0,
  });

  const { data: deposits, isLoading: depLoading } = useQuery({
    queryKey: ["deposits-history", historyOwnerUserId],
    queryFn: async () => {
      if (!historyOwnerUserId) return [];
      const { data, error } = await supabase
        .from("deposits")
        .select("id, valor, status, created_at, kid_id")
        .eq("user_id", historyOwnerUserId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!historyOwnerUserId && !familyOwnerLoading,
  });

  const { data: withdrawals, isLoading: wdLoading } = useQuery({
    queryKey: ["withdrawals-history", historyOwnerUserId],
    queryFn: async () => {
      if (!historyOwnerUserId) return [];
      const { data, error } = await supabase
        .from("withdrawals")
        .select("id, valor, status, created_at")
        .eq("user_id", historyOwnerUserId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!historyOwnerUserId && !familyOwnerLoading,
  });

  const isLoading = txLoading || commLoading || depLoading || wdLoading || familyOwnerLoading;

  const allEntries = useMemo(() => {
    const entries: UnifiedEntry[] = [];

    transactions?.forEach((tx) => {
      entries.push({
        id: tx.id,
        tipo: tx.tipo,
        valor: tx.valor,
        descricao: tx.descricao,
        status: tx.status,
        created_at: tx.created_at,
        from_user: tx.from_user,
        to_user: tx.to_user,
        from_kid: tx.from_kid,
        to_kid: tx.to_kid,
      });
    });

    commissions?.forEach((commission) => {
      entries.push({
        id: `comm-${commission.id}`,
        tipo: "comissao",
        valor: commission.valor_comissao,
        descricao: `Comissão ${commission.taxa_percentual}% sobre R$ ${Number(commission.valor_deposito).toFixed(2)}`,
        status: commission.status,
        created_at: commission.created_at,
        referrer_kid_id: commission.referrer_kid_id,
      });
    });

    deposits?.forEach((deposit) => {
      entries.push({
        id: `dep-${deposit.id}`,
        tipo: "deposito",
        valor: deposit.valor,
        descricao: "Depósito via Pix",
        status: deposit.status,
        created_at: deposit.created_at,
        from_user: historyOwnerUserId,
      });
    });

    withdrawals?.forEach((withdrawal) => {
      entries.push({
        id: `wd-${withdrawal.id}`,
        tipo: "saque",
        valor: withdrawal.valor,
        descricao: "Saque via Pix",
        status: withdrawal.status,
        created_at: withdrawal.created_at,
        from_user: historyOwnerUserId,
      });
    });

    entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return entries;
  }, [transactions, commissions, deposits, withdrawals, historyOwnerUserId]);

  const getKidLabel = (kidId: string | null) => {
    if (!kidId || !kids) return null;
    const kid = kids.find((entry) => entry.id === kidId);
    if (!kid) return null;
    return `${kid.codigo_publico} - ${kid.apelido || kid.nome}`;
  };

  const parentCode = profile?.codigo_usuario || "";
  const parentLabel = parentCode
    ? `${parentCode} - ${profile?.nome?.split(" ")[0] || "Você"}`
    : profile?.nome?.split(" ")[0] || "Você";

  const primaryOwnerLabel = useMemo(() => {
    if (!familyOwner?.isSecondary || !ownerProfile) return parentLabel;
    const code = ownerProfile.codigo_usuario || "";
    const name = ownerProfile.nome?.split(" ")[0] || "Responsável";
    return code ? `${code} - ${name}` : name;
  }, [familyOwner?.isSecondary, ownerProfile, parentLabel]);

  const getUserLabel = (userId: string | null | undefined) => {
    if (!userId) return parentLabel;
    if (userId === user?.id) return parentLabel;
    if (familyOwner?.isSecondary && userId === familyOwner.ownerId) return primaryOwnerLabel;
    if (!familyOwner?.isSecondary && userId === user?.id) return parentLabel;
    return primaryOwnerLabel;
  };

  const getDescription = (tx: UnifiedEntry) => {
    if (tx.tipo === "comissao") {
      const kidLabel = getKidLabel(tx.referrer_kid_id || null);
      return kidLabel ? `Mini Gerente: ${kidLabel}` : "Comissão Mini Gerente";
    }
    if (tx.tipo === "deposito" || tx.tipo === "saque") {
      return getUserLabel(tx.from_user);
    }

    const fromKidLabel = getKidLabel(tx.from_kid || null);
    const toKidLabel = getKidLabel(tx.to_kid || null);

    if (tx.tipo === "mesada" || (tx.from_user && tx.to_kid)) {
      return `${getUserLabel(tx.from_user)} -> ${toKidLabel || "filho"}`;
    }
    if (tx.from_kid && tx.to_kid) {
      return `${fromKidLabel || "Criança"} -> ${toKidLabel || "Criança"}`;
    }
    if (tx.from_kid && !tx.to_kid) {
      return `${fromKidLabel || "Criança"} -> ${getUserLabel(tx.to_user)}`;
    }
    if (fromKidLabel) return `De: ${fromKidLabel}`;
    if (toKidLabel) return `Para: ${toKidLabel}`;
    return "";
  };

  const dateCutoff = useMemo(() => {
    const now = new Date();
    if (period === "hoje") return startOfDay(now);
    if (period === "7dias") return startOfDay(subDays(now, 7));
    if (period === "30dias") return startOfDay(subDays(now, 30));
    if (period === "custom" && customDate) return startOfDay(customDate);
    return null;
  }, [period, customDate]);

  const filteredEntries = allEntries.filter((tx) => {
    let passesPersonFilter = false;

    if (filter === "parent") {
      if (tx.tipo === "deposito" || tx.tipo === "saque") {
        passesPersonFilter = true;
      } else if (tx.tipo === "comissao") {
        passesPersonFilter = false;
      } else {
        passesPersonFilter = (tx.from_user === user?.id && !tx.from_kid) || (tx.to_user === user?.id && !tx.to_kid);
      }
    } else {
      passesPersonFilter = tx.tipo === "comissao"
        ? tx.referrer_kid_id === filter
        : tx.from_kid === filter || tx.to_kid === filter;
    }

    if (!passesPersonFilter) return false;
    if (dateCutoff) return new Date(tx.created_at) >= dateCutoff;
    return true;
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-3xl border border-border p-8 text-center">
        <p className="font-body text-muted-foreground">Carregando transações...</p>
      </div>
    );
  }

  const parentName = profile?.nome?.split(" ")[0] || "Responsável";

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);

      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const doc = new jsPDF();
      const filterLabel = filter === "parent"
        ? parentName
        : (kids?.find((kid) => kid.id === filter)?.apelido || kids?.find((kid) => kid.id === filter)?.nome || "").split(" ")[0];
      const periodLabel = period === "hoje"
        ? "Hoje"
        : period === "7dias"
          ? "Últimos 7 dias"
          : period === "30dias"
            ? "Últimos 30 dias"
            : period === "custom" && customDate
              ? format(customDate, "dd/MM/yyyy")
              : "Todas as datas";

      doc.setFillColor(59, 130, 246);
      doc.roundedRect(14, 10, 182, 18, 4, 4, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text("Pix Kids", 105, 22, { align: "center" });
      doc.setFontSize(9);
      doc.text("Sua mesada digital", 105, 26, { align: "center" });

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.text("Histórico de Movimentações", 14, 40);
      doc.setFontSize(9);
      doc.text(`Filtro: ${filterLabel}  |  Período: ${periodLabel}`, 14, 47);
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 52);

      const tableData = filteredEntries.map((tx) => {
        const type = typeConfig[tx.tipo]?.label || tx.tipo;
        const statusLabel = statusConfig[tx.status]?.label || tx.status;
        return [
          format(new Date(tx.created_at), "dd/MM/yyyy HH:mm"),
          type,
          tx.descricao || type,
          `R$ ${Number(tx.valor).toFixed(2)}`,
          statusLabel,
        ];
      });

      autoTable(doc, {
        startY: 58,
        head: [["Data", "Tipo", "Descrição", "Valor", "Status"]],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      });

      const pageCount = doc.getNumberOfPages();
      for (let index = 1; index <= pageCount; index++) {
        doc.setPage(index);
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text("Pix Kids - Ps Intermediadora de Pagamento LTDA", 105, 290, { align: "center" });
      }

      doc.save(`historico-${filterLabel.toLowerCase()}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    } catch {
      toast.error("Erro ao gerar PDF");
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="bg-card rounded-3xl border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <h3 className="font-display text-lg font-bold">Histórico de movimentações</h3>
        {filteredEntries.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full text-xs font-body font-semibold gap-1.5"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
          >
            <FileDown className="w-3.5 h-3.5" />
            {isExportingPdf ? "Gerando..." : "PDF"}
          </Button>
        )}
      </div>

      <div className="px-6 py-3 border-b border-border flex gap-2 overflow-x-auto">
        <button
          onClick={() => setFilter("parent")}
          className={`px-4 py-2 rounded-full text-sm font-display font-bold whitespace-nowrap transition-colors ${
            filter === "parent"
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-muted text-foreground hover:bg-accent"
          }`}
        >
          {parentName}
        </button>
        {kids?.map((kid) => (
          <button
            key={kid.id}
            onClick={() => setFilter(kid.id)}
            className={`px-4 py-2 rounded-full text-sm font-display font-bold whitespace-nowrap transition-colors ${
              filter === kid.id
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted text-foreground hover:bg-accent"
            }`}
          >
            {(kid.apelido || kid.nome).split(" ")[0]}
          </button>
        ))}
      </div>

      <div className="px-6 py-3 border-b border-border flex gap-2 overflow-x-auto items-center">
        {[
          { key: "hoje", label: "Hoje" },
          { key: "7dias", label: "7 dias" },
          { key: "30dias", label: "30 dias" },
          { key: "tudo", label: "Tudo" },
        ].map((entry) => (
          <button
            key={entry.key}
            onClick={() => {
              setPeriod(entry.key);
              setCustomDate(undefined);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-body font-semibold whitespace-nowrap transition-colors ${
              period === entry.key && period !== "custom"
                ? "bg-accent text-accent-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted"
            }`}
          >
            {entry.label}
          </button>
        ))}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 px-3 rounded-full text-xs font-body font-semibold",
                period === "custom" && "bg-accent text-accent-foreground shadow-sm",
              )}
            >
              <CalendarIcon className="w-3.5 h-3.5 mr-1" />
              {period === "custom" && customDate ? format(customDate, "dd/MM/yyyy") : "Data"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={customDate}
              onSelect={(date) => {
                setCustomDate(date);
                if (date) setPeriod("custom");
              }}
              disabled={(date) => date > new Date()}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

      {filteredEntries.length === 0 ? (
        <div className="p-8 text-center">
          <span className="text-4xl mb-3 inline-block">📋</span>
          <p className="font-display text-lg font-bold">Nenhuma movimentação</p>
          <p className="font-body text-sm text-muted-foreground">
            Sem movimentações para este filtro.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {filteredEntries.map((tx) => {
            const type = typeConfig[tx.tipo] || typeConfig.mesada;
            const status = statusConfig[tx.status] || statusConfig.aprovado;
            const desc = getDescription(tx);

            return (
              <div key={tx.id} className="px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${type.color}`}>
                    {type.icon}
                  </div>
                  <div>
                    <p className="font-body font-semibold text-sm">{tx.descricao || type.label}</p>
                    <p className="font-body text-xs text-muted-foreground">
                      {desc && <span className="font-medium">{desc}</span>}
                      {desc && " • "}
                      {format(new Date(tx.created_at), "dd MMM, HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <p className="font-display font-bold text-sm">R$ {Number(tx.valor).toFixed(2)}</p>
                  <span className={`inline-block text-xs font-body font-semibold px-2 py-0.5 rounded-full ${status.color}`}>
                    {status.label}
                  </span>
                  <button
                    onClick={() =>
                      printReceipt({
                        tipo: tx.tipo,
                        valor: Number(tx.valor),
                        data: tx.created_at,
                        status: tx.status,
                        descricao: tx.descricao,
                      })
                    }
                    className="text-muted-foreground hover:text-primary transition-colors p-1"
                    title="Imprimir comprovante"
                  >
                    <Printer size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
