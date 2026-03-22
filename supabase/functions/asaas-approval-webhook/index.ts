import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") return new Response("Forbidden", { status: 403 });

    const body = await req.json();
    const transfer = body?.transfer;
    if (!transfer?.id) {
      return new Response(JSON.stringify({ approved: false, reason: "Transferência inválida" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: withdrawal, error } = await serviceClient
      .from("withdrawals")
      .select("id")
      .eq("gateway_transaction_id", transfer.id)
      .maybeSingle();

    if (error) {
      console.error("Approval lookup error:", error);
      return new Response(JSON.stringify({ approved: false, reason: "Erro interno" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        approved: !!withdrawal,
        reason: withdrawal ? null : "Saque não encontrado para autorização",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Approval webhook crash:", err);
    return new Response(JSON.stringify({ approved: false, reason: "Erro interno" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
