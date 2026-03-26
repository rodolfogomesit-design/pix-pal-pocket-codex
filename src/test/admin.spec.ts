import { expect, test } from "../../playwright-fixture";

const SUPABASE_AUTH_STORAGE_KEY = "sb-ylmrmidgxhcthwmoebzl-auth-token";
const SUPABASE_URL_PATTERN = "https://*.supabase.co/**";

const adminSession = {
  access_token: "admin-access-token",
  refresh_token: "admin-refresh-token",
  expires_in: 3600,
  expires_at: 4102444800,
  token_type: "bearer",
  user: {
    id: "admin-user-1",
    aud: "authenticated",
    role: "authenticated",
    email: "pixkids@gmail.com",
    app_metadata: {
      provider: "email",
      providers: ["email"],
    },
    user_metadata: {},
    identities: [],
    created_at: "2026-03-20T00:00:00.000Z",
  },
};

test.describe("admin flows", () => {
  test("renders user management, child actions, and transaction filters", async ({ page }) => {
    await page.addInitScript(([storageKey, session]) => {
      window.localStorage.setItem(storageKey, JSON.stringify(session));
    }, [SUPABASE_AUTH_STORAGE_KEY, adminSession] as const);

    await page.route(SUPABASE_URL_PATTERN, async (route) => {
      const url = new URL(route.request().url());
      const pathname = url.pathname;
      const search = url.searchParams;

      if (pathname.endsWith("/auth/v1/user")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(adminSession.user),
        });
        return;
      }

      if (pathname.endsWith("/rest/v1/user_roles")) {
        const requestedUserId = search.get("user_id") || route.request().url();
        const isCurrentAdmin = requestedUserId.includes(adminSession.user.id);
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: isCurrentAdmin ? JSON.stringify({ role: "admin" }) : "null",
        });
        return;
      }

      if (pathname.endsWith("/rest/v1/platform_settings")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            { id: "1", key: "taxa_fixa_api", value: "1.50", label: "Taxa fixa API" },
            { id: "2", key: "taxa_servico_percent", value: "2", label: "Taxa de serviço (%)" },
            { id: "3", key: "limite_diario_padrao", value: "50", label: "Limite diário padrão" },
            { id: "4", key: "limite_transferencia", value: "200", label: "Limite transferência" },
            { id: "5", key: "limite_pix", value: "500", label: "Limite Pix" },
            { id: "6", key: "limite_deposito", value: "1000", label: "Limite depósito" },
            { id: "7", key: "idade_minima", value: "6", label: "Idade mínima" },
            { id: "8", key: "termos_uso", value: "Termos", label: "Termos de uso" },
            { id: "9", key: "politica_privacidade", value: "Privacidade", label: "Política de privacidade" },
          ]),
        });
        return;
      }

      if (pathname.endsWith("/rest/v1/profiles")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            is_blocked: false,
            limite_diario: 100,
            limite_deposito: 300,
            cpf: "742.239.503-63",
            chave_pix: "pixkids@gmail.com",
          }),
        });
        return;
      }

      if (pathname.endsWith("/functions/v1/asaas-balance")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ok: true, balance: 2500 }),
        });
        return;
      }

      if (pathname.endsWith("/functions/v1/admin-kid-actions")) {
        const payload = route.request().postDataJSON() as { action?: string };

        if (payload.action === "transactions") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ ok: true, transactions: [] }),
          });
          return;
        }

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ok: true }),
        });
        return;
      }

      if (pathname.endsWith("/functions/v1/admin-update-user-auth")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ok: true }),
        });
        return;
      }

      if (pathname.endsWith("/rest/v1/rpc/admin_get_metrics")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            total_users: 1,
            total_kids: 1,
            total_transactions: 3,
            total_balance: 8.02,
            total_volume: 100,
            pending_approvals: 0,
          }),
        });
        return;
      }

      if (pathname.endsWith("/rest/v1/rpc/admin_get_detailed_metrics")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            total_responsaveis: 1,
            total_criancas: 1,
            responsaveis_hoje: 0,
            criancas_hoje: 0,
            responsaveis_mes: 1,
            criancas_mes: 1,
            ativos_24h: 1,
            ativos_30d: 1,
            total_balance: 8.02,
          }),
        });
        return;
      }

      if (pathname.endsWith("/rest/v1/rpc/admin_get_recent_transactions")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            transactions: [
              {
                id: "tx-1",
                tipo: "deposito",
                valor: 5.07,
                descricao: "Depósito",
                status: "confirmado",
                created_at: "2026-03-25T10:00:00.000Z",
                from_user: "user-1",
                from_kid: null,
                to_kid: null,
                from_user_nome: "Rodolfo Gomes Gonçalves",
                from_kid_nome: "",
                to_kid_nome: "",
              },
              {
                id: "tx-2",
                tipo: "saque",
                valor: 3,
                descricao: "Saque",
                status: "solicitado",
                created_at: "2026-03-25T11:00:00.000Z",
                from_user: "user-1",
                from_kid: null,
                to_kid: null,
                from_user_nome: "Rodolfo Gomes Gonçalves",
                from_kid_nome: "",
                to_kid_nome: "",
              },
              {
                id: "tx-3",
                tipo: "comissao",
                valor: 1.2,
                descricao: "Comissão",
                status: "aprovado",
                created_at: "2026-03-25T12:00:00.000Z",
                from_user: null,
                from_kid: "kid-1",
                to_kid: null,
                from_user_nome: "",
                from_kid_nome: "Nicole Farias Gonçalves",
                to_kid_nome: "",
              },
            ],
          }),
        });
        return;
      }

      if (pathname.endsWith("/rest/v1/rpc/admin_search_users")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            total: 1,
            users: [
              {
                id: "profile-1",
                user_id: "user-1",
                nome: "Rodolfo Gomes Gonçalves",
                email: "pixkids@gmail.com",
                telefone: "(85) 98735-6916",
                cpf: "742.239.503-63",
                chave_pix: "pixkids@gmail.com",
                codigo_usuario: "79624",
                created_at: "2026-03-10T00:02:00.000Z",
                kids_count: 1,
                total_balance: 8.02,
              },
            ],
          }),
        });
        return;
      }

      if (pathname.endsWith("/rest/v1/rpc/admin_get_user_kids")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            kids: [
              {
                id: "kid-1",
                nome: "Nicole Farias Gonçalves",
                apelido: "Nicole",
                idade: 8,
                codigo_publico: "11223",
                saldo: 7.6,
                is_frozen: false,
                limite_diario: 500,
                limite_pix: 50,
                limite_transferencia: 100,
                aprovacao_transferencias: true,
                bloqueio_envio: false,
                created_at: "2026-03-20T00:00:00.000Z",
              },
            ],
          }),
        });
        return;
      }

      if (pathname.endsWith("/rest/v1/rpc/admin_get_user_transactions")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            transactions: [
              {
                id: "user-tx-1",
                tipo: "deposito",
                valor: 5.07,
                descricao: "Depósito",
                status: "confirmado",
                created_at: "2026-03-25T10:00:00.000Z",
                from_user: "user-1",
                from_kid: null,
                to_kid: null,
                from_user_nome: "Rodolfo Gomes Gonçalves",
                from_kid_nome: "",
                to_kid_nome: "",
              },
            ],
          }),
        });
        return;
      }

      if (
        pathname.endsWith("/rest/v1/rpc/admin_block_user") ||
        pathname.endsWith("/rest/v1/rpc/admin_toggle_admin") ||
        pathname.endsWith("/rest/v1/rpc/admin_delete_user") ||
        pathname.endsWith("/rest/v1/rpc/admin_adjust_balance") ||
        pathname.endsWith("/rest/v1/rpc/admin_update_user_profile") ||
        pathname.endsWith("/rest/v1/rpc/admin_update_user_limits") ||
        pathname.endsWith("/rest/v1/rpc/admin_update_kid_limits")
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, new_balance: 50 }),
        });
        return;
      }

      if (pathname.endsWith("/rest/v1/rpc/admin_get_user_full_history")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            deposits: [
              { id: "d-1", valor: 11.19, status: "confirmado", created_at: "2026-03-25T10:00:00.000Z", kid_nome: "Nicole" },
            ],
            withdrawals: [
              { id: "w-1", valor: 3, status: "solicitado", created_at: "2026-03-25T11:00:00.000Z", chave_pix: "pixkids@gmail.com" },
            ],
            transfers: [],
            payments: [],
            commissions: [
              { id: "c-1", kid_nome: "Nicole", valor_deposito: 120, taxa_percentual: 1, valor_comissao: 1.2, status: "aprovado", created_at: "2026-03-25T12:00:00.000Z" },
            ],
          }),
        });
        return;
      }

      await route.continue();
    });

    await page.goto("/admin");

    await page.getByRole("tab", { name: "Usuários" }).click();
    await expect(page.getByText("Todos os usuários cadastrados")).toBeVisible();
    await page.getByRole("button", { name: "Ver" }).click();

    await expect(page.getByText("Filhos cadastrados")).toBeVisible();
    await expect(page.getByText("Nicole")).toBeVisible();
    await expect(page.getByText(/Código: 11223/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Alterar Cadastro" }).first()).toBeVisible();

    await page.getByRole("button", { name: "Alterar Cadastro" }).nth(1).click();
    await expect(page.getByText("Alterar cadastro da crianca")).toBeVisible();
    await expect(page.locator('input[value="Nicole Farias Gonçalves"]')).toBeVisible();
    await expect(page.getByText("Apelido")).toHaveCount(0);
    await expect(page.getByText("Idade")).toHaveCount(0);
    await page.keyboard.press("Escape");

    await page.locator("button", { hasText: "Transacoes" }).first().click();
    await expect(page.getByText("Transacoes de Nicole")).toBeVisible();
    await expect(page.getByText("Saldo atual cadastrado")).toBeVisible();
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "Alterar Cadastro" }).first().click();
    await expect(page.getByRole("heading", { name: "Alterar Cadastro" })).toBeVisible();
    await expect(page.getByText("CPF cadastrado")).toBeVisible();
    await expect(page.getByText("Chave Pix cadastrada")).toBeVisible();
    await expect(page.getByText("Nova senha", { exact: true })).toBeVisible();
    await page.keyboard.press("Escape");

    await page.getByRole("tab", { name: "Transações" }).click();
    await expect(page.getByText("Transações recentes")).toBeVisible();

    await page.getByRole("button", { name: /Saques/i }).click();
    const recentTable = page.locator("table").last();
    await expect(recentTable.getByText("Saque", { exact: true })).toBeVisible();
    await expect(recentTable.getByText("Depósito", { exact: true })).toHaveCount(0);

    await page.getByRole("button", { name: /Comissões/i }).click();
    await expect(page.getByText("Nenhuma transação encontrada")).toHaveCount(0);
    await expect(page.getByText("R$ 1.20")).toBeVisible();
  });
});
