import { expect, test } from "../../playwright-fixture";

const SUPABASE_AUTH_STORAGE_KEY = "sb-ylmrmidgxhcthwmoebzl-auth-token";
const SUPABASE_URL_PATTERN = "https://*.supabase.co/**";

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

test.describe("adult finance flows", () => {
  test("generates a Pix deposit and reaches the confirmed step", async ({ page }) => {
    let depositStatusChecks = 0;

    await page.addInitScript(([storageKey, session]) => {
      window.localStorage.setItem(storageKey, JSON.stringify(session));
    }, [SUPABASE_AUTH_STORAGE_KEY, parentSession] as const);

    await page.route(SUPABASE_URL_PATTERN, async (route) => {
      const url = new URL(route.request().url());
      const pathname = url.pathname;

      if (pathname.endsWith("/auth/v1/user")) {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(parentSession.user) });
        return;
      }

      if (pathname.endsWith("/rest/v1/platform_settings")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            { key: "taxa_fixa_api", value: "1.50" },
            { key: "taxa_servico_percent", value: "2" },
          ]),
        });
        return;
      }

      if (pathname.endsWith("/rest/v1/user_custom_fees")) {
        await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
        return;
      }

      if (pathname.endsWith("/rest/v1/profiles")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ cpf: "12345678901" }),
        });
        return;
      }

      if (pathname.endsWith("/functions/v1/asaas-pix")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            external_id: "dep-1",
            pix_code: "000201pixcode",
            qrcode_url: "",
            transaction_id: "tx-1",
          }),
        });
        return;
      }

      if (pathname.endsWith("/rest/v1/deposits")) {
        depositStatusChecks += 1;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: depositStatusChecks >= 1 ? "confirmado" : "pendente" }),
        });
        return;
      }

      await route.continue();
    });

    await page.goto("/depositar");
    await page.getByPlaceholder("0,00").fill("10");

    await expect(page.getByText("R$ 11.70")).toBeVisible();
    await page.getByRole("button", { name: /Gerar QR Code Pix/i }).click();

    await expect(page.getByText(/Aguardando pagamento/i)).toBeVisible();
    await expect(page.getByText(/Depósito confirmado!/i)).toBeVisible({ timeout: 7000 });
  });

  test("requests a withdrawal with a registered Pix key", async ({ page }) => {
    await page.addInitScript(([storageKey, session]) => {
      window.localStorage.setItem(storageKey, JSON.stringify(session));
    }, [SUPABASE_AUTH_STORAGE_KEY, parentSession] as const);

    await page.route(SUPABASE_URL_PATTERN, async (route) => {
      const url = new URL(route.request().url());
      const pathname = url.pathname;

      if (pathname.endsWith("/auth/v1/user")) {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(parentSession.user) });
        return;
      }

      if (pathname.endsWith("/rest/v1/profiles")) {
        const select = url.searchParams.get("select") || "";
        if (select.includes("saldo")) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ saldo: 80 }),
          });
          return;
        }

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ chave_pix: "11999999999" }),
        });
        return;
      }

      if (pathname.endsWith("/functions/v1/asaas-pixout")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            external_id: "wd-1",
            transaction_id: "tr-1",
            status: "PENDING",
          }),
        });
        return;
      }

      await route.continue();
    });

    await page.goto("/sacar");
    await expect(page.getByText("11999999999")).toBeVisible();
    await page.getByPlaceholder("0,00").fill("30");
    await page.getByRole("button", { name: /Solicitar Saque/i }).click();

    await expect(page.getByText(/Saque solicitado!/i)).toBeVisible();
    await expect(page.getByText("R$ 30.00")).toBeVisible();
  });
});
