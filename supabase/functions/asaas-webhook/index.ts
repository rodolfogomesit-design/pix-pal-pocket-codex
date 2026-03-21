import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") return new Response("Forbidden", { status: 403 });

    const asaasToken = req.headers.get("asaas-access-token");
    const secret = Deno.env.get("ASAAS_WEBHOOK_SECRET");

    if (!secret || asaasToken !== secret) {
      console.error("Webhook: Missing or invalid secret token");
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    console.log("Asaas Webhook received:", JSON.stringify(body));

    const event = body.event;
    const payment = body.payment;

    if (!payment) return new Response("Invalid request", { status: 400 });

    const externalReference = payment.externalReference;
    if (!externalReference) return new Response("OK: No ref", { status: 200 });

    const targetEvents = ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"];

    if (targetEvents.includes(event)) {
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const { error } = await serviceClient.rpc("confirm_deposit_by_external_id", {
        p_external_id: externalReference,
      });

      if (error) {
        console.error("Webhook RPC error:", error);
        return new Response("Error", { status: 500 });
      }
      console.log(`Deposit confirmed: ${externalReference}`);
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook crash:", err);
    return new Response("Error", { status: 500 });
  }
});
