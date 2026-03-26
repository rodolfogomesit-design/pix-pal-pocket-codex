import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { RouteLoading } from "@/app/route-loading";

const Admin = lazy(() => import("@/pages/Admin"));
const Cadastro = lazy(() => import("@/pages/Cadastro"));
const Configuracoes = lazy(() => import("@/pages/Configuracoes"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Depositar = lazy(() => import("@/pages/Depositar"));
const Historico = lazy(() => import("@/pages/Historico"));
const Index = lazy(() => import("@/pages/Index"));
const KidDashboard = lazy(() => import("@/pages/KidDashboard"));
const KidLogin = lazy(() => import("@/pages/KidLogin"));
const KidPagar = lazy(() => import("@/pages/KidPagar"));
const KidPagarPix = lazy(() => import("@/pages/KidPagarPix"));
const KidPoupar = lazy(() => import("@/pages/KidPoupar"));
const KidSacarComissao = lazy(() => import("@/pages/KidSacarComissao"));
const Login = lazy(() => import("@/pages/Login"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Perfil = lazy(() => import("@/pages/Perfil"));
const RedefinirSenha = lazy(() => import("@/pages/RedefinirSenha"));
const Sacar = lazy(() => import("@/pages/Sacar"));
const Termos = lazy(() => import("@/pages/Termos"));

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/depositar" element={<Depositar />} />
        <Route path="/sacar" element={<Sacar />} />
        <Route path="/historico" element={<Historico />} />
        <Route path="/crianca" element={<KidLogin />} />
        <Route path="/crianca/dashboard" element={<KidDashboard />} />
        <Route path="/crianca/pagar" element={<KidPagar />} />
        <Route path="/crianca/pagar-pix" element={<KidPagarPix />} />
        <Route path="/crianca/poupar" element={<KidPoupar />} />
        <Route path="/crianca/sacar-comissao" element={<KidSacarComissao />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
        <Route path="/termos" element={<Termos />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
