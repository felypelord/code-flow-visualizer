import type { Page, Route } from "@playwright/test";

export type MockUser = {
  id: string;
  email?: string;
  isPro?: boolean;
  isAdmin?: boolean;
};

export async function seedAuthToken(page: Page, token = "e2e-token") {
  await page.addInitScript((t) => {
    window.localStorage.setItem("token", String(t));
  }, token);
}

export async function mockApiMe(page: Page, user: MockUser) {
  await page.route("**/api/me", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(user),
    });
  });
}

export async function mockApiLogin(page: Page, token = "e2e-token") {
  await page.route("**/api/login", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ token }),
    });
  });
}
