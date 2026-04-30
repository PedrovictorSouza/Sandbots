import { expect, test } from "@playwright/test";

async function bootHandbook(page) {
  await page.goto("/?boot=handbook");
  await page.waitForFunction(() => document.documentElement.dataset.appReady === "ready");
  await page.locator("main").click({ position: { x: 24, y: 24 } });
}

test("boots into a ready state and renders core HUD elements", async ({ page }) => {
  await bootHandbook(page);

  await expect(page.locator("#status")).not.toHaveAttribute("data-error", "true");
  await expect(page.locator(".hud")).toBeVisible();
  await expect(page.locator("#hud-instructions")).toBeVisible();
  await expect(page.locator("#hud-instructions")).not.toHaveText("");
  await expect(page.locator(".hud-checklist")).toBeVisible();
  await expect(page.locator(".hud-checklist")).not.toHaveText("");
});

test("opens the handbook and reaches the article shelf", async ({ page }) => {
  await bootHandbook(page);

  await page.keyboard.press("KeyM");
  await expect(page.locator("#builder-panel")).toBeVisible();
  await expect(page.locator("#guide-title")).toHaveText("Field Archive");

  await page.locator("#guide-nav").locator('[data-guide-view="articles"]').click();
  await expect(page.locator("#guide-title")).toHaveText("Walkthroughs & Survival Reads");
  await expect(page.locator(".article-shelf")).toBeVisible();
  await expect(page.locator(".article-shelf-card").first()).toBeVisible();
});
