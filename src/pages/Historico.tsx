import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import TransactionHistory from "@/components/dashboard/TransactionHistory";
import WhatsAppButton from "@/components/shared/WhatsAppButton";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Historico() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8 pt-2">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-display text-xl font-bold">Histórico de Transações</h1>
        </div>

        <TransactionHistory />
      </div>
      <WhatsAppButton />
    </div>
  );
}
