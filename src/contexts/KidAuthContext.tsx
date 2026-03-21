import { createContext, useContext, useEffect, useState, ReactNode, Dispatch, SetStateAction } from "react";

export interface KidSession {
  id: string;
  nome: string;
  apelido: string | null;
  idade: number;
  codigo_publico: string;
  saldo: number;
  saldo_poupanca: number;
  is_frozen: boolean;
  limite_diario: number | null;
  aprovacao_transferencias: boolean;
  bloqueio_envio: boolean;
}

interface KidAuthContextType {
  kid: KidSession | null;
  setKid: Dispatch<SetStateAction<KidSession | null>>;
  logout: () => void;
}

const KidAuthContext = createContext<KidAuthContextType | undefined>(undefined);
const KID_SESSION_STORAGE_KEY = "pix_kids_kid_session";

export const KidAuthProvider = ({ children }: { children: ReactNode }) => {
  const [kid, setKid] = useState<KidSession | null>(() => {
    if (typeof window === "undefined") return null;

    const stored = window.localStorage.getItem(KID_SESSION_STORAGE_KEY);
    if (!stored) return null;

    try {
      return JSON.parse(stored) as KidSession;
    } catch {
      window.localStorage.removeItem(KID_SESSION_STORAGE_KEY);
      return null;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (kid) {
      window.localStorage.setItem(KID_SESSION_STORAGE_KEY, JSON.stringify(kid));
    } else {
      window.localStorage.removeItem(KID_SESSION_STORAGE_KEY);
    }
  }, [kid]);

  const logout = () => setKid(null);

  return (
    <KidAuthContext.Provider value={{ kid, setKid, logout }}>
      {children}
    </KidAuthContext.Provider>
  );
};

export const useKidAuth = () => {
  const context = useContext(KidAuthContext);
  if (!context) throw new Error("useKidAuth must be used within KidAuthProvider");
  return context;
};
