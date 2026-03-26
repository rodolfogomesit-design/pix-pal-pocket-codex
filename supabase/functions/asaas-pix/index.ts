import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const AS_API_KEY = Deno.env.get("ASAAS_API_KEY");
const AS_API_URL = Deno.env.get("ASAAS_API_URL") || "https://api.asaas.com/v3";

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!AS_API_KEY) return jsonError(500, "ASAAS_API_KEY não configurada.");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonError(401, "Sessão expirada. Faça login novamente.");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
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

    const { data: profile } = await serviceClient
      .from("profiles")
      .select("id, nome, email, cpf, telefone")
      .eq("user_id", user.id)
      .single();

    if (!profile) return jsonError(404, "Perfil não encontrado");
    if (!profile.cpf) {
      return jsonError(400, "CPF não cadastrado no perfil. Atualize seu perfil primeiro.");
    }

    const cpfClean = profile.cpf.replace(/\D/g, "");
    let asaasCustomerId: string | null = null;

    const searchRes = await fetch(`${AS_API_URL}/customers?cpfCnpj=${cpfClean}`, {
      method: "GET",
      headers: { access_token: AS_API_KEY },
    });

    if (searchRes.ok) {
      const searchJson = await searchRes.json();
      if (searchJson.data?.length > 0) {
        asaasCustomerId = searchJson.data[0].id;
      }
    }

    if (!asaasCustomerId) {
      const customerRes = await fetch(`${AS_API_URL}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", access_token: AS_API_KEY },
        body: JSON.stringify({
          name: profile.nome,
          cpfCnpj: cpfClean,
          email: profile.email,
          mobilePhone: profile.telefone?.replace(/\D/g, "") || undefined,
          externalReference: user.id,
        }),
      });

      const customerJson = await customerRes.json();
      asaasCustomerId = customerJson.id || null;

      if (!asaasCustomerId) {
        console.error("Asaas Customer Error:", customerJson);
        const firstError = customerJson.errors?.[0]?.description || JSON.stringify(customerJson);
        return jsonError(500, `Erro Asaas: ${firstError}`);
      }
    }

    const externalId = `dep_${Date.now()}_${user.id.slice(0, 8)}`;

    const paymentRes = await fetch(`${AS_API_URL}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", access_token: AS_API_KEY },
      body: JSON.stringify({
        customer: asaasCustomerId,
        billingType: "PIX",
        value: valor,
        dueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        externalReference: externalId,
        description: "Depósito Pix Kids",
      }),
    });

    const paymentJson = await paymentRes.json();
    if (!paymentRes.ok) {
      console.error("Asaas Payment Error:", paymentJson);
      const firstError = paymentJson.errors?.[0]?.description || JSON.stringify(paymentJson);
      return jsonError(500, `Erro Asaas: ${firstError}`);
    }

    const paymentId = paymentJson.id;

    const qrcodeRes = await fetch(`${AS_API_URL}/payments/${paymentId}/pixQrCode`, {
      method: "GET",
      headers: { access_token: AS_API_KEY },
    });
    const qrcodeJson = await qrcodeRes.json();

    if (!qrcodeRes.ok) {
      console.error("Asaas QR Code Error:", qrcodeJson);
      return jsonError(500, "Erro ao obter QR Code");
    }

    const { error: insertError } = await serviceClient.from("deposits").insert({
      user_id: user.id,
      kid_id: kidId,
      valor,
      status: "pendente",
      external_id: externalId,
      gateway_transaction_id: paymentId,
      pix_copy_paste: qrcodeJson.payload,
      pix_qrcode: qrcodeJson.encodedImage,
    });

    if (insertError) {
      console.error("DB Insert Error:", insertError);
      return jsonError(500, "Erro ao registrar depósito");
    }

    return new Response(
      JSON.stringify({
        ok: true,
        external_id: externalId,
        pix_code: qrcodeJson.payload,
        qrcode_url: `data:image/png;base64,${qrcodeJson.encodedImage}`,
        transaction_id: paymentId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Unexpected Error:", err);
    return jsonError(500, "Erro interno");
  }
});
