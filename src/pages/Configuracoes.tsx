import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, Eye, EyeOff, FileText, Gauge, KeyRound, Lock, Percent, Settings } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { useFamilyOwner } from "@/hooks/useFamilyOwner";
import { useKids, useParentProfile } from "@/hooks/useDashboard";
import { supabase } from "@/integrations/supabase/client";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ReportType = "responsavel" | "filho";

type ReportEntry = {
  created_at: string;
  tipo: string;
  valor: number;
  status: string;
  descricao: string | null;
};

const Configuracoes = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: kids } = useKids();
  const { data: profile } = useParentProfile();
  const { data: familyOwner } = useFamilyOwner();
  const firstName = profile?.nome?.split(" ")[0] || "Responsavel";

  const [pwForm, setPwForm] = useState({ newPw: "", confirm: "" });
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const [reportType, setReportType] = useState<ReportType>("responsavel");
  const [selectedKid, setSelectedKid] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [reportLoading, setReportLoading] = useState(false);

  const [chavePix, setChavePix] = useState("");
  const [pixLoading, setPixLoading] = useState(false);

  const [platformSettings, setPlatformSettings] = useState<Record<string, string>>({});
  const [userFees, setUserFees] = useState<Record<string, string>>({});
  const [userProfile, setUserProfile] = useState<{
    limite_diario: number | null;
    limite_deposito: number | null;
  } | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from("platform_settings").select("key, value");
      if (!data) return;

      const map: Record<string, string> = {};
      data.forEach((setting) => {
        map[setting.key] = setting.value;
      });
      setPlatformSettings(map);
    };

    const fetchUserFees = async () => {
      const ownerId = familyOwner?.ownerId ?? user?.id;
      if (!ownerId) return;

      const { data } = await supabase.from("user_custom_fees").select("fee_key, fee_value").eq("user_id", ownerId);
      if (!data) return;

      const map: Record<string, string> = {};
      data.forEach((fee) => {
        map[fee.fee_key] = fee.fee_value;
      });
      setUserFees(map);
    };

    const fetchUserProfile = async () => {
      const ownerId = familyOwner?.ownerId ?? user?.id;
      if (!ownerId) return;

      const { data } = await supabase.rpc("get_family_profile");
      const familyProfile = Array.isArray(data) ? data[0] : data;

      if (familyProfile) {
        setUserProfile({
          limite_diario: familyProfile.limite_diario,
          limite_deposito: familyProfile.limite_deposito,
        });
        setChavePix(familyProfile.chave_pix || "");
      }
    };

    void fetchSettings();
    void fetchUserFees();
    void fetchUserProfile();
  }, [user, familyOwner?.ownerId]);

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();

    if (pwForm.newPw.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (pwForm.newPw !== pwForm.confirm) {
      toast.error("As senhas nao coincidem.");
      return;
    }

    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pwForm.newPw });

    if (error) {
      toast.error("Erro ao alterar senha.");
    } else {
      toast.success("Senha alterada com sucesso!");
      setPwForm({ newPw: "", confirm: "" });
    }

    setPwLoading(false);
  };

  const detectPixType = (value: string): string => {
    const digits = value.replace(/\D/g, "");
    if (/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(value)) return "CPF";
    if (digits.length === 11) return "Telefone";
    if (digits.length === 14) return "CNPJ";
    if (value.includes("@")) return "E-mail";
    return "Chave aleatoria";
  };

  const formatPixInput = (value: string): string => {
    const digits = value.replace(/\D/g, "");
    if (/^\d+$/.test(value) || /^\d{3}\.?\d{3}\.?\d{3}-?\d{0,2}$/.test(value)) {
      if (digits.length <= 11) {
        return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, d) =>
          d ? `${a}.${b}.${c}-${d}` : digits.length > 6 ? `${a}.${b}.${c}` : digits.length > 3 ? `${a}.${b}` : a,
        );
      }
    }
    return value;
  };

  const handleSavePixKey = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!chavePix.trim()) {
      toast.error("Informe a chave Pix.");
      return;
    }

    setPixLoading(true);
    const { data, error } = await supabase.rpc("update_family_pix_key", {
      _chave_pix: chavePix.trim(),
    });

    const result = data as { success?: boolean; error?: string } | null;

    if (error || !result?.success) {
      toast.error(result?.error || "Erro ao salvar chave Pix.");
    } else {
      toast.success("Chave Pix atualizada com sucesso!");
    }

    setPixLoading(false);
  };

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const generatePDF = async () => {
    if (!dateStart || !dateEnd) {
      toast.error("Selecione o periodo.");
      return;
    }

    if (reportType === "filho" && !selectedKid) {
      toast.error("Selecione um filho para gerar o relatorio.");
      return;
    }

    setReportLoading(true);
    try {
      const entries: ReportEntry[] = [];
      const startDate = new Date(dateStart).toISOString();
      const endDate = new Date(`${dateEnd}T23:59:59`).toISOString();

      if (reportType === "responsavel") {
        const [{ data: transactions }, { data: deposits }, { data: withdrawals }] = await Promise.all([
          supabase
            .from("transactions")
            .select("*")
            .or(`from_user.eq.${familyOwner?.ownerId ?? user!.id},to_user.eq.${familyOwner?.ownerId ?? user!.id}`)
            .gte("created_at", startDate)
            .lte("created_at", endDate)
            .order("created_at", { ascending: false }),
          supabase
            .from("deposits")
            .select("valor, status, created_at")
            .eq("user_id", familyOwner?.ownerId ?? user!.id)
            .gte("created_at", startDate)
            .lte("created_at", endDate)
            .order("created_at", { ascending: false }),
          supabase
            .from("withdrawals")
            .select("valor, status, created_at")
            .eq("user_id", familyOwner?.ownerId ?? user!.id)
            .gte("created_at", startDate)
            .lte("created_at", endDate)
            .order("created_at", { ascending: false }),
        ]);

        (transactions || []).forEach((tx: any) => {
          entries.push({
            created_at: tx.created_at,
            tipo: String(tx.tipo),
            valor: Number(tx.valor),
            status: String(tx.status),
            descricao: tx.descricao || null,
          });
        });

        (deposits || []).forEach((deposit: any) => {
          entries.push({
            created_at: deposit.created_at,
            tipo: "deposito",
            valor: Number(deposit.valor),
            status: String(deposit.status),
            descricao: "Deposito via Pix",
          });
        });

        (withdrawals || []).forEach((withdrawal: any) => {
          entries.push({
            created_at: withdrawal.created_at,
            tipo: "saque",
            valor: Number(withdrawal.valor),
            status: String(withdrawal.status),
            descricao: "Saque via Pix",
          });
        });
      } else {
        const [{ data: transactions }, { data: commissions }] = await Promise.all([
          supabase
            .from("transactions")
            .select("*")
            .or(`from_kid.eq.${selectedKid},to_kid.eq.${selectedKid}`)
            .gte("created_at", startDate)
            .lte("created_at", endDate)
            .order("created_at", { ascending: false }),
          supabase
            .from("referral_commissions")
            .select("valor_comissao, taxa_percentual, valor_deposito, status, created_at")
            .eq("referrer_kid_id", selectedKid)
            .gte("created_at", startDate)
            .lte("created_at", endDate)
            .order("created_at", { ascending: false }),
        ]);

        (transactions || []).forEach((tx: any) => {
          entries.push({
            created_at: tx.created_at,
            tipo: String(tx.tipo),
            valor: Number(tx.valor),
            status: String(tx.status),
            descricao: tx.descricao || null,
          });
        });

        (commissions || []).forEach((commission: any) => {
          entries.push({
            created_at: commission.created_at,
            tipo: "comissao",
            valor: Number(commission.valor_comissao),
            status: String(commission.status),
            descricao: `Comissao ${Number(commission.taxa_percentual).toFixed(2)}% sobre R$ ${Number(commission.valor_deposito).toFixed(2)}`,
          });
        });
      }

      entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      if (entries.length === 0) {
        toast.error("Nenhuma transacao encontrada no periodo.");
        setReportLoading(false);
        return;
      }

      const kidName = reportType === "filho" ? kids?.find((kid) => kid.id === selectedKid)?.nome || "" : "";
      const title = reportType === "responsavel" ? `Relatorio de ${escapeHtml(firstName)}` : `Relatorio de ${escapeHtml(kidName)}`;

      const rows = entries
        .map(
          (entry) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(format(new Date(entry.created_at), "dd/MM/yyyy HH:mm"))}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(entry.tipo)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">R$ ${escapeHtml(entry.valor.toFixed(2))}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(entry.status)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(entry.descricao || "-")}</td>
        </tr>
      `,
        )
        .join("");

      const approvedStatuses = new Set(["aprovado", "confirmado"]);
      const totalIn = entries
        .filter((entry) => approvedStatuses.has(entry.status) && (entry.tipo === "mesada" || entry.tipo === "deposito" || entry.tipo === "comissao"))
        .reduce((sum, entry) => sum + entry.valor, 0);
      const totalOut = entries
        .filter((entry) => approvedStatuses.has(entry.status) && (entry.tipo === "pagamento" || entry.tipo === "transferencia" || entry.tipo === "saque"))
        .reduce((sum, entry) => sum + entry.valor, 0);

      const html = `
        <html><head><title>${title}</title>
        <style>
          body{font-family:Arial,sans-serif;padding:40px;color:#333;}
          table{width:100%;border-collapse:collapse;margin-top:20px;}
          th{background:#4A90D9;color:#fff;padding:10px;text-align:left;}
          .summary{margin-top:20px;padding:15px;background:#f5f5f5;border-radius:8px;}
        </style></head><body>
        <h1>Pix Kids - ${title}</h1>
        <p>Periodo: ${escapeHtml(format(new Date(startDate), "dd/MM/yyyy"))} a ${escapeHtml(format(new Date(endDate), "dd/MM/yyyy"))}</p>
        <div class="summary">
          <p><strong>Total de entradas:</strong> R$ ${escapeHtml(totalIn.toFixed(2))}</p>
          <p><strong>Total de saidas:</strong> R$ ${escapeHtml(totalOut.toFixed(2))}</p>
          <p><strong>Total de transacoes:</strong> ${escapeHtml(String(entries.length))}</p>
        </div>
        <table><thead><tr>
          <th>Data</th><th>Tipo</th><th>Valor</th><th>Status</th><th>Descricao</th>
        </tr></thead><tbody>${rows}</tbody></table>
        </body></html>
      `;

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
      }
    } catch {
      toast.error("Erro ao gerar relatorio.");
    }

    setReportLoading(false);
  };

  if (loading || !user) return null;

  const getUserValue = (key: string) => userFees[key] || platformSettings[key] || "0";
  const formatBRL = (value: string | number | null | undefined) => {
    const parsed = Number(value);
    if (!value || Number.isNaN(parsed)) return "Nao definido";
    return `R$ ${parsed.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const miniGerenteTaxa = getUserValue("mini_gerente_taxa");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card px-4 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-muted-foreground transition-colors hover:text-primary">
              <ArrowLeft size={18} />
            </Link>
            <Settings size={22} className="text-primary" />
            <span className="font-display text-2xl font-bold text-primary">Configuracoes</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto max-w-2xl space-y-6 px-4 py-8">
        <Card className="rounded-3xl border-border shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-xl">
              <Lock size={20} className="text-primary" /> Alterar senha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <Label className="font-body font-semibold">Nova senha</Label>
                <div className="relative mt-1">
                  <Input
                    type={showNewPw ? "text" : "password"}
                    value={pwForm.newPw}
                    onChange={(event) => setPwForm({ ...pwForm, newPw: event.target.value })}
                    placeholder="Minimo 6 caracteres"
                    className="rounded-xl pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showNewPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <Label className="font-body font-semibold">Confirmar nova senha</Label>
                <div className="relative mt-1">
                  <Input
                    type={showConfirmPw ? "text" : "password"}
                    value={pwForm.confirm}
                    onChange={(event) => setPwForm({ ...pwForm, confirm: event.target.value })}
                    placeholder="Repita a nova senha"
                    className="rounded-xl pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showConfirmPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={pwLoading} className="w-full rounded-xl py-5 font-display font-bold">
                {pwLoading ? "Alterando..." : "Alterar senha"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-xl">
              <KeyRound size={20} className="text-primary" /> Chave Pix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSavePixKey} className="space-y-4">
              <div>
                <Label className="font-body font-semibold">Sua chave Pix</Label>
                <Input
                  value={chavePix}
                  onChange={(event) => setChavePix(formatPixInput(event.target.value))}
                  placeholder="CPF, e-mail, telefone ou chave aleatoria"
                  className="mt-1 rounded-xl"
                />
                {chavePix && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Tipo detectado: <span className="font-semibold text-primary">{detectPixType(chavePix)}</span>
                  </p>
                )}
              </div>

              <Button type="submit" disabled={pixLoading} className="w-full rounded-xl py-5 font-display font-bold">
                {pixLoading ? "Salvando..." : "Salvar chave Pix"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-xl">
              <FileText size={20} className="text-primary" /> Relatorios financeiros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="font-body font-semibold">Tipo de relatorio</Label>
              <Select value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
                <SelectTrigger className="mt-1 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="responsavel">{firstName}</SelectItem>
                  <SelectItem value="filho">Filho</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {reportType === "filho" && (
              <div>
                <Label className="font-body font-semibold">Selecionar filho</Label>
                <Select value={selectedKid} onValueChange={setSelectedKid}>
                  <SelectTrigger className="mt-1 rounded-xl">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {kids?.map((kid) => (
                      <SelectItem key={kid.id} value={kid.id}>
                        {kid.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-body font-semibold">Data inicial</Label>
                <Input type="date" value={dateStart} onChange={(event) => setDateStart(event.target.value)} className="mt-1 rounded-xl" />
              </div>
              <div>
                <Label className="font-body font-semibold">Data final</Label>
                <Input type="date" value={dateEnd} onChange={(event) => setDateEnd(event.target.value)} className="mt-1 rounded-xl" />
              </div>
            </div>

            <Button onClick={generatePDF} disabled={reportLoading} className="w-full rounded-xl py-5 font-display font-bold">
              {reportLoading ? "Gerando..." : "Gerar PDF"}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-xl">
              <Gauge size={20} className="text-primary" /> Limites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="mb-2 text-xs text-muted-foreground">Limites da plataforma</p>
              {[
                { label: "Limite de deposito diario", value: formatBRL(platformSettings.limite_deposito) },
                { label: "Limite diario padrao", value: formatBRL(platformSettings.limite_diario_padrao) },
                { label: "Limite por Pix", value: formatBRL(platformSettings.limite_pix) },
                { label: "Limite por transferencia", value: formatBRL(platformSettings.limite_transferencia) },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-xl bg-muted p-3">
                  <span className="font-body text-sm">{item.label}</span>
                  <span className="font-display font-bold">{item.value}</span>
                </div>
              ))}

              {(userProfile?.limite_diario !== null || userProfile?.limite_deposito !== null) && (
                <>
                  <p className="mb-2 mt-4 text-xs text-muted-foreground">Seus limites personalizados</p>
                  {userProfile?.limite_deposito !== null && userProfile?.limite_deposito !== undefined && (
                    <div className="flex items-center justify-between rounded-xl bg-primary/10 p-3">
                      <span className="font-body text-sm">Seu limite de deposito</span>
                      <span className="font-display font-bold text-primary">{formatBRL(userProfile.limite_deposito)}</span>
                    </div>
                  )}
                  {userProfile?.limite_diario !== null && userProfile?.limite_diario !== undefined && (
                    <div className="flex items-center justify-between rounded-xl bg-primary/10 p-3">
                      <span className="font-body text-sm">Seu limite diario</span>
                      <span className="font-display font-bold text-primary">{formatBRL(userProfile.limite_diario)}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-xl">
              <Percent size={20} className="text-primary" /> Taxas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-muted p-3">
                <span className="font-body text-sm">Comissao Mini Gerente (%)</span>
                <span className="font-display font-bold">{miniGerenteTaxa}%</span>
              </div>
              {Object.keys(userFees).length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">Valores personalizados aplicados a sua conta.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Configuracoes;
