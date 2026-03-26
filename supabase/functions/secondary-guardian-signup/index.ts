import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type SignupBody = {
  nome?: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  password?: string;
};

const json = (status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as SignupBody;
    const email = body.email?.trim().toLowerCase() ?? "";
    const nome = body.nome?.trim() ?? "";
    const telefone = body.telefone?.trim() ?? "";
    const cpf = body.cpf?.trim() ?? "";
    const password = body.password?.trim() ?? "";

    if (!email || !nome || !telefone || !cpf || !password) {
      return json(400, { success: false, error: "Dados obrigatorios ausentes." });
    }

    if (password.length < 6) {
      return json(400, { success: false, error: "A senha deve ter pelo menos 6 caracteres." });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: pendingInvite, error: inviteError } = await serviceClient
      .from("secondary_guardians")
      .select("id, primary_user_id, nome, telefone, cpf")
      .eq("email", email)
      .is("secondary_user_id", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (inviteError) throw inviteError;

    if (!pendingInvite?.id) {
      return json(404, { success: false, error: "NO_PENDING_INVITE" });
    }

    const { data: existingProfile, error: existingProfileError } = await serviceClient
      .from("profiles")
      .select("user_id")
      .eq("email", email)
      .limit(1)
      .maybeSingle();

    if (existingProfileError) throw existingProfileError;

    if (existingProfile?.user_id) {
      const { error: updateAuthError } = await serviceClient.auth.admin.updateUserById(existingProfile.user_id, {
        email,
        password,
        email_confirm: true,
        user_metadata: { nome },
      });

      if (updateAuthError) {
        return json(400, { success: false, error: updateAuthError.message });
      }

      const { error: linkExistingError } = await serviceClient
        .from("secondary_guardians")
        .update({ secondary_user_id: existingProfile.user_id, nome, telefone, cpf })
        .eq("id", pendingInvite.id);

      if (linkExistingError) throw linkExistingError;

      return json(200, { success: true, message: "Conta existente vinculada com sucesso." });
    }

    const { data: createdUser, error: createError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome },
    });

    if (createError || !createdUser.user) {
      return json(400, { success: false, error: createError?.message || "Erro ao criar conta." });
    }

    const newUserId = createdUser.user.id;

    const { error: profileError } = await serviceClient
      .from("profiles")
      .upsert(
        {
          user_id: newUserId,
          nome,
          email,
          telefone,
          cpf,
        },
        { onConflict: "user_id" },
      );

    if (profileError) throw profileError;

    const { error: linkError } = await serviceClient
      .from("secondary_guardians")
      .update({
        secondary_user_id: newUserId,
        nome,
        telefone,
        cpf,
      })
      .eq("id", pendingInvite.id);

    if (linkError) throw linkError;

    return json(200, {
      success: true,
      message: "Conta criada e vinculada com sucesso.",
    });
  } catch (error) {
    console.error("secondary-guardian-signup error:", error);
    return json(500, {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno",
    });
  }
});
