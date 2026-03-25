import { useEffect, useState } from "react";

import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { ArrowLeft, Save, User } from "lucide-react";
import { Key } from "lucide-react";
import EmojiBrand from "@/components/branding/EmojiBrand";

type PixKeyType = "cpf" | "cnpj" | "email" | "telefone" | "aleatoria" | "outro";

const TIPO_CHAVE_LABELS: Record<string, string> = {
  cpf: "CPF",
  cnpj: "CNPJ",
  email: "E-mail",
  telefone: "Telefone",
  aleatoria: "Chave aleatória",
  outro: "Outro",
};

const detectPixKeyType = (value: string): PixKeyType => {
  const cleaned = value.trim();
  if (!cleaned) return "cpf";
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) return "email";
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length === 11 && /^\d{2}9\d{8}$/.test(digits)) return "telefone";
  if (digits.length === 11) return "cpf";
  if (digits.length === 14) return "cnpj";
  if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(cleaned)) return "aleatoria";
  if (digits.length >= 20) return "aleatoria";
  return "outro";
};

const formatChavePixLive = (value: string): string => {
  if (/[a-zA-Z@]/.test(value)) return value;
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) return value;

  // Telefone
  if (/^\d{2}9/.test(digits) && digits.length <= 11) {
    let f = digits;
    if (digits.length > 2) f = "(" + digits.slice(0, 2) + ") " + digits.slice(2);
    if (digits.length > 7) f = "(" + digits.slice(0, 2) + ") " + digits.slice(2, 7) + "-" + digits.slice(7);
    return f;
  }
  // CPF
  if (digits.length <= 11) {
    let f = digits;
    if (digits.length > 3) f = digits.slice(0, 3) + "." + digits.slice(3);
    if (digits.length > 6) f = digits.slice(0, 3) + "." + digits.slice(3, 6) + "." + digits.slice(6);
    if (digits.length > 9) f = digits.slice(0, 3) + "." + digits.slice(3, 6) + "." + digits.slice(6, 9) + "-" + digits.slice(9);
    return f;
  }
  // CNPJ
  if (digits.length <= 14) {
    let f = digits;
    if (digits.length > 2) f = digits.slice(0, 2) + "." + digits.slice(2);
    if (digits.length > 5) f = digits.slice(0, 2) + "." + digits.slice(2, 5) + "." + digits.slice(5);
    if (digits.length > 8) f = digits.slice(0, 2) + "." + digits.slice(2, 5) + "." + digits.slice(5, 8) + "/" + digits.slice(8);
    if (digits.length > 12) f = digits.slice(0, 2) + "." + digits.slice(2, 5) + "." + digits.slice(5, 8) + "/" + digits.slice(8, 12) + "-" + digits.slice(12);
    return f;
  }
  return value;
};

const profileSchema = z.object({
  nome: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  email: z.string().trim().email("Email inválido"),
  telefone: z.string().trim().max(20).optional().or(z.literal("")),
  cpf: z.string().trim().max(14).optional().or(z.literal("")),
  chave_pix: z.string().trim().max(100).optional().or(z.literal("")),
});

const Perfil = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>("cpf");
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    cpf: "",
    chave_pix: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setForm({
          nome: data.nome || "",
          email: data.email || "",
          telefone: data.telefone || "",
          cpf: data.cpf || "",
          chave_pix: data.chave_pix || "",
        });
        // Auto-detect pix key type from saved value
        if (data.chave_pix) {
          setPixKeyType(detectPixKeyType(data.chave_pix));
        }
      }
      setLoadingProfile(false);
    };
    fetchProfile();
  }, [user]);

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits.length ? `(${digits}` : "";
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (e.target.name === "nome") {
      value = value
        .toLowerCase()
        .replace(/(^|\s)\S/g, (c) => c.toUpperCase());
    } else if (e.target.name === "cpf") {
      value = formatCpf(value);
    } else if (e.target.name === "telefone") {
      value = formatPhone(value);
    } else if (e.target.name === "chave_pix") {
      value = formatChavePixLive(value);
      const detected = detectPixKeyType(value);
      setPixKeyType(detected);
    }
    setForm({ ...form, [e.target.name]: value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = profileSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    // Validate Pix key if provided
    if (form.chave_pix.trim()) {
      const detected = detectPixKeyType(form.chave_pix);
      if (detected === "outro") {
        if (form.chave_pix.trim().length < 5) {
          setErrors({ chave_pix: "Chave Pix muito curta" });
          return;
        }
      }
    }

    setSaving(true);

    // If email changed, update via auth
    if (form.email !== user!.email) {
      const { error: emailError } = await supabase.auth.updateUser({ email: form.email });
      if (emailError) {
        toast.error("Erro ao atualizar email: " + emailError.message);
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        nome: form.nome,
        email: form.email,
        telefone: form.telefone || null,
        cpf: form.cpf || null,
        chave_pix: form.chave_pix || null,
      })
      .eq("user_id", user!.id);

    if (error) {
      toast.error("Erro ao salvar perfil.");
    } else {
      if (form.email !== user!.email) {
        toast.success("Perfil salvo! Confirme a alteração de email no seu novo endereço 📧");
      } else {
        toast.success("Perfil atualizado com sucesso! ✅");
      }
    }
    setSaving(false);
  };

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="flex justify-center animate-bounce">
            <EmojiBrand size={56} className="rounded-2xl shadow-none" />
          </div>
          <p className="font-display text-xl mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-4 sticky top-0 z-40">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <User size={22} className="text-primary" />
            <span className="font-display text-2xl font-bold text-primary">Meu Perfil</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-lg">
        <Card className="rounded-3xl shadow-xl border-border">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl">Dados pessoais 👤</CardTitle>
            <CardDescription className="font-body">
              Atualize suas informações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="font-body font-semibold">Email</Label>
                <Input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="seuemail@exemplo.com"
                  className="rounded-xl mt-1"
                  type="email"
                />
                {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                {form.email !== user.email && (
                  <p className="text-xs text-amber-600 mt-1">⚠️ Você receberá um e-mail de confirmação no novo endereço</p>
                )}
              </div>

              <div>
                <Label className="font-body font-semibold">Nome completo *</Label>
                <Input
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                  placeholder="Seu nome completo"
                  className="rounded-xl mt-1"
                />
                {errors.nome && <p className="text-sm text-destructive mt-1">{errors.nome}</p>}
              </div>

              <div>
                <Label className="font-body font-semibold">Telefone</Label>
                <Input
                  name="telefone"
                  value={form.telefone}
                  onChange={handleChange}
                  placeholder="(11) 99999-9999"
                  className="rounded-xl mt-1"
                />
                {errors.telefone && <p className="text-sm text-destructive mt-1">{errors.telefone}</p>}
              </div>

              <div>
                <Label className="font-body font-semibold">CPF</Label>
                <Input
                  name="cpf"
                  value={form.cpf}
                  disabled
                  className="rounded-xl mt-1 bg-muted cursor-not-allowed"
                />
              </div>

              <div>
                <Label className="font-body font-semibold">Chave Pix 💰</Label>
                <Input
                  name="chave_pix"
                  value={form.chave_pix}
                  onChange={handleChange}
                  placeholder="CPF, e-mail, telefone ou chave aleatória"
                  className="rounded-xl mt-1"
                />
                {form.chave_pix.trim() && (
                  <div className="flex items-center gap-1 mt-1">
                    <Key size={12} className="text-primary" />
                    <span className="text-xs font-body text-muted-foreground">
                      Detectado: <strong className="text-primary">{TIPO_CHAVE_LABELS[pixKeyType] || pixKeyType}</strong>
                    </span>
                  </div>
                )}
                {errors.chave_pix && <p className="text-sm text-destructive mt-1">{errors.chave_pix}</p>}
              </div>

              <Button
                type="submit"
                disabled={saving}
                className="w-full font-display font-bold text-lg rounded-xl py-6"
              >
                <Save size={18} />
                {saving ? "Salvando..." : "Salvar alterações"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Perfil;
