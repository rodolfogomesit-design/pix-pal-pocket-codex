import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const textEncoder = new TextEncoder();

async function createHmacSignature(payload: string, secret: string) {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, textEncoder.encode(payload));
  const bytes = new Uint8Array(signature);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function timingSafeEqual(left?: string | null, right?: string | null) {
  if (!left || !right || left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return diff === 0;
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") return new Response("Forbidden", { status: 403 });

    const rawBody = await req.text();
    const authHeader = req.headers.get("authorization");
    const hmacHeader = req.headers.get("x-openpix-signature");
    const expectedAuthorization = Deno.env.get("WOOVI_WEBHOOK_AUTHORIZATION");
    const hmacSecret = Deno.env.get("WOOVI_WEBHOOK_HMAC_SECRET");

    if (expectedAuthorization && !timingSafeEqual(authHeader, expectedAuthorization)) {
      console.error("Woovi Webhook: invalid authorization header");
      return new Response("Unauthorized", { status: 401 });
    }

    if (hmacSecret) {
      const expectedHmac = await createHmacSignature(rawBody, hmacSecret);
      if (!timingSafeEqual(hmacHeader, expectedHmac)) {
        console.error("Woovi Webhook: invalid HMAC signature");
        return new Response("Unauthorized", { status: 401 });
      }
    }

    const body = JSON.parse(rawBody);
    const event = body?.event;
    const charge = body?.charge;
    const correlationID = charge?.correlationID;

    if (!charge || !correlationID) return new Response("Invalid request", { status: 400 });

    const completedEvents = [
      "OPENPIX:CHARGE_COMPLETED",
      "OPENPIX:CHARGE_COMPLETED_NOT_SAME_CUSTOMER_PAYER",
      "woovi:CHARGE_COMPLETED",
      "woovi:CHARGE_COMPLETED_NOT_SAME_CUSTOMER_PAYER",
    ];

    if (completedEvents.includes(event)) {
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );

      const { error } = await serviceClient.rpc("confirm_deposit_by_external_id", {
        p_external_id: correlationID,
      });

      if (error) {
        console.error("Woovi Webhook RPC error:", error);
        return new Response("Error", { status: 500 });
      }
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Woovi Webhook crash:", err);
    return new Response("Error", { status: 500 });
  }
});
