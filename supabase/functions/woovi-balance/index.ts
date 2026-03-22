import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const WOOVI_APP_ID = Deno.env.get("WOOVI_APP_ID");
const WOOVI_API_URL = Deno.env.get("WOOVI_API_URL") || "https://api.woovi.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function centsToCurrency(value: unknown) {
  const parsed = Number(value ?? 0);
  if (Number.isNaN(parsed)) return 0;
  return parsed / 100;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ ok: false, error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ ok: false, error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: isAdmin } = await serviceClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ ok: false, error: "Sem permissão" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!WOOVI_APP_ID) {
      return new Response(JSON.stringify({ ok: false, error: "WOOVI_APP_ID não configurado" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch(`${WOOVI_API_URL}/api/v1/account/`, {
      method: "GET",
      headers: { Authorization: WOOVI_APP_ID },
    });

    const responseJson = await res.json();

    if (!res.ok) {
      console.error("Woovi balance error:", responseJson);
      return new Response(JSON.stringify({ ok: false, error: "Erro ao consultar saldo Woovi" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const account = responseJson?.accounts?.find((item: any) => item?.isDefault) ||
      responseJson?.accounts?.[0] ||
      responseJson?.account ||
      null;
    const balance = account?.balance || {};

    return new Response(JSON.stringify({
      ok: true,
      balance: centsToCurrency(balance.available ?? balance.total),
      statistics: responseJson,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Woovi balance error:", err);
    return new Response(JSON.stringify({ ok: false, error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
