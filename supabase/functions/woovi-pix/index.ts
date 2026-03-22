import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const WOOVI_APP_ID = Deno.env.get("WOOVI_APP_ID");
const WOOVI_API_URL = Deno.env.get("WOOVI_API_URL") || "https://api.woovi.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function cleanDigits(value?: string | null): string {
  return (value || "").replace(/\D/g, "");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!WOOVI_APP_ID) {
      return jsonError(500, "WOOVI_APP_ID não configurado.");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonError(401, "Sessão expirada. Faça login novamente.");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return jsonError(401, "Erro de autenticação");

    const body = await req.json();
    const valor = parseFloat(body?.valor ?? "0");
    const kidId = body?.kid_id || null;

    if (!valor || valor <= 0) return jsonError(400, "Valor inválido");

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, nome, email, cpf, telefone")
      .eq("user_id", user.id)
      .single();

    if (!profile) return jsonError(404, "Perfil não encontrado");
    if (!profile.cpf) return jsonError(400, "CPF não cadastrado no perfil. Atualize seu perfil primeiro.");

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const externalId = `dep_${Date.now()}_${user.id.slice(0, 8)}`;
    const chargePayload = {
      correlationID: externalId,
      value: Math.round(valor * 100),
      comment: "Depósito Pix Kids",
      customer: {
        name: profile.nome,
        email: profile.email,
        phone: cleanDigits(profile.telefone),
        taxID: cleanDigits(profile.cpf),
      },
    };

    const chargeRes = await fetch(`${WOOVI_API_URL}/api/v1/charge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: WOOVI_APP_ID,
      },
      body: JSON.stringify(chargePayload),
    });

    const chargeJson = await chargeRes.json();
    if (!chargeRes.ok) {
      console.error("Woovi Charge Error:", chargeJson);
      const firstError = chargeJson?.errors?.[0]?.message || chargeJson?.error || "Erro ao criar cobrança Pix";
      return jsonError(500, `Erro Woovi: ${firstError}`);
    }

    const charge = chargeJson?.charge ?? chargeJson;
    const pixMethod = charge?.paymentMethods?.pix ?? {};
    const transactionId =
      charge?.transactionID ||
      pixMethod?.transactionID ||
      charge?.identifier ||
      externalId;
    const pixCode = charge?.brCode || pixMethod?.brCode || null;
    const qrCodeUrl = charge?.qrCodeImage || pixMethod?.qrCodeImage || null;

    const { error: insertError } = await serviceClient.from("deposits").insert({
      user_id: user.id,
      kid_id: kidId,
      valor,
      status: "pendente",
      external_id: externalId,
      gateway_transaction_id: transactionId,
      pix_copy_paste: pixCode,
      pix_qrcode: qrCodeUrl,
    });

    if (insertError) {
      console.error("DB Insert Error:", insertError);
      return jsonError(500, "Erro ao registrar depósito");
    }

    return new Response(
      JSON.stringify({
        ok: true,
        external_id: externalId,
        pix_code: pixCode,
        qrcode_url: qrCodeUrl,
        transaction_id: transactionId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Unexpected Error:", err);
    return jsonError(500, "Erro interno");
  }
});
