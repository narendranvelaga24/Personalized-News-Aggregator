import { expect, test } from "@playwright/test";

test("landing page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /your signal/i })).toBeVisible();
});

test("latest page renders", async ({ page }) => {
  await page.goto("/latest");
  await expect(page.getByRole("heading", { name: "Latest" })).toBeVisible();
});

test("auth pages render", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  await page.goto("/register");
  await expect(page.getByRole("heading", { name: /create account/i })).toBeVisible();
});
