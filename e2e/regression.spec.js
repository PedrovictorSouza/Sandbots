import { expect, test } from "@playwright/test";

async function bootHandbook(page) {
  await page.goto("/?boot=handbook");
  await page.waitForFunction(() => document.documentElement.dataset.appReady === "ready");
  await page.locator("main").click({ position: { x: 24, y: 24 } });
  await page.keyboard.press("KeyM");
  await expect(page.locator("#builder-panel")).toBeVisible();
}

test("keeps a pinned recipe across handbook navigation", async ({ page }) => {
  await bootHandbook(page);

  await page.locator("#guide-nav").locator('[data-guide-view="database"]').click();
  await page.locator('[data-guide-filter="cooking"]').click();
  await page.locator("#guide-search-input").fill("roasted chanterelle");
  await page.locator('[data-track-recipe="roasted-chanterelle"]').click();

  await expect(page.locator("#guide-pinned strong")).toHaveText("Roasted Chanterelle");

  await page.locator("#guide-nav").locator('[data-guide-view="articles"]').click();
  await expect(page.locator("#guide-title")).toHaveText("Walkthroughs & Survival Reads");
  await expect(page.locator("#guide-pinned strong")).toHaveText("Roasted Chanterelle");

  await page.locator("#guide-nav").locator('[data-guide-view="database"]').click();
  await expect(page.locator("#guide-pinned strong")).toHaveText("Roasted Chanterelle");

  await page.locator("#guide-search-input").fill("roasted chanterelle");
  await expect(page.locator('[data-track-recipe="roasted-chanterelle"]')).toContainText("Remover do HUD");
});

test("resets stale database filters when changing views", async ({ page }) => {
  await bootHandbook(page);

  await page.locator("#guide-nav").locator('[data-guide-view="database"]').click();
  await page.locator('[data-guide-filter="cooking"]').click();
  await page.locator("#guide-search-input").fill("roasted chanterelle");
  await expect(page.locator("tbody tr")).toHaveCount(1);

  await page.locator("#guide-nav").locator('[data-guide-view="guides"]').click();
  await expect(page.locator("#guide-title")).toHaveText("Winter Burrow Guides");

  await page.locator("#guide-nav").locator('[data-guide-view="database"]').click();
  await expect(page.locator("#guide-search-input")).toHaveValue("");
  await expect(page.locator('[data-guide-filter="all"][data-active="true"]')).toBeVisible();
  await expect.poll(async () => await page.locator("tbody tr").count()).toBeGreaterThan(1);
});
