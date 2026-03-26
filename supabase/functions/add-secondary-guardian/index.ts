import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type AddGuardianBody = {
  nome?: string;
  email?: string;
  cpf?: string | null;
  telefone?: string | null;
  parentesco?: string;
  senha?: string | null;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "Não autenticado" }), {
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
      return new Response(JSON.stringify({ success: false, error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as AddGuardianBody;
    const nome = body?.nome?.trim();
    const email = body?.email?.trim().toLowerCase();
    const cpf = body?.cpf?.trim() || null;
    const telefone = body?.telefone?.trim() || null;
    const parentesco = body?.parentesco?.trim() || "outros";
    const senha = body?.senha?.trim() || null;

    if (!nome || !email) {
      return new Response(JSON.stringify({ success: false, error: "Nome e e-mail são obrigatórios." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (senha && senha.length < 6) {
      return new Response(JSON.stringify({ success: false, error: "A senha deve ter pelo menos 6 caracteres." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: familyLink, error: familyError } = await serviceClient
      .from("secondary_guardians")
      .select("primary_user_id")
      .eq("secondary_user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (familyError) throw familyError;

    const familyOwnerId = familyLink?.primary_user_id ?? user.id;

    const {
      data: { users },
      error: listUsersError,
    } = await serviceClient.auth.admin.listUsers({ page: 1, perPage: 1000 });

    if (listUsersError) throw listUsersError;

    const existingAuthUser = users.find((candidate) => candidate.email?.toLowerCase() === email) ?? null;

    if (existingAuthUser?.id === familyOwnerId) {
      return new Response(JSON.stringify({ success: false, error: "Você não pode adicionar o responsável principal." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let targetUserId = existingAuthUser?.id ?? null;

    if (!targetUserId && senha) {
      const { data: createdUser, error: createError } = await serviceClient.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true,
        user_metadata: { nome },
      });

      if (createError || !createdUser.user) {
        return new Response(JSON.stringify({ success: false, error: createError?.message || "Erro ao criar responsável." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      targetUserId = createdUser.user.id;
    }

    if (targetUserId) {
      const payload: { email: string; email_confirm: true; password?: string; user_metadata: { nome: string } } = {
        email,
        email_confirm: true,
        user_metadata: { nome },
      };

      if (senha) {
        payload.password = senha;
      }

      const { error: updateAuthError } = await serviceClient.auth.admin.updateUserById(targetUserId, payload);
      if (updateAuthError) {
        return new Response(JSON.stringify({ success: false, error: updateAuthError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: existingLink, error: existingLinkError } = await serviceClient
        .from("secondary_guardians")
        .select("id")
        .eq("primary_user_id", familyOwnerId)
        .eq("secondary_user_id", targetUserId)
        .limit(1)
        .maybeSingle();

      if (existingLinkError) throw existingLinkError;

      if (existingLink) {
        return new Response(JSON.stringify({ success: false, error: "Este responsável já está vinculado." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: profileError } = await serviceClient
        .from("profiles")
        .upsert({
          user_id: targetUserId,
          nome,
          email,
          telefone,
          cpf,
        }, { onConflict: "user_id" });

      if (profileError) throw profileError;

      const { error: insertLinkError } = await serviceClient
        .from("secondary_guardians")
        .insert({
          primary_user_id: familyOwnerId,
          secondary_user_id: targetUserId,
          nome,
          cpf,
          email,
          telefone,
          parentesco,
          added_by: user.id,
        });

      if (insertLinkError) throw insertLinkError;

      return new Response(JSON.stringify({ success: true, message: "Responsável vinculado com sucesso." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: pendingLink, error: pendingError } = await serviceClient
      .from("secondary_guardians")
      .select("id")
      .eq("primary_user_id", familyOwnerId)
      .eq("email", email)
      .is("secondary_user_id", null)
      .limit(1)
      .maybeSingle();

    if (pendingError) throw pendingError;

    if (pendingLink) {
      return new Response(JSON.stringify({ success: false, error: "Já existe um convite pendente para este e-mail." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: inviteError } = await serviceClient
      .from("secondary_guardians")
      .insert({
        primary_user_id: familyOwnerId,
        secondary_user_id: null,
        nome,
        cpf,
        email,
        telefone,
        parentesco,
        added_by: user.id,
      });

    if (inviteError) throw inviteError;

    return new Response(JSON.stringify({ success: true, message: "Responsável adicionado." }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("add-secondary-guardian error:", error);
    return new Response(JSON.stringify({ success: false, error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
