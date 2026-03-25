import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { ArrowLeft, Eye, EyeOff, Home } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const formatCPF = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const isEmail = (value: string) => /\S+@\S+\.\S+/.test(value.trim());

const getFriendlyAuthError = (message?: string) => {
  const normalized = (message || "").toLowerCase();

  if (normalized.includes("email not confirmed")) {
    return "Seu e-mail ainda não foi confirmado. Confirme o e-mail ou desative a confirmação de e-mail no Supabase.";
  }

  if (normalized.includes("invalid login credentials")) {
    return "CPF, e-mail ou senha incorretos.";
  }

  return message || "Não foi possível entrar agora.";
};

const loginSchema = z.object({
  identifier: z.string().min(1, "CPF ou e-mail é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

const Login = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((current) => {
      if (name !== "identifier") {
        return { ...current, [name]: value };
      }

      return {
        ...current,
        identifier: isEmail(value) || value.includes("@") ? value.trim() : formatCPF(value),
      };
    });
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse(form);
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

    let emailToUse = form.identifier.trim();

    if (!isEmail(emailToUse)) {
      const { data: rpcResult, error: rpcError } = await supabase.rpc("get_email_by_cpf", { _cpf: emailToUse });
      const lookup = rpcResult as { success: boolean; email?: string; error?: string } | null;

      if (rpcError || !lookup?.success || !lookup?.email) {
        toast.error("CPF não encontrado.");
        setLoading(false);
        return;
      }

      emailToUse = lookup.email;
    }

    const { error } = await signIn(emailToUse, form.password);
    if (error) {
      toast.error(getFriendlyAuthError(error.message));
    } else {
      toast.success("Login realizado com sucesso!");
      navigate("/dashboard");
    }

    setLoading(false);
  };

  const handleForgotPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!forgotEmail.trim()) {
      toast.error("Digite seu e-mail.");
      return;
    }

    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });

    if (error) {
      toast.error("Erro ao enviar e-mail de redefinição.");
    } else {
      toast.success("E-mail de redefinição enviado! Verifique sua caixa de entrada.");
      setForgotOpen(false);
      setForgotEmail("");
    }
    setForgotLoading(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute left-4 top-4">
        <Link to="/" className="flex items-center gap-1 font-body text-sm text-muted-foreground transition-colors hover:text-primary">
          <ArrowLeft size={16} /> Voltar
        </Link>
      </div>
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="text-3xl">🐷</span>
            <span className="font-display text-3xl font-bold text-primary">Pix Kids</span>
          </Link>
        </div>

        <Card className="rounded-3xl border-border shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl">Entrar na sua conta</CardTitle>
            <CardDescription className="font-body">Acesse o painel do responsável com CPF ou e-mail</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="identifier" className="font-body font-semibold">
                  CPF ou e-mail
                </Label>
                <Input
                  id="identifier"
                  name="identifier"
                  type="text"
                  inputMode="email"
                  value={form.identifier}
                  onChange={handleChange}
                  placeholder="000.000.000-00 ou seu@email.com"
                  className="mt-1 rounded-xl"
                />
                {errors.identifier && <p className="mt-1 text-sm text-destructive">{errors.identifier}</p>}
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
                    placeholder="Sua senha"
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
                <button type="button" onClick={() => setForgotOpen(true)} className="mt-1 text-xs font-body text-primary hover:underline">
                  Esqueceu a senha?
                </button>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary py-6 text-lg font-display font-bold text-primary-foreground hover:bg-primary/90"
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col items-center gap-3">
            <p className="font-body text-sm text-muted-foreground">
              Não tem conta?{" "}
              <Link to="/cadastro" className="font-semibold text-primary hover:underline">
                Criar conta
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

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Redefinir senha</DialogTitle>
            <DialogDescription className="font-body">
              Digite seu e-mail cadastrado para receber o link de redefinição.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <Label htmlFor="forgot-email" className="font-body font-semibold">
                E-mail
              </Label>
              <Input
                id="forgot-email"
                type="email"
                value={forgotEmail}
                onChange={(event) => setForgotEmail(event.target.value)}
                placeholder="seu@email.com"
                className="mt-1 rounded-xl"
              />
            </div>
            <Button
              type="submit"
              disabled={forgotLoading}
              className="w-full rounded-xl bg-primary py-5 font-display font-bold text-primary-foreground hover:bg-primary/90"
            >
              {forgotLoading ? "Enviando..." : "Enviar link de redefinição"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
