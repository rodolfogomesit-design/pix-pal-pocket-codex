import { expect, test } from "../../playwright-fixture";

const SUPABASE_URL_PATTERN = "https://*.supabase.co/**";

const authSession = {
  access_token: "auth-access-token",
  refresh_token: "auth-refresh-token",
  expires_in: 3600,
  expires_at: 4102444800,
  token_type: "bearer",
  user: {
    id: "parent-auth-1",
    aud: "authenticated",
    role: "authenticated",
    email: "ana@example.com",
    app_metadata: {
      provider: "email",
      providers: ["email"],
    },
    user_metadata: {},
    identities: [],
    created_at: "2026-03-20T00:00:00.000Z",
  },
};

test.describe("adult authentication flows", () => {
  test("creates a parent account and preserves the referral code for the first login", async ({ page }) => {
    let signupPayload: Record<string, any> | null = null;

    await page.route(SUPABASE_URL_PATTERN, async (route) => {
      const url = new URL(route.request().url());
      const pathname = url.pathname;

      if (pathname.endsWith("/auth/v1/signup")) {
        signupPayload = route.request().postDataJSON() as Record<string, any>;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            user: authSession.user,
            session: null,
          }),
        });
        return;
      }

      await route.continue();
    });

    await page.goto("/cadastro?ref=12345");
    await page.getByLabel("Nome completo").fill("Ana da Silva");
    await page.getByLabel("Email").fill("ana@example.com");
    await page.getByLabel("Telefone").fill("11999998888");
    await page.getByLabel("CPF").fill("52998224725");
    await page.getByLabel("Senha", { exact: true }).fill("123456");
    await page.getByLabel("Confirmar senha", { exact: true }).fill("123456");
    await page.locator("label[for='terms']").click();
    await page.locator("label[for='privacy']").click();
    await page.getByRole("button", { name: "Criar conta" }).click();

    await expect(page.getByText("Conta criada com sucesso! Verifique seu email.")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);

    expect(signupPayload).not.toBeNull();
    expect(signupPayload?.email).toBe("ana@example.com");
    expect(signupPayload?.password).toBe("123456");
    expect(signupPayload?.data).toEqual({
      nome: "Ana Da Silva",
      telefone: "(11) 99999-8888",
      cpf: "529.982.247-25",
      referral_code: "12345",
    });

    const storedReferralCode = await page.evaluate(() => window.localStorage.getItem("pix_kids_referral_code"));
    expect(storedReferralCode).toBe("12345");
  });

  test("logs in with CPF lookup and reaches the parent dashboard", async ({ page }) => {
    let loginLookupPayload: Record<string, any> | null = null;
    let passwordLoginPayload: Record<string, any> | null = null;

    await page.route(SUPABASE_URL_PATTERN, async (route) => {
      const url = new URL(route.request().url());
      const pathname = url.pathname;

      if (pathname.endsWith("/rest/v1/rpc/get_email_by_cpf")) {
        loginLookupPayload = route.request().postDataJSON() as Record<string, any>;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            email: "ana@example.com",
          }),
        });
        return;
      }

      if (pathname.endsWith("/auth/v1/token")) {
        passwordLoginPayload = route.request().postDataJSON() as Record<string, any>;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(authSession),
        });
        return;
      }

      if (pathname.endsWith("/auth/v1/user")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(authSession.user),
        });
        return;
      }

      if (pathname.endsWith("/rest/v1/user_roles")) {
        await route.fulfill({ status: 200, contentType: "application/json", body: "null" });
        return;
      }

      if (pathname.endsWith("/rest/v1/secondary_guardians")) {
        const select = url.searchParams.get("select") || "";
        const body = select.includes("id,primary_user_id") ? "[]" : "null";
        await route.fulfill({ status: 200, contentType: "application/json", body });
        return;
      }

      if (pathname.endsWith("/rest/v1/kids_profiles")) {
        await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
        return;
      }

      if (pathname.endsWith("/rest/v1/profiles")) {
        const select = url.searchParams.get("select") || "";
        if (select.includes("saldo")) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ saldo: 120 }),
          });
          return;
        }

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ nome: "Ana Silva", codigo_usuario: "ANA123" }),
        });
        return;
      }

      await route.continue();
    });

    await page.goto("/login");
    await page.getByLabel("CPF ou e-mail").fill("52998224725");
    await page.getByLabel("Senha", { exact: true }).fill("123456");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByText("Login realizado com sucesso!")).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText("Ana Silva")).toBeVisible();

    expect(loginLookupPayload).toEqual({ _cpf: "529.982.247-25" });
    expect(passwordLoginPayload?.email).toBe("ana@example.com");
    expect(passwordLoginPayload?.password).toBe("123456");
  });
});
