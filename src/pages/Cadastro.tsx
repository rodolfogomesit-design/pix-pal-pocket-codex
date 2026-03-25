import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Gift, Home, XCircle } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import ThemeToggle from "@/components/theme/ThemeToggle";
import TermsDialog from "@/components/legal/TermsDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const validateCpfDigits = (cpf: string): boolean => {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    sum += parseInt(digits[index], 10) * (10 - index);
  }

  let rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== parseInt(digits[9], 10)) return false;

  sum = 0;
  for (let index = 0; index < 10; index += 1) {
    sum += parseInt(digits[index], 10) * (11 - index);
  }

  rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  return rest === parseInt(digits[10], 10);
};

const signupSchema = z.object({
  nome: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  email: z.string().trim().email("Email inválido").max(255),
  telefone: z.string().trim().min(10, "Telefone inválido").max(20),
  cpf: z
    .string()
    .trim()
    .min(11, "CPF inválido")
    .max(14)
    .refine(validateCpfDigits, "CPF inválido (dígito verificador incorreto)"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

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

const Cadastro = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    cpf: "",
    password: "",
    confirmPassword: "",
  });
  const [referralCode, setReferralCode] = useState(searchParams.get("ref") || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const cpfDigits = form.cpf.replace(/\D/g, "");
  const cpfComplete = cpfDigits.length === 11;
  const cpfValid = cpfComplete && validateCpfDigits(form.cpf);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    let nextValue = value;

    if (name === "nome") {
      nextValue = value.toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
    }
    if (name === "cpf") {
      nextValue = formatCpf(value);
    }
    if (name === "telefone") {
      nextValue = formatPhone(value);
    }

    setForm((current) => ({ ...current, [name]: nextValue }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});

    if (!acceptTerms || !acceptPrivacy) {
      toast.error("Você precisa aceitar os termos para continuar.");
      return;
    }

    const result = signupSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as string] = error.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const { error } = await signUp(form.email, form.password, {
      nome: form.nome,
      telefone: form.telefone,
      cpf: form.cpf,
      referral_code: referralCode.trim(),
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (referralCode.trim()) {
      localStorage.setItem("pix_kids_referral_code", referralCode.trim());
    }

    toast.success("Conta criada com sucesso! Verifique seu email.");
    navigate("/login");
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen bg-background px-4 py-10">
      <div className="absolute left-4 top-4">
        <Link to="/" className="flex items-center gap-1 font-body text-sm text-muted-foreground transition-colors hover:text-primary">
          <ArrowLeft size={16} /> Voltar
        </Link>
      </div>
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center">
        <div className="w-full">
          <div className="mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="text-3xl">🐷</span>
              <span className="font-display text-3xl font-bold text-primary">Pix Kids</span>
            </Link>
          </div>

          <Card className="rounded-3xl border-border shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="font-display text-2xl">Criar conta de responsável</CardTitle>
              <CardDescription className="font-body">Preencha seus dados para começar</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nome" className="font-body font-semibold">
                    Nome completo
                  </Label>
                  <Input
                    id="nome"
                    name="nome"
                    value={form.nome}
                    onChange={handleChange}
                    placeholder="Seu nome completo"
                    className="mt-1 rounded-xl"
                  />
                  {errors.nome && <p className="mt-1 text-sm text-destructive">{errors.nome}</p>}
                </div>

                <div>
                  <Label htmlFor="email" className="font-body font-semibold">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="seu@email.com"
                    className="mt-1 rounded-xl"
                  />
                  {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email}</p>}
                </div>

                <div>
                  <Label htmlFor="telefone" className="font-body font-semibold">
                    Telefone
                  </Label>
                  <Input
                    id="telefone"
                    name="telefone"
                    value={form.telefone}
                    onChange={handleChange}
                    placeholder="(11) 99999-9999"
                    className="mt-1 rounded-xl"
                  />
                  {errors.telefone && <p className="mt-1 text-sm text-destructive">{errors.telefone}</p>}
                </div>

                <div>
                  <Label htmlFor="cpf" className="font-body font-semibold">
                    CPF
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="cpf"
                      name="cpf"
                      value={form.cpf}
                      onChange={handleChange}
                      placeholder="000.000.000-00"
                      className={`rounded-xl pr-10 ${
                        cpfComplete
                          ? cpfValid
                            ? "border-green-500 focus-visible:ring-green-500"
                            : "border-destructive focus-visible:ring-destructive"
                          : ""
                      }`}
                    />
                    {cpfComplete && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        {cpfValid ? (
                          <CheckCircle2 size={18} className="text-green-500" />
                        ) : (
                          <XCircle size={18} className="text-destructive" />
                        )}
                      </span>
                    )}
                  </div>
                  {cpfComplete && !cpfValid && (
                    <p className="mt-1 text-sm text-destructive">CPF inválido. Verifique os números digitados.</p>
                  )}
                  {errors.cpf && <p className="mt-1 text-sm text-destructive">{errors.cpf}</p>}
                </div>

                <div>
                  <Label htmlFor="password" className="font-body font-semibold">
                    Senha
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Mínimo de 6 caracteres"
                      className="rounded-xl pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password}</p>}
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="font-body font-semibold">
                    Confirmar senha
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder="Repita a senha"
                      className="rounded-xl pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-sm text-destructive">{errors.confirmPassword}</p>}
                </div>

                <div className="rounded-xl border border-kids-yellow/30 bg-kids-yellow-light/50 p-4">
                  <Label className="flex items-center gap-2 font-body font-semibold">
                    <Gift size={16} className="text-kids-orange" />
                    Código de indicação
                  </Label>
                  <Input
                    value={referralCode}
                    onChange={(event) => setReferralCode(event.target.value.replace(/\D/g, "").slice(0, 5))}
                    placeholder="Ex: 12345"
                    className="mt-1 rounded-xl"
                    maxLength={10}
                  />
                  <p className="mt-1 text-xs font-body text-muted-foreground">
                    Se alguém te indicou, você pode informar o código aqui.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-2">
                    <Checkbox id="terms" checked={acceptTerms} onCheckedChange={(value) => setAcceptTerms(value === true)} className="mt-0.5" />
                    <span className="font-body text-sm text-muted-foreground">
                      <label htmlFor="terms" className="cursor-pointer">
                        Aceito os
                      </label>{" "}
                      <button type="button" className="font-semibold text-primary hover:underline" onClick={() => setShowTermsDialog(true)}>
                        Termos de Uso
                      </button>
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <Checkbox id="privacy" checked={acceptPrivacy} onCheckedChange={(value) => setAcceptPrivacy(value === true)} className="mt-0.5" />
                    <span className="font-body text-sm text-muted-foreground">
                      <label htmlFor="privacy" className="cursor-pointer">
                        Aceito a
                      </label>{" "}
                      <button type="button" className="font-semibold text-primary hover:underline" onClick={() => setShowPrivacyDialog(true)}>
                        Política de Proteção de Dados
                      </button>
                    </span>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !acceptTerms || !acceptPrivacy}
                  className="w-full rounded-xl bg-primary py-6 text-lg font-display font-bold text-primary-foreground hover:bg-primary/90"
                >
                  {loading ? "Criando conta..." : "Criar conta"}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col items-center gap-3">
              <p className="font-body text-sm text-muted-foreground">
                Já tem conta?{" "}
                <Link to="/login" className="font-semibold text-primary hover:underline">
                  Entrar
                </Link>
              </p>
              <Link to="/">
                <Button variant="outline" type="button" className="gap-2 rounded-xl">
                  <Home size={16} /> Início
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>

      <TermsDialog open={showTermsDialog} onOpenChange={setShowTermsDialog} type="termos_uso" />
      <TermsDialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog} type="politica_privacidade" />
    </div>
  );
};

export default Cadastro;
