import { expect, test } from "@playwright/test";

function uniqueEmail(): string {
  return `e2e_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function registerViaApi(
  request: Parameters<Parameters<typeof test>[1]>[0]["request"],
  email: string,
  password: string
) {
  const resp = await request.post("/api/auth/register", {
    data: { email, password },
  });
  expect(resp.status()).toBe(201);
  return (await resp.json()) as { token: string; userId: string };
}

async function setAuthStorage(page: Parameters<Parameters<typeof test>[1]>[0]["page"], token: string, userId: string, email: string) {
  await page.goto("/");
  await page.evaluate(
    ({ t, u, e }) => {
      localStorage.setItem("token", t);
      localStorage.setItem("userId", u);
      localStorage.setItem("email", e);
    },
    { t: token, u: userId, e: email }
  );
}

test("registered user can open settings", async ({ page, request }) => {
  const email = uniqueEmail();
  const password = "password123";

  const { token, userId } = await registerViaApi(request, email, password);
  await setAuthStorage(page, token, userId, email);

  await page.goto("/settings");
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
});

test("authed user can access for-you", async ({ page, request }) => {
  const email = uniqueEmail();
  const password = "password123";

  const { token, userId } = await registerViaApi(request, email, password);
  await setAuthStorage(page, token, userId, email);

  await page.goto("/for-you");
  await expect(page).toHaveURL(/\/for-you$/);
  await expect(page.getByRole("heading", { name: "For You" })).toBeVisible();
});

test("authenticated user can trigger article actions when cards exist", async ({ page, request }) => {
  const email = uniqueEmail();
  const password = "password123";

  const { token, userId } = await registerViaApi(request, email, password);
  await setAuthStorage(page, token, userId, email);

  await page.goto("/latest");
  await expect(page.getByRole("heading", { name: "Latest" })).toBeVisible();

  const saveButtons = page.getByTitle(/Save article|Unsave/i);
  const readButtons = page.getByTitle(/Mark as read|Marked as read/i);

  const saveCount = await saveButtons.count();
  const readCount = await readButtons.count();

  test.skip(saveCount === 0 || readCount === 0, "No article cards available to test actions.");

  await saveButtons.first().click();
  await readButtons.first().click();
});
