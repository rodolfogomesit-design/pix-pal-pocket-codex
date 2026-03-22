import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const AS_API_KEY = Deno.env.get("ASAAS_API_KEY");
const AS_API_URL = Deno.env.get("ASAAS_API_URL") || "https://api.asaas.com/v3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(status: number, payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function jsonError(status: number, message: string) {
  const responseStatus = status >= 500 ? 200 : status;
  return jsonResponse(responseStatus, { ok: false, error: message, status });
}

function normalizePixKey(rawKey: string) {
  const value = rawKey.trim();
  const digits = value.replace(/\D/g, "");
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
  const evpRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (emailRegex.test(value)) {
    return { key: value.toLowerCase(), type: "EMAIL" };
  }

  if (evpRegex.test(value)) {
    return { key: value, type: "EVP" };
  }

  if (digits.length === 11) {
    if (digits.startsWith("0")) {
      return { key: digits, type: "CPF" };
    }
    return { key: digits, type: "PHONE" };
  }

  if (digits.length === 13 && digits.startsWith("55")) {
    return { key: digits.slice(2), type: "PHONE" };
  }

  if (digits.length === 14) {
    return { key: digits, type: "CNPJ" };
  }

  throw new Error("Formato da chave Pix não reconhecido");
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
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return jsonError(401, "Erro de autenticação");

    const body = await req.json();
    const valor = parseFloat(body?.valor ?? "0");
    if (!valor || valor <= 0) return jsonError(400, "Valor inválido");

    const { data: profile } = await supabase
      .from("profiles")
      .select("nome, chave_pix, saldo")
      .eq("user_id", user.id)
      .single();

    if (!profile) return jsonError(404, "Perfil não encontrado");
    if (!profile.chave_pix?.trim()) {
      return jsonError(400, "Chave Pix não cadastrada. Atualize seu perfil.");
    }
    if ((profile.saldo ?? 0) < valor) {
      return jsonError(400, "Saldo insuficiente");
    }

    let pixKey: { key: string; type: string };
    try {
      pixKey = normalizePixKey(profile.chave_pix);
    } catch (error) {
      return jsonError(400, error instanceof Error ? error.message : "Chave Pix inválida");
    }

    const externalId = `wd_${Date.now()}_${user.id.slice(0, 8)}`;

    const transferPayload = {
      value: valor,
      pixAddressKey: pixKey.key,
      pixAddressKeyType: pixKey.type,
      scheduleDate: null,
      description: `Saque Pix Kids - ${profile.nome}`,
      externalReference: externalId,
    };

    const transferRes = await fetch(`${AS_API_URL}/transfers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: AS_API_KEY,
      },
      body: JSON.stringify(transferPayload),
    });

    const transferJson = await transferRes.json();
    if (!transferRes.ok || !transferJson?.id) {
      console.error("Asaas Transfer Error:", transferJson, transferPayload);
      const firstError =
        transferJson?.errors?.[0]?.description || transferJson?.message || JSON.stringify(transferJson);
      return jsonError(500, `Erro Asaas: ${firstError}`);
    }

    const finalizeResult = await supabase.rpc("create_gateway_withdrawal", {
      _valor: valor,
      _chave_pix: profile.chave_pix,
      _external_id: externalId,
      _gateway: "asaas",
      _gateway_transaction_id: transferJson.id,
      _status: transferJson.status || "PENDING",
      _transaction_receipt_url: transferJson.transactionReceiptUrl ?? null,
      _end_to_end_identifier: transferJson.endToEndIdentifier ?? null,
      _fail_reason: transferJson.failReason ?? null,
      _gateway_payload: transferJson,
    });

    if (finalizeResult.error || !finalizeResult.data?.success) {
      console.error("Finalize withdrawal error:", finalizeResult.error, finalizeResult.data);
      return jsonError(
        500,
        "Transferência criada no gateway, mas houve falha ao registrar o saque. Verifique o painel admin."
      );
    }

    return jsonResponse(200, {
      ok: true,
      external_id: externalId,
      transaction_id: transferJson.id,
      status: transferJson.status || "PENDING",
      transaction_receipt_url: transferJson.transactionReceiptUrl ?? null,
      end_to_end_identifier: transferJson.endToEndIdentifier ?? null,
    });
  } catch (err) {
    console.error("Unexpected Error:", err);
    return jsonError(500, "Erro interno");
  }
});
