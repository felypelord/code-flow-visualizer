import { test, expect } from "@playwright/test";
import { mockApiMe, seedAuthToken } from "./helpers";

test("/pro shows upgrade CTA for non-Pro", async ({ page }) => {
  await seedAuthToken(page);
  await mockApiMe(page, {
    id: "u_nonpro",
    email: "nonpro@example.com",
    isPro: false,
    isAdmin: false,
  });

  await page.goto("/pro");

  await expect(page.getByText("The Pro debugger is available to subscribers")).toBeVisible({
    timeout: 15_000,
  });
  // There are multiple CTAs on the page; strict mode requires picking one.
  await expect(page.getByRole("button", { name: "View Pricing" }).first()).toBeVisible();
});

test("/pro renders Pro debugger container for Pro", async ({ page }) => {
  await seedAuthToken(page);
  await mockApiMe(page, {
    id: "u_pro",
    email: "pro@example.com",
    isPro: true,
    isAdmin: false,
  });

  await page.goto("/pro");

  // Non-Pro helper text should not render when Pro.
  await expect(page.getByText("The Pro debugger is available to subscribers")).toHaveCount(0);

  // The debugger is lazy-loaded; wait for a stable header from the component.
  await expect(page.getByRole("heading", { name: "Execution State" })).toBeVisible({
    timeout: 30_000,
  });
});
