import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Payload = {
  email?: string;
  password?: string;
  nome?: string;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as Payload;
    const targetEmail = body.email?.trim().toLowerCase();
    const tempPassword = body.password?.trim();
    const fallbackName = body.nome?.trim() || "Responsável adicional";

    if (!targetEmail || !tempPassword) {
      return new Response(JSON.stringify({ ok: false, error: "Email e senha são obrigatórios." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: invite, error: inviteError } = await serviceClient
      .from("secondary_guardians")
      .select("id, primary_user_id, nome, telefone, cpf, email")
      .eq("email", targetEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (inviteError) throw inviteError;

    if (!invite?.id) {
      return new Response(JSON.stringify({ ok: false, error: "Convite pendente não encontrado." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: existingProfile, error: profileLookupError } = await serviceClient
      .from("profiles")
      .select("user_id")
      .eq("email", targetEmail)
      .limit(1)
      .maybeSingle();

    if (profileLookupError) throw profileLookupError;

    let userId = existingProfile?.user_id ?? null;

    if (userId) {
      const { error: updateUserError } = await serviceClient.auth.admin.updateUserById(userId, {
        email: targetEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          nome: invite.nome || fallbackName,
          cpf: invite.cpf || undefined,
          telefone: invite.telefone || undefined,
        },
      });

      if (updateUserError?.message?.toLowerCase().includes("user")) {
        userId = null;
      } else if (updateUserError) {
        throw updateUserError;
      }
    }

    if (!userId) {
      const { data: createdUser, error: createUserError } = await serviceClient.auth.admin.createUser({
        email: targetEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          nome: invite.nome || fallbackName,
          cpf: invite.cpf || undefined,
          telefone: invite.telefone || undefined,
        },
      });

      if (createUserError) throw createUserError;
      userId = createdUser.user?.id ?? null;
    }

    if (!userId) {
      throw new Error("Não foi possível determinar o usuário de autenticação.");
    }

    const { error: upsertProfileError } = await serviceClient
      .from("profiles")
      .upsert({
        user_id: userId,
        nome: invite.nome || fallbackName,
        email: targetEmail,
        telefone: invite.telefone,
        cpf: invite.cpf,
      }, { onConflict: "user_id" });

    if (upsertProfileError) throw upsertProfileError;

    const { error: linkError } = await serviceClient
      .from("secondary_guardians")
      .update({
        secondary_user_id: userId,
        nome: invite.nome,
        telefone: invite.telefone,
        cpf: invite.cpf,
      })
      .eq("id", invite.id);

    if (linkError) throw linkError;

    return new Response(JSON.stringify({
      ok: true,
      email: targetEmail,
      password: tempPassword,
      user_id: userId,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("restore-secondary-guardian-access error:", error);
    return new Response(JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : "Erro interno",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
