import { expect, test } from "@playwright/test";

async function bootHandbook(page) {
  await page.goto("/?boot=handbook");
  await page.waitForFunction(() => document.documentElement.dataset.appReady === "ready");
  await page.locator("main").click({ position: { x: 24, y: 24 } });
}

test("opens the handbook and navigates between articles and guides", async ({ page }) => {
  await bootHandbook(page);

  await page.keyboard.press("KeyM");
  await expect(page.locator("#builder-panel")).toBeVisible();
  await expect(page.locator("#guide-title")).toHaveText("Field Archive");

  await page.locator("#guide-nav").locator('[data-guide-view="articles"]').click();
  await expect(page.locator("#guide-title")).toHaveText("Walkthroughs & Survival Reads");
  await expect(page.locator(".detail-title")).toHaveText(
    "Winter Burrow Walkthrough - Complete Story Guide & Key Quests"
  );

  await page.locator('[data-toolkit-action-type="guide"][data-toolkit-action-target="expedition-planner"]').first().click();
  await expect(page.locator("#guide-title")).toHaveText("Winter Burrow Guides");
  await expect(page.locator(".detail-title")).toHaveText("Optimal Expedition Planner");

  await page.keyboard.press("Escape");
  await expect(page.locator("#builder-panel")).toBeHidden();
});

test("filters the database with user input and pins a recipe", async ({ page }) => {
  await bootHandbook(page);

  await page.keyboard.press("KeyM");
  await expect(page.locator("#builder-panel")).toBeVisible();

  await page.locator("#guide-nav").locator('[data-guide-view="database"]').click();
  await page.locator('[data-guide-filter="cooking"]').click();
  await page.locator("#guide-search-input").fill("roasted chanterelle");

  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator(".database-row-button")).toHaveText("Roasted Chanterelle");
  await expect(page.locator(".detail-title")).toHaveText("Roasted Chanterelle");

  await page.locator('[data-track-recipe="roasted-chanterelle"]').click();
  await expect(page.locator("#guide-pinned strong")).toHaveText("Roasted Chanterelle");
  await expect(page.locator('[data-track-recipe="roasted-chanterelle"]')).toContainText("Remover do HUD");
});
