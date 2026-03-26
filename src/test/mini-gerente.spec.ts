import { expect, test } from "../../playwright-fixture";

const kidSession = {
  id: "kid-mini-gerente-1",
  nome: "Nicole Farias Gonçalves",
  apelido: "Nicole",
  idade: 8,
  codigo_publico: "11223",
  saldo: 25,
  saldo_poupanca: 10,
  is_frozen: false,
  limite_diario: 50,
  aprovacao_transferencias: true,
  bloqueio_envio: false,
  is_mini_gerente: true,
  saldo_comissao: 18,
};

test.describe("mini gerente", () => {
  test("registers an existing mini gerente by referral code", async ({ page }) => {
    await page.route("**/rest/v1/rpc/**", async (route) => {
      const url = route.request().url();

      if (url.includes("/get_kid_referral_stats")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            total_referrals: 0,
            total_earned: 0,
            saldo_comissao: 0,
            existing_referrer: null,
            referrals: [],
            commissions: [],
          }),
        });
        return;
      }

      if (url.includes("/lookup_by_code")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            nome: "Sophia Farias Gonçalves",
            type: "kid",
          }),
        });
        return;
      }

      if (url.includes("/kid_register_referral")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            referrer_name: "Sophia Farias Gonçalves",
          }),
        });
        return;
      }

      await route.fulfill({ status: 200, contentType: "application/json", body: "null" });
    });

    await page.goto("/crianca");
    await page.evaluate((session) => {
      window.localStorage.setItem("pix_kids_kid_session", JSON.stringify(session));
    }, kidSession);

    await page.goto("/crianca/dashboard");
    await page.getByRole("button", { name: /gerente/i }).click();

    await expect(page.getByText("Cadastrar meu Mini Gerente")).toBeVisible();
    await page.getByPlaceholder(/Código do Mini Gerente/i).fill("12345");
    await page.getByRole("button", { name: /Buscar Mini Gerente/i }).click();

    await expect(page.getByText("Mini Gerente encontrado:")).toBeVisible();
    await expect(page.getByText("Sophia Farias Gonçalves")).toBeVisible();

    await page.getByRole("button", { name: /Confirmar/i }).click();
    await expect(page.getByText(/Mini Gerente Sophia Farias Gonçalves cadastrado!/i)).toBeVisible();
  });

  test("withdraws available commission to the kid balance", async ({ page }) => {
    await page.route("**/rest/v1/rpc/**", async (route) => {
      const url = route.request().url();

      if (url.includes("/get_kid_referral_stats")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            total_referrals: 2,
            total_earned: 18,
            saldo_comissao: 18,
            existing_referrer: {
              referrer_name: "Sophia Farias Gonçalves",
              referrer_codigo: "00012",
            },
            referrals: [
              {
                id: "ref-1",
                referred_name: "Rafael Souza",
                referred_codigo: "00145",
                status: "active",
                created_at: "2026-03-21T10:00:00.000Z",
                total_comissao: 6,
              },
            ],
            commissions: [
              {
                id: "com-1",
                valor_deposito: 120,
                taxa_percentual: 1,
                valor_comissao: 1.2,
                status: "aprovado",
                created_at: "2026-03-21T14:10:00.000Z",
              },
            ],
          }),
        });
        return;
      }

      if (url.includes("/kid_withdraw_commission_no_pin")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            novo_saldo: 37,
          }),
        });
        return;
      }

      await route.fulfill({ status: 200, contentType: "application/json", body: "null" });
    });

    await page.goto("/crianca");
    await page.evaluate((session) => {
      window.localStorage.setItem("pix_kids_kid_session", JSON.stringify(session));
    }, kidSession);

    await page.goto("/crianca/dashboard");
    await page.getByRole("button", { name: /gerente/i }).click();

    await expect(page.getByText("R$ 18.00")).toBeVisible();
    await page.getByRole("button", { name: /Sacar para meu saldo/i }).click();
    await page.getByPlaceholder(/Máximo: R\$ 18.00/i).fill("12");
    await page.getByRole("button", { name: "Confirmar" }).click();

    await expect(page.getByText(/R\$ 12.00 transferido para seu saldo!/i)).toBeVisible();

    const storedSession = await page.evaluate(() => JSON.parse(window.localStorage.getItem("pix_kids_kid_session") || "null"));
    expect(storedSession?.saldo).toBe(37);
  });
});
