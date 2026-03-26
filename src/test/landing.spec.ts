import { expect, test } from "../../playwright-fixture";

test.describe("landing page", () => {
  test("renders the main sections and interactive previews", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        name: /O Pix Kids ajuda a criança a aprender sobre dinheiro usando Pix, metas e mesada digital\./i,
      }),
    ).toBeVisible();
    await expect(page.getByText("Painel da família", { exact: true })).toBeVisible();
    await expect(page.getByText("Mini Gerente Pix Kids: aprender, indicar e ganhar.")).toBeVisible();

    await page.getByRole("button", { name: "Gerente", exact: true }).click();
    await expect(page.getByText("Aprender, indicar e ganhar.")).toBeVisible();
    await expect(page.getByText("Indicações", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Histórico" }).first().click();
    await expect(page.getByText("Mesada recebida")).toBeVisible();

    await expect(page.getByRole("heading", { name: /Quatro passos para usar o Pix Kids na prática\./i })).toBeVisible();
    await expect(page.getByText(/Rodolfo Gomes Gon/i)).toBeVisible();
    await expect(page.getByText("Meus filhos")).toBeVisible();

    await expect(
      page.getByRole("heading", {
        name: /Um recurso que transforma indicação em aprendizado sobre iniciativa e responsabilidade\./i,
      }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "O Mini Gerente ensina, na prática, conceitos de recompensa, desempenho e autonomia com total supervisão dos responsáveis.",
      ),
    ).toBeVisible();
  });

  test("opens the login choice dialog with both entry options", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Entrar" }).first().click();

    await expect(page.getByText("Quem está entrando?")).toBeVisible();
    await expect(page.getByText("Sou responsável")).toBeVisible();
    await expect(page.getByText("Sou criança")).toBeVisible();
  });
});
