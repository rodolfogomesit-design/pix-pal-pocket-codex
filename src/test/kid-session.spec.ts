import { expect, test } from "../../playwright-fixture";

const kidSession = {
  id: "kid-test-id",
  nome: "Joana Silva",
  apelido: "Juju",
  idade: 9,
  codigo_publico: "12345",
  saldo: 25,
  saldo_poupanca: 10,
  is_frozen: false,
  limite_diario: 50,
  aprovacao_transferencias: false,
  bloqueio_envio: false,
};

test.describe("kid session", () => {
  test("redirects to login when no kid session exists", async ({ page }) => {
    await page.goto("/crianca/dashboard");
    await expect(page.getByRole("heading", { name: /Pix Kids/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Entrar na minha conta/i })).toBeVisible();
  });

  test("restores kid dashboard after reload from localStorage", async ({ page }) => {
    await page.goto("/crianca");
    await page.evaluate((session) => {
      window.localStorage.setItem("pix_kids_kid_session", JSON.stringify(session));
    }, kidSession);
    await page.goto("/crianca/dashboard");

    await expect(page.getByText(/Juju|Joana Silva/)).toBeVisible();
    await expect(page.getByText("R$ 25.00")).toBeVisible();

    await page.reload();

    await expect(page).toHaveURL(/\/crianca\/dashboard$/);
    await expect(page.getByText(/Juju|Joana Silva/)).toBeVisible();
    await expect(page.getByText("R$ 25.00")).toBeVisible();
  });

  test("clears localStorage on logout", async ({ page }) => {
    await page.goto("/crianca");
    await page.evaluate((session) => {
      window.localStorage.setItem("pix_kids_kid_session", JSON.stringify(session));
    }, kidSession);
    await page.goto("/crianca/dashboard");
    await page.getByRole("button", { name: /sair/i }).click();

    await expect(page.getByRole("heading", { name: /Entrar na minha conta/i })).toBeVisible();

    const storedSession = await page.evaluate(() => window.localStorage.getItem("pix_kids_kid_session"));
    expect(storedSession).toBeNull();
  });
});
