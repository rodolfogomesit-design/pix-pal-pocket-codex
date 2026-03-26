import { expect, test } from "../../playwright-fixture";

const SUPABASE_AUTH_STORAGE_KEY = "sb-ylmrmidgxhcthwmoebzl-auth-token";

const parentSession = {
  access_token: "test-access-token",
  refresh_token: "test-refresh-token",
  expires_in: 3600,
  expires_at: 4102444800,
  token_type: "bearer",
  user: {
    id: "parent-1",
    aud: "authenticated",
    role: "authenticated",
    email: "maria@example.com",
    app_metadata: {
      provider: "email",
      providers: ["email"],
    },
    user_metadata: {},
    identities: [],
    created_at: "2026-03-20T00:00:00.000Z",
  },
};

test.describe("configuracoes report", () => {
  test("includes deposits and withdrawals in the responsible report", async ({ page }) => {
    await page.addInitScript(([storageKey, session]) => {
      window.localStorage.setItem(storageKey, JSON.stringify(session));

      (window as Window & { __printedHtml?: string }).__printedHtml = "";
      window.open = (() => {
        const fakeWindow = {
          document: {
            write: (html: string) => {
              (window as Window & { __printedHtml?: string }).__printedHtml = html;
            },
            close: () => undefined,
          },
          print: () => undefined,
        };

        return () => fakeWindow as unknown as Window;
      })();
    }, [SUPABASE_AUTH_STORAGE_KEY, parentSession] as const);

    await page.route("https://*.supabase.co/**", async (route) => {
      const url = new URL(route.request().url());
      const pathname = url.pathname;
      const select = url.searchParams.get("select") || "";

      if (pathname.endsWith("/auth/v1/user")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(parentSession.user),
        });
        return;
      }

      if (pathname.endsWith("/rest/v1/platform_settings")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            { key: "limite_deposito", value: "200" },
            { key: "limite_diario_padrao", value: "100" },
            { key: "limite_pix", value: "50" },
            { key: "limite_transferencia", value: "25" },
            { key: "mini_gerente_taxa", value: "1.5" },
          ]),
        });
        return;
      }

      if (pathname.endsWith("/rest/v1/user_custom_fees")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: "[]",
        });
        return;
      }

      if (pathname.endsWith("/rest/v1/secondary_guardians")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: "null",
        });
        return;
      }

      if (pathname.endsWith("/rest/v1/kids_profiles")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "kid-1",
              user_responsavel: "parent-1",
              nome: "Joana Silva",
              apelido: "Juju",
              idade: 9,
              codigo_publico: "12345",
              saldo: 20,
              pin: "1234",
              is_frozen: false,
              limite_diario: 50,
              aprovacao_transferencias: false,
              bloqueio_envio: false,
              created_at: "2026-03-20T00:00:00.000Z",
              updated_at: "2026-03-20T00:00:00.000Z",
            },
          ]),
        });
        return;
      }

      if (pathname.endsWith("/rest/v1/profiles") && select.includes("nome,codigo_usuario")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ nome: "Maria Silva", codigo_usuario: "ABC123" }),
        });
        return;
      }

      if (pathname.endsWith("/rest/v1/profiles") && select.includes("limite_diario,limite_deposito,chave_pix")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ limite_diario: 100, limite_deposito: 200, chave_pix: "11999999999" }),
        });
        return;
      }

      if (pathname.endsWith("/rest/v1/transactions")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              created_at: "2026-03-20T10:00:00.000Z",
              tipo: "mesada",
              valor: 20,
              status: "aprovado",
              descricao: "Mesada semanal",
            },
          ]),
        });
        return;
      }

      if (pathname.endsWith("/rest/v1/deposits")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              created_at: "2026-03-19T10:00:00.000Z",
              valor: 15,
              status: "confirmado",
            },
          ]),
        });
        return;
      }

      if (pathname.endsWith("/rest/v1/withdrawals")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              created_at: "2026-03-18T10:00:00.000Z",
              valor: 7,
              status: "confirmado",
            },
          ]),
        });
        return;
      }

      if (pathname.endsWith("/rest/v1/referral_commissions")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: "[]",
        });
        return;
      }

      await route.continue();
    });

    await page.goto("/configuracoes");

    const dateInputs = page.locator('input[type="date"]');
    await dateInputs.nth(0).fill("2026-03-18");
    await dateInputs.nth(1).fill("2026-03-20");
    await page.getByRole("button", { name: "Gerar PDF" }).click();

    await expect
      .poll(async () => page.evaluate(() => (window as Window & { __printedHtml?: string }).__printedHtml || ""))
      .toContain("Deposito via Pix");

    const printedHtml = await page.evaluate(() => (window as Window & { __printedHtml?: string }).__printedHtml || "");
    expect(printedHtml).toContain("Saque via Pix");
    expect(printedHtml).toContain("Total de transacoes:</strong> 3");
    expect(printedHtml).toContain("Total de entradas:</strong> R$ 35.00");
    expect(printedHtml).toContain("Total de saidas:</strong> R$ 7.00");
  });
});
