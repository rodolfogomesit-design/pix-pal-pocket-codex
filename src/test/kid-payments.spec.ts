import { expect, test } from "../../playwright-fixture";

const kidSession = {
  id: "kid-test-id",
  nome: "Joana Silva",
  apelido: "Juju",
  idade: 9,
  codigo_publico: "12345",
  saldo: 30,
  saldo_poupanca: 10,
  is_frozen: false,
  limite_diario: 50,
  aprovacao_transferencias: false,
  bloqueio_envio: false,
};

test.describe("kid payments", () => {
  test("saves a new contact after paying by public code", async ({ page }) => {
    let savedContactPayload: Record<string, unknown> | null = null;

    await page.route("**/rest/v1/rpc/**", async (route) => {
      const url = route.request().url();
      const body = route.request().postDataJSON() as Record<string, unknown>;

      if (url.includes("/kid_get_contacts")) {
        await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
        return;
      }

      if (url.includes("/lookup_by_code")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, nome: "Ana", type: "kid" }),
        });
        return;
      }

      if (url.includes("/kid_transfer")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, needs_approval: true, to_name: "Ana" }),
        });
        return;
      }

      if (url.includes("/kid_save_contact_no_pin")) {
        savedContactPayload = body;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
        return;
      }

      await route.fulfill({ status: 200, contentType: "application/json", body: "null" });
    });

    await page.goto("/crianca");
    await page.evaluate((session) => {
      window.localStorage.setItem("pix_kids_kid_session", JSON.stringify(session));
    }, kidSession);

    await page.goto("/crianca/pagar");
    await page.getByPlaceholder("12345").fill("54321");
    await page.getByRole("button", { name: "Buscar" }).click();
    await page.getByPlaceholder("10.00").fill("10");
    await page.getByRole("button", { name: "Confirmar e pagar" }).click();

    await expect(page.getByText(/Enviado para aprova/i)).toBeVisible();
    expect(savedContactPayload?._contact_codigo).toBe("54321");
    expect(savedContactPayload?._contact_nome).toBe("Ana");

    const storedSession = await page.evaluate(() => JSON.parse(window.localStorage.getItem("pix_kids_kid_session") || "null"));
    expect(storedSession?.saldo).toBe(20);
  });

  test("does not save copy-and-paste pix payload as contact", async ({ page }) => {
    let savePixContactCalls = 0;

    await page.route("**/rest/v1/rpc/**", async (route) => {
      const url = route.request().url();

      if (url.includes("/kid_get_pix_contacts")) {
        await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
        return;
      }

      if (url.includes("/kid_request_pix_payment_no_pin")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
        return;
      }

      if (url.includes("/kid_save_pix_contact_no_pin")) {
        savePixContactCalls += 1;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
        return;
      }

      await route.fulfill({ status: 200, contentType: "application/json", body: "null" });
    });

    await page.goto("/crianca");
    await page.evaluate((session) => {
      window.localStorage.setItem("pix_kids_kid_session", JSON.stringify(session));
    }, kidSession);

    await page.goto("/crianca/pagar-pix");
    await page.getByRole("button", { name: /Colar c/i }).click();
    await page.getByPlaceholder(/Cole o c/i).fill("00020101021226860014br.gov.bcb.pix2564payloadpixexample");
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page.getByText(/salvo como contato/i)).toBeVisible();
    await page.getByPlaceholder("10.00").fill("5");
    await page.getByRole("button", { name: "Confirmar e pagar" }).click();

    await expect(page.getByText(/Pagamento Pix realizado/i)).toBeVisible();
    expect(savePixContactCalls).toBe(0);
  });
});
