import { test, expect } from "@playwright/test";
import { mockApiMe, seedAuthToken } from "./helpers";

test("Pro exercises are locked for non-Pro", async ({ page }) => {
  await seedAuthToken(page);
  await mockApiMe(page, { id: "u_nonpro", isPro: false, isAdmin: false });

  await page.goto("/pro");
  await page.locator("#pro-exercises").scrollIntoViewIfNeeded();

  // Pro exercises section should be present and locked.
  await expect(page.getByText("Pro Exercises Locked"), { timeout: 15_000 }).toBeVisible();
  await expect(page.getByRole("button", { name: "Activate Pro Now" }), { timeout: 15_000 }).toBeVisible();
});

test("Pro can open a Pro exercise editor", async ({ page }) => {
  await seedAuthToken(page);
  await mockApiMe(page, { id: "u_pro", isPro: true, isAdmin: false });

  await page.goto("/pro");
  await page.locator("#pro-exercises").scrollIntoViewIfNeeded();

  // Open the first exercise.
  await page.getByRole("button", { name: "Solve Challenge" }).first().click();

  // Editor loads; a stable indicator is the code textarea placeholder.
  await expect(page.getByPlaceholder("Write code first"), { timeout: 15_000 }).toBeVisible();
});
