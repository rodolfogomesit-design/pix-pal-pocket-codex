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
};

const json = (status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const normalizeEmail = (value?: string | null) => value?.trim().toLowerCase() ?? "";
const normalizeCpf = (value?: string | null) => value?.replace(/\D/g, "") ?? "";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json(401, { success: false, error: "Nao autenticado." });
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
      return json(401, { success: false, error: "Nao autenticado." });
    }

    const body = (await req.json()) as AddGuardianBody;
    const nome = body.nome?.trim() ?? "";
    const email = normalizeEmail(body.email);
    const cpf = body.cpf?.trim() ?? "";
    const cpfDigits = normalizeCpf(body.cpf);
    const telefone = body.telefone?.trim() ?? "";
    const parentesco = body.parentesco?.trim() || "outros";

    if (!nome || !email || !cpf || !telefone) {
      return json(400, {
        success: false,
        error: "Nome, e-mail, CPF e telefone sao obrigatorios.",
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

    const { data: existingProfile, error: existingProfileError } = await serviceClient
      .from("profiles")
      .select("user_id, email, cpf")
      .or(`email.eq.${email},cpf.eq.${cpf}`)
      .limit(1)
      .maybeSingle();

    if (existingProfileError) throw existingProfileError;

    let targetUserId = existingProfile?.user_id ?? null;

    if (!targetUserId) {
      const {
        data: { users },
        error: listUsersError,
      } = await serviceClient.auth.admin.listUsers({ page: 1, perPage: 1000 });

      if (listUsersError) {
        return json(400, {
          success: false,
          error: listUsersError.message,
        });
      }

      const existingAuthUser = users.find((candidate) => candidate.email?.toLowerCase() === email) ?? null;
      targetUserId = existingAuthUser?.id ?? null;
    }

    if (targetUserId === familyOwnerId) {
      return json(400, {
        success: false,
        error: "Voce nao pode adicionar o responsavel principal como adicional.",
      });
    }

    if (!targetUserId && cpfDigits) {
      const { data: cpfProfile, error: cpfProfileError } = await serviceClient
        .from("profiles")
        .select("user_id")
        .eq("cpf", cpfDigits)
        .limit(1)
        .maybeSingle();

      if (cpfProfileError) throw cpfProfileError;
      targetUserId = cpfProfile?.user_id ?? null;
    }

    if (!targetUserId) {
      const { data: pendingLink, error: pendingLinkError } = await serviceClient
        .from("secondary_guardians")
        .select("id")
        .eq("primary_user_id", familyOwnerId)
        .is("secondary_user_id", null)
        .eq("email", email)
        .limit(1)
        .maybeSingle();

      if (pendingLinkError) throw pendingLinkError;

      if (pendingLink) {
        return json(400, {
          success: false,
          error: "Ja existe um convite pendente para este e-mail.",
        });
      }

      const { error: inviteError } = await serviceClient.from("secondary_guardians").insert({
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

      return json(200, {
        success: true,
        message: "Convite salvo. Quando esse responsavel criar a conta com este e-mail, ele sera vinculado automaticamente.",
      });
    }

    const { data: linkedElsewhere, error: linkedElsewhereError } = await serviceClient
      .from("secondary_guardians")
      .select("id, primary_user_id")
      .eq("secondary_user_id", targetUserId)
      .neq("primary_user_id", familyOwnerId)
      .limit(1)
      .maybeSingle();

    if (linkedElsewhereError) throw linkedElsewhereError;

    if (linkedElsewhere) {
      return json(400, {
        success: false,
        error: "Este responsavel ja esta vinculado a outra familia.",
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
      return json(400, {
        success: false,
        error: "Este responsavel ja esta vinculado a esta familia.",
      });
    }

    const { error: profileError } = await serviceClient
      .from("profiles")
      .upsert(
        {
          user_id: targetUserId,
          nome,
          email,
          telefone,
          cpf,
        },
        { onConflict: "user_id" },
      );

    if (profileError) throw profileError;

    const { error: linkError } = await serviceClient.from("secondary_guardians").insert({
      primary_user_id: familyOwnerId,
      secondary_user_id: targetUserId,
      nome,
      cpf,
      email,
      telefone,
      parentesco,
      added_by: user.id,
    });

    if (linkError) throw linkError;

    return json(200, {
      success: true,
      message: "Responsavel adicional vinculado com sucesso.",
    });
  } catch (error) {
    console.error("add-secondary-guardian error:", error);
    return json(500, {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno",
    });
  }
});
