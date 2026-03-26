import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: Record<string, string>) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeAuthError = (message?: string | null) => {
  const normalized = (message || "").toLowerCase();

  if (normalized.includes("user already registered")) {
    return "Ja existe uma conta com esse e-mail. Tente entrar ou redefinir sua senha.";
  }

  if (normalized.includes("conta bloqueada")) {
    return "Sua conta esta bloqueada. Entre em contato com o suporte.";
  }

  if (normalized.includes("email rate limit exceeded")) {
    return "Muitas tentativas em sequencia. Aguarde um momento e tente novamente.";
  }

  return message || "Nao foi possivel concluir a operacao agora.";
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const isUserBlocked = async (_userId: string) => {
    const { data, error } = await supabase.rpc("is_current_user_blocked");
    if (error) throw error;
    return !!data;
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          try {
            const blocked = await isUserBlocked(session.user.id);
            if (blocked) {
              await supabase.auth.signOut();
              setSession(null);
              setUser(null);
              setLoading(false);
              return;
            }
          } catch {
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setLoading(false);
            return;
          }
        }

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        try {
          const blocked = await isUserBlocked(session.user.id);
          if (blocked) {
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setLoading(false);
            return;
          }
        } catch {
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
      }

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, metadata?: Record<string, string>) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: window.location.origin,
      },
    });

    if (!error) {
      return { error: null };
    }

    return { error: new Error(normalizeAuthError(error.message)) };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (!error && data.user) {
      const blocked = await isUserBlocked(data.user.id);
      if (blocked) {
        await supabase.auth.signOut();
        return { error: new Error(normalizeAuthError("Conta bloqueada")) };
      }
      return { error: null };
    }

    return { error: new Error(normalizeAuthError(error.message)) };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
