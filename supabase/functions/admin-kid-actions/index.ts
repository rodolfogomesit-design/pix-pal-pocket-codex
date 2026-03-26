import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ActionBody =
  | { action: "transactions"; kidId: string; limit?: number }
  | { action: "freeze"; kidId: string; freeze: boolean }
  | { action: "delete"; kidId: string }
  | { action: "adjust-balance"; kidId: string; value: number; description?: string }
  | { action: "update-profile"; kidId: string; nome: string; apelido?: string | null; idade: number };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ ok: false, error: "Não autenticado" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return json({ ok: false, error: "Não autenticado" }, 401);

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: isAdmin, error: roleError } = await serviceClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (roleError || !isAdmin) return json({ ok: false, error: "Sem permissão" }, 403);

    const body = (await req.json()) as ActionBody;
    if (!body?.action || !body?.kidId) return json({ ok: false, error: "Parâmetros inválidos" }, 400);

    if (body.action === "transactions") {
      const limit = body.limit ?? 50;
      const { data: txData, error } = await serviceClient
        .from("transactions")
        .select(`
          id, tipo, valor, descricao, status, created_at, from_user, from_kid, to_kid,
          profiles!transactions_from_user_fkey(nome),
          from_kid_profile:kids_profiles!transactions_from_kid_fkey(nome),
          to_kid_profile:kids_profiles!transactions_to_kid_fkey(nome)
        `)
        .or(`from_kid.eq.${body.kidId},to_kid.eq.${body.kidId}`)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) return json({ ok: false, error: error.message }, 400);

      const transactions = (txData || []).map((tx: any) => ({
        id: tx.id,
        tipo: tx.tipo,
        valor: tx.valor,
        descricao: tx.descricao,
        status: tx.status,
        created_at: tx.created_at,
        from_user: tx.from_user,
        from_kid: tx.from_kid,
        to_kid: tx.to_kid,
        from_user_nome: tx.profiles?.nome || "",
        from_kid_nome: tx.from_kid_profile?.nome || "",
        to_kid_nome: tx.to_kid_profile?.nome || "",
      }));

      const { data: depositData, error: depositError } = await serviceClient
        .from("deposits")
        .select(`
          id, valor, status, created_at, profiles!deposits_user_id_fkey(nome)
        `)
        .eq("kid_id", body.kidId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (depositError) return json({ ok: false, error: depositError.message }, 400);

      const deposits = (depositData || []).map((deposit: any) => ({
        id: `deposit-${deposit.id}`,
        tipo: "deposito",
        valor: deposit.valor,
        descricao: "Deposito para a crianca",
        status: deposit.status,
        created_at: deposit.created_at,
        from_user: null,
        from_kid: null,
        to_kid: body.kidId,
        from_user_nome: deposit.profiles?.nome || "",
        from_kid_nome: "",
        to_kid_nome: "",
      }));

      const { data: commissionData, error: commissionError } = await serviceClient
        .from("referral_commissions")
        .select("id, valor_comissao, valor_deposito, taxa_percentual, status, created_at")
        .eq("referrer_kid_id", body.kidId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (commissionError) return json({ ok: false, error: commissionError.message }, 400);

      const commissions = (commissionData || []).map((commission: any) => ({
        id: `commission-${commission.id}`,
        tipo: "comissao",
        valor: commission.valor_comissao,
        descricao: `Comissao ${commission.taxa_percentual}% sobre deposito de R$ ${Number(commission.valor_deposito).toFixed(2)}`,
        status: commission.status,
        created_at: commission.created_at,
        from_user: null,
        from_kid: null,
        to_kid: body.kidId,
        from_user_nome: "",
        from_kid_nome: "",
        to_kid_nome: "",
      }));

      const mergedTransactions = [...transactions, ...deposits, ...commissions]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);

      return json({ ok: true, transactions: mergedTransactions });
    }

    if (body.action === "freeze") {
      const { error } = await serviceClient
        .from("kids_profiles")
        .update({ is_frozen: body.freeze })
        .eq("id", body.kidId);

      if (error) return json({ ok: false, error: error.message }, 400);
      return json({ ok: true });
    }

    if (body.action === "adjust-balance") {
      const { data: kid, error: kidError } = await serviceClient
        .from("kids_profiles")
        .select("id, saldo")
        .eq("id", body.kidId)
        .single();

      if (kidError || !kid) return json({ ok: false, error: "Criança não encontrada" }, 404);

      const newBalance = Number(kid.saldo) + Number(body.value);
      const { error: updateError } = await serviceClient
        .from("kids_profiles")
        .update({ saldo: newBalance })
        .eq("id", body.kidId);

      if (updateError) return json({ ok: false, error: updateError.message }, 400);

      const txPayload =
        body.value >= 0
          ? { tipo: "transferencia", to_kid: body.kidId, valor: Math.abs(body.value), descricao: body.description || "Ajuste administrativo", status: "aprovado" }
          : { tipo: "transferencia", from_kid: body.kidId, valor: Math.abs(body.value), descricao: body.description || "Ajuste administrativo", status: "aprovado" };

      const { error: txError } = await serviceClient.from("transactions").insert(txPayload);
      if (txError) return json({ ok: false, error: txError.message }, 400);

      return json({ ok: true, newBalance });
    }

    if (body.action === "update-profile") {
      const { error } = await serviceClient
        .from("kids_profiles")
        .update({
          nome: body.nome,
          apelido: body.apelido || null,
          idade: body.idade,
        })
        .eq("id", body.kidId);

      if (error) return json({ ok: false, error: error.message }, 400);
      return json({ ok: true });
    }

    if (body.action === "delete") {
      const { data: kid, error: kidError } = await serviceClient
        .from("kids_profiles")
        .select("id, saldo, saldo_poupanca, saldo_comissao")
        .eq("id", body.kidId)
        .single();

      if (kidError || !kid) return json({ ok: false, error: "Criança não encontrada" }, 404);

      if (Number(kid.saldo) > 0 || Number(kid.saldo_poupanca) > 0 || Number(kid.saldo_comissao) > 0) {
        return json({ ok: false, error: "A criança ainda possui saldo. Zere os saldos antes de excluir." }, 400);
      }

      await serviceClient.from("referral_commissions").delete().eq("referrer_kid_id", body.kidId);
      await serviceClient.from("referrals").delete().eq("referrer_kid_id", body.kidId);
      await serviceClient.from("chat_messages").delete().eq("kid_id", body.kidId);
      await serviceClient.from("chat_read_status").delete().eq("kid_id", body.kidId);
      await serviceClient.from("savings_goals").delete().eq("kid_id", body.kidId);
      await serviceClient.from("deposits").delete().eq("kid_id", body.kidId);

      const { error: txDeleteError } = await serviceClient
        .from("transactions")
        .delete()
        .or(`from_kid.eq.${body.kidId},to_kid.eq.${body.kidId}`);
      if (txDeleteError) return json({ ok: false, error: txDeleteError.message }, 400);

      const { error: kidDeleteError } = await serviceClient.from("kids_profiles").delete().eq("id", body.kidId);
      if (kidDeleteError) return json({ ok: false, error: kidDeleteError.message }, 400);

      return json({ ok: true });
    }

    return json({ ok: false, error: "Ação inválida" }, 400);
  } catch (error) {
    console.error("admin-kid-actions error:", error);
    return json({ ok: false, error: "Erro interno" }, 500);
  }
});
