import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Search,
  ArrowLeftRight,
  X,
  ArrowDownToLine,
  ArrowUpFromLine,
  Send,
  CreditCard,
  Star,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";
import type { AdminTransaction } from "@/hooks/useAdmin";

interface Props {
  tipoLabel: Record<string, string>;
  statusStyle: Record<string, string>;
  recentTransactions: AdminTransaction[] | undefined;
}

const statusBadge = (status: string, statusStyle: Record<string, string>) => (
  <span
    className={`text-[10px] sm:text-xs font-body font-semibold px-2 py-0.5 rounded-full ${
      statusStyle[status] || "bg-muted text-muted-foreground"
    }`}
  >
    {status}
  </span>
);

const formatDate = (d: string) => format(new Date(d), "dd/MM/yyyy HH:mm", { locale: ptBR });

const recentTypeMeta: Record<string, { label: string; icon: React.ReactNode }> = {
  deposito: { label: "Depósito", icon: <ArrowDownToLine size={14} className="text-primary" /> },
  saque: { label: "Saque", icon: <ArrowUpFromLine size={14} className="text-destructive" /> },
  transferencia: { label: "Transferência", icon: <Send size={14} className="text-accent" /> },
  mesada: { label: "Mesada", icon: <Star size={14} className="text-kids-yellow" /> },
  pagamento: { label: "Pix", icon: <CreditCard size={14} className="text-primary" /> },
};

const normalizeTxType = (tipo: string | null | undefined) => (tipo || "").trim().toLowerCase();

const Section = ({
  icon,
  title,
  count,
  children,
  defaultOpen = false,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-card rounded-xl sm:rounded-3xl border border-border overflow-hidden">
      <button
        className="w-full px-3 sm:px-6 py-3 sm:py-4 border-b border-border flex items-center justify-between hover:bg-muted/30 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <h3 className="font-display text-base sm:text-lg font-extrabold flex items-center gap-2">
          {icon}
          {title}
          <span className="text-xs font-body font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-1">
            {count}
          </span>
        </h3>
        {open ? (
          <ChevronUp size={18} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={18} className="text-muted-foreground" />
        )}
      </button>
      {open && <div className="overflow-x-auto">{children}</div>}
    </div>
  );
};

const TransacoesTab = ({ tipoLabel, statusStyle, recentTransactions }: Props) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const categoryOptions = [
    { key: "deposits", label: "Depósitos", icon: <ArrowDownToLine size={14} /> },
    { key: "withdrawals", label: "Saques", icon: <ArrowUpFromLine size={14} /> },
    { key: "transfers", label: "Transf. Interna", icon: <Send size={14} /> },
    { key: "payments", label: "Pix", icon: <CreditCard size={14} /> },
    { key: "commissions", label: "Comissões", icon: <Star size={14} /> },
  ];

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults, isFetching: searching } = useQuery({
    queryKey: ["admin-tx-search-users", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return [];
      const { data, error } = await supabase.rpc("admin_search_users" as any, {
        _query: debouncedQuery.trim(),
        _limit: 5,
        _offset: 0,
      });
      if (error) throw error;
      return (data as any)?.users || [];
    },
    enabled: debouncedQuery.trim().length >= 2 && !selectedUserId,
  });

  const { data: fullHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ["admin-user-full-history", selectedUserId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_user_full_history" as any, {
        _user_id: selectedUserId!,
        _limit: 50,
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error);
      return result as {
        deposits: any[];
        withdrawals: any[];
        transfers: any[];
        payments: any[];
        commissions: any[];
      };
    },
    enabled: !!selectedUserId,
  });

  const selectUser = (u: any) => {
    setSelectedUserId(u.user_id);
    setSelectedUserName(u.nome);
    setSearchQuery("");
  };

  const clearSelection = () => {
    setSelectedUserId(null);
    setSelectedUserName("");
    setSearchQuery("");
    setCategoryFilter(null);
  };

  const show = (key: string) => !categoryFilter || categoryFilter === key;

  return (
    <>
      <div className="bg-card rounded-xl sm:rounded-3xl border border-border p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Search size={20} className="text-primary" />
          <h3 className="font-display text-lg font-bold">Buscar por Usuário</h3>
        </div>

        {selectedUserId ? (
          <div className="bg-muted/30 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="font-display font-bold text-sm">{selectedUserName}</p>
              <p className="font-body text-xs text-muted-foreground">
                Mostrando histórico completo deste usuário
              </p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={clearSelection}>
              <X size={14} /> Limpar
            </Button>
          </div>
        ) : (
          <div className="relative">
            <Input
              placeholder="Buscar por nome, email, CPF ou código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-xl pl-10"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
        )}

        {!selectedUserId && debouncedQuery.trim().length >= 2 && (
          <div className="border border-border rounded-xl overflow-hidden mt-2">
            {searching ? (
              <p className="text-center py-4 text-sm text-muted-foreground">Buscando...</p>
            ) : searchResults && searchResults.length > 0 ? (
              searchResults.map((u: any) => (
                <button
                  key={u.user_id}
                  className="w-full text-left px-4 py-3 hover:bg-muted/50 border-b border-border last:border-b-0 transition-colors"
                  onClick={() => selectUser(u)}
                >
                  <p className="font-display font-bold text-sm">{u.nome}</p>
                  <p className="font-body text-xs text-muted-foreground">
                    {u.email}
                    {u.cpf ? ` • CPF: ${u.cpf}` : ""}
                    {u.codigo_usuario ? ` • Código: ${u.codigo_usuario}` : ""}
                  </p>
                </button>
              ))
            ) : (
              <p className="text-center py-4 text-sm text-muted-foreground">Nenhum usuário encontrado</p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={categoryFilter === null ? "default" : "outline"}
          size="sm"
          className="rounded-xl text-xs gap-1"
          onClick={() => setCategoryFilter(null)}
        >
          <Filter size={14} /> Todos
        </Button>
        {categoryOptions.map((opt) => (
          <Button
            key={opt.key}
            variant={categoryFilter === opt.key ? "default" : "outline"}
            size="sm"
            className="rounded-xl text-xs gap-1"
            onClick={() => setCategoryFilter(categoryFilter === opt.key ? null : opt.key)}
          >
            {opt.icon} {opt.label}
          </Button>
        ))}
      </div>

      {selectedUserId &&
        (loadingHistory ? (
          <p className="text-center py-8 font-body text-sm text-muted-foreground">Carregando histórico...</p>
        ) : fullHistory ? (
          <>
            {show("deposits") && (
              <Section
                icon={<ArrowDownToLine size={18} className="text-primary" />}
                title="Depósitos"
                count={fullHistory.deposits?.length || 0}
                defaultOpen={!categoryFilter || categoryFilter === "deposits"}
              >
                {fullHistory.deposits?.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="px-3 sm:px-6 py-2 text-left font-display font-semibold text-muted-foreground text-xs">
                          Valor
                        </th>
                        <th className="px-3 sm:px-6 py-2 text-left font-display font-semibold text-muted-foreground text-xs">
                          Filho
                        </th>
                        <th className="px-3 sm:px-6 py-2 text-center font-display font-semibold text-muted-foreground text-xs">
                          Status
                        </th>
                        <th className="px-3 sm:px-6 py-2 text-left font-display font-semibold text-muted-foreground text-xs hidden sm:table-cell">
                          Data
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {fullHistory.deposits.map((d: any) => (
                        <tr key={d.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-3 sm:px-6 py-2 font-body font-semibold text-xs sm:text-sm">
                            R$ {Number(d.valor).toFixed(2)}
                          </td>
                          <td className="px-3 sm:px-6 py-2 font-body text-xs text-muted-foreground">
                            {d.kid_nome || "—"}
                          </td>
                          <td className="px-3 sm:px-6 py-2 text-center">{statusBadge(d.status, statusStyle)}</td>
                          <td className="px-3 sm:px-6 py-2 font-body text-xs text-muted-foreground hidden sm:table-cell">
                            {formatDate(d.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="px-6 py-6 text-center font-body text-sm text-muted-foreground">
                    Nenhum depósito
                  </p>
                )}
              </Section>
            )}

            {show("withdrawals") && (
              <Section
                icon={<ArrowUpFromLine size={18} className="text-destructive" />}
                title="Saques"
                count={fullHistory.withdrawals?.length || 0}
                defaultOpen={categoryFilter === "withdrawals"}
              >
                {fullHistory.withdrawals?.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="px-3 sm:px-6 py-2 text-left font-display font-semibold text-muted-foreground text-xs">
                          Valor
                        </th>
                        <th className="px-3 sm:px-6 py-2 text-left font-display font-semibold text-muted-foreground text-xs">
                          Chave Pix
                        </th>
                        <th className="px-3 sm:px-6 py-2 text-center font-display font-semibold text-muted-foreground text-xs">
                          Status
                        </th>
                        <th className="px-3 sm:px-6 py-2 text-left font-display font-semibold text-muted-foreground text-xs hidden sm:table-cell">
                          Data
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {fullHistory.withdrawals.map((w: any) => (
                        <tr key={w.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-3 sm:px-6 py-2 font-body font-semibold text-xs sm:text-sm text-destructive">
                            R$ {Number(w.valor).toFixed(2)}
                          </td>
                          <td className="px-3 sm:px-6 py-2 font-body text-xs text-muted-foreground truncate max-w-[150px]">
                            {w.chave_pix}
                          </td>
                          <td className="px-3 sm:px-6 py-2 text-center">{statusBadge(w.status, statusStyle)}</td>
                          <td className="px-3 sm:px-6 py-2 font-body text-xs text-muted-foreground hidden sm:table-cell">
                            {formatDate(w.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="px-6 py-6 text-center font-body text-sm text-muted-foreground">Nenhum saque</p>
                )}
              </Section>
            )}

            {show("transfers") && (
              <Section
                icon={<Send size={18} className="text-accent" />}
                title="Transferências Internas"
                count={fullHistory.transfers?.length || 0}
                defaultOpen={categoryFilter === "transfers"}
              >
                {fullHistory.transfers?.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="px-3 sm:px-6 py-2 text-left font-display font-semibold text-muted-foreground text-xs">
                          Tipo
                        </th>
                        <th className="px-3 sm:px-6 py-2 text-left font-display font-semibold text-muted-foreground text-xs">
                          De
                        </th>
                        <th className="px-3 sm:px-6 py-2 text-left font-display font-semibold text-muted-foreground text-xs">
                          Para
                        </th>
                        <th className="px-3 sm:px-6 py-2 text-right font-display font-semibold text-muted-foreground text-xs">
                          Valor
                        </th>
                        <th className="px-3 sm:px-6 py-2 text-center font-display font-semibold text-muted-foreground text-xs">
                          Status
                        </th>
                        <th className="px-3 sm:px-6 py-2 text-left font-display font-semibold text-muted-foreground text-xs hidden sm:table-cell">
                          Data
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {fullHistory.transfers.map((tx: any) => (
                        <tr key={tx.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-3 sm:px-6 py-2 font-body text-xs">
                            {tipoLabel[tx.tipo] || tx.tipo}
                          </td>
                          <td className="px-3 sm:px-6 py-2 font-body text-xs text-muted-foreground">
                            {tx.from_user_nome || tx.from_kid_nome || "—"}
                          </td>
                          <td className="px-3 sm:px-6 py-2 font-body text-xs text-muted-foreground">
                            {tx.to_kid_nome || "—"}
                          </td>
                          <td className="px-3 sm:px-6 py-2 text-right font-body font-semibold text-xs">
                            R$ {Number(tx.valor).toFixed(2)}
                          </td>
                          <td className="px-3 sm:px-6 py-2 text-center">{statusBadge(tx.status, statusStyle)}</td>
                          <td className="px-3 sm:px-6 py-2 font-body text-xs text-muted-foreground hidden sm:table-cell">
                            {formatDate(tx.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="px-6 py-6 text-center font-body text-sm text-muted-foreground">
                    Nenhuma transferência
                  </p>
                )}
              </Section>
            )}

            {show("payments") && (
              <Section
                icon={<CreditCard size={18} className="text-primary" />}
                title="Pagamentos Pix"
                count={fullHistory.payments?.length || 0}
                defaultOpen={categoryFilter === "payments"}
              >
                {fullHistory.payments?.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="px-3 sm:px-6 py-2 text-left font-display font-semibold text-muted-foreground text-xs">
                          Filho
                        </th>
                        <th className="px-3 sm:px-6 py-2 text-left font-display font-semibold text-muted-foreground text-xs">
                          Destinatário
                        </th>
                        <th className="px-3 sm:px-6 py-2 text-right font-display font-semibold text-muted-foreground text-xs">
                          Valor
                        </th>
                        <th className="px-3 sm:px-6 py-2 text-center font-display font-semibold text-muted-foreground text-xs">
                          Status
                        </th>
                        <th className="px-3 sm:px-6 py-2 text-left font-display font-semibold text-muted-foreground text-xs hidden sm:table-cell">
                          Data
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {fullHistory.payments.map((px: any) => (
                        <tr key={px.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-3 sm:px-6 py-2 font-body text-xs">{px.kid_nome}</td>
                          <td className="px-3 sm:px-6 py-2 font-body text-xs text-muted-foreground">
                            {px.nome_destinatario}
                          </td>
                          <td className="px-3 sm:px-6 py-2 text-right font-body font-semibold text-xs">
                            R$ {Number(px.valor).toFixed(2)}
                          </td>
                          <td className="px-3 sm:px-6 py-2 text-center">{statusBadge(px.status, statusStyle)}</td>
                          <td className="px-3 sm:px-6 py-2 font-body text-xs text-muted-foreground hidden sm:table-cell">
                            {formatDate(px.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="px-6 py-6 text-center font-body text-sm text-muted-foreground">
                    Nenhum pagamento Pix
                  </p>
                )}
              </Section>
            )}

            {show("commissions") && (
              <Section
                icon={<Star size={18} className="text-kids-yellow" />}
                title="Comissões Mini Gerente"
                count={fullHistory.commissions?.length || 0}
                defaultOpen={categoryFilter === "commissions"}
              >
                {fullHistory.commissions?.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="px-3 sm:px-6 py-2 text-left font-display font-semibold text-muted-foreground text-xs">
                          Filho
                        </th>
                        <th className="px-3 sm:px-6 py-2 text-right font-display font-semibold text-muted-foreground text-xs">
                          Depósito
                        </th>
                        <th className="px-3 sm:px-6 py-2 text-right font-display font-semibold text-muted-foreground text-xs">
                          Taxa
                        </th>
                        <th className="px-3 sm:px-6 py-2 text-right font-display font-semibold text-muted-foreground text-xs">
                          Comissão
                        </th>
                        <th className="px-3 sm:px-6 py-2 text-center font-display font-semibold text-muted-foreground text-xs">
                          Status
                        </th>
                        <th className="px-3 sm:px-6 py-2 text-left font-display font-semibold text-muted-foreground text-xs hidden sm:table-cell">
                          Data
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {fullHistory.commissions.map((c: any) => (
                        <tr key={c.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-3 sm:px-6 py-2 font-body text-xs">{c.kid_nome}</td>
                          <td className="px-3 sm:px-6 py-2 text-right font-body text-xs">
                            R$ {Number(c.valor_deposito).toFixed(2)}
                          </td>
                          <td className="px-3 sm:px-6 py-2 text-right font-body text-xs">
                            {Number(c.taxa_percentual).toFixed(1)}%
                          </td>
                          <td className="px-3 sm:px-6 py-2 text-right font-body font-semibold text-xs text-primary">
                            R$ {Number(c.valor_comissao).toFixed(2)}
                          </td>
                          <td className="px-3 sm:px-6 py-2 text-center">{statusBadge(c.status, statusStyle)}</td>
                          <td className="px-3 sm:px-6 py-2 font-body text-xs text-muted-foreground hidden sm:table-cell">
                            {formatDate(c.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="px-6 py-6 text-center font-body text-sm text-muted-foreground">
                    Nenhuma comissão
                  </p>
                )}
              </Section>
            )}
          </>
        ) : null)}

      {!selectedUserId && (
        <div className="bg-card rounded-xl sm:rounded-3xl border border-border overflow-hidden">
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-border">
            <h3 className="font-display text-xl font-extrabold flex items-center gap-2">
              <ArrowLeftRight size={20} className="text-primary" />
              Transações recentes
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-display font-semibold text-muted-foreground text-xs sm:text-sm">
                    Tipo
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-display font-semibold text-muted-foreground text-xs sm:text-sm">
                    De
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-display font-semibold text-muted-foreground text-xs sm:text-sm">
                    Para
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-right font-display font-semibold text-muted-foreground text-xs sm:text-sm">
                    Valor
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-center font-display font-semibold text-muted-foreground text-xs sm:text-sm">
                    Status
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-display font-semibold text-muted-foreground text-xs sm:text-sm hidden sm:table-cell">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentTransactions?.map((tx) => {
                  const normalizedType = normalizeTxType(tx.tipo);
                  const from = tx.from_user_nome || tx.from_kid_nome || "—";
                  const to =
                    normalizedType === "deposito" || normalizedType === "saque" ? "—" : tx.to_kid_nome || "—";
                  const meta = recentTypeMeta[normalizedType];

                  return (
                    <tr key={tx.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-3 sm:px-6 py-2 sm:py-3 font-body text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          {meta?.icon}
                          <span>{meta?.label || tipoLabel[normalizedType] || tx.tipo}</span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-3 font-body text-xs sm:text-sm text-muted-foreground">
                        {from}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-3 font-body text-xs sm:text-sm text-muted-foreground">
                        {to}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-3 text-right font-body font-semibold text-xs sm:text-sm">
                        R$ {Number(tx.valor).toFixed(2)}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-3 text-center">
                        {statusBadge(tx.status, statusStyle)}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-3 font-body text-xs text-muted-foreground hidden sm:table-cell">
                        {formatDate(tx.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {(!recentTransactions || recentTransactions.length === 0) && (
              <p className="px-6 py-8 text-center font-body text-sm text-muted-foreground">
                Nenhuma transação encontrada
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default TransacoesTab;
