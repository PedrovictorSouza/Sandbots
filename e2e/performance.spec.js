import { expect, test } from "@playwright/test";

const PERFORMANCE_BUDGETS = {
  bootReadyMs: 2500,
  handbookOpenMs: 500,
  searchBatchMs: 3000,
  navigationBatchMs: 2500,
};

async function bootHandbook(page) {
  const startedAt = Date.now();
  await page.goto("/?boot=handbook");
  await page.waitForFunction(() => document.documentElement.dataset.appReady === "ready");
  await page.locator("main").click({ position: { x: 24, y: 24 } });
  return Date.now() - startedAt;
}

async function measure(action) {
  const startedAt = Date.now();
  await action();
  return Date.now() - startedAt;
}

test("boots into the ready state within the current performance budget", async ({ page }) => {
  const readyMs = await bootHandbook(page);
  console.log(`performance: handbook boot ready in ${readyMs}ms`);

  expect(readyMs).toBeLessThan(PERFORMANCE_BUDGETS.bootReadyMs);
});

test("keeps handbook open and repeated data navigation responsive", async ({ page }) => {
  await bootHandbook(page);

  const handbookOpenMs = await measure(async () => {
    await page.keyboard.press("KeyM");
    await expect(page.locator("#builder-panel")).toBeVisible();
  });

  await page.locator("#guide-nav").locator('[data-guide-view="database"]').click();
  await expect(page.locator("#guide-title")).toHaveText("Unified Recipe Index");

  const searchTerms = [
    "roasted chanterelle",
    "forest jam",
    "elder tea",
    "wild jam",
    "roasted ant",
  ];

  const searchBatchMs = await measure(async () => {
    for (const term of searchTerms) {
      await page.locator("#guide-search-input").fill(term);
      await expect(page.locator("tbody tr").first()).toBeVisible();
    }
  });

  const navigationBatchMs = await measure(async () => {
    await page.locator("#guide-nav").locator('[data-guide-view="articles"]').click();
    await expect(page.locator("#guide-title")).toHaveText("Walkthroughs & Survival Reads");

    await page.locator("#guide-nav").locator('[data-guide-view="guides"]').click();
    await expect(page.locator("#guide-title")).toHaveText("Winter Burrow Guides");

    await page.locator("#guide-nav").locator('[data-guide-view="database"]').click();
    await expect(page.locator("#guide-title")).toHaveText("Unified Recipe Index");
  });

  console.log(`performance: handbook opened in ${handbookOpenMs}ms`);
  console.log(`performance: database search batch completed in ${searchBatchMs}ms`);
  console.log(`performance: handbook navigation batch completed in ${navigationBatchMs}ms`);

  expect(handbookOpenMs).toBeLessThan(PERFORMANCE_BUDGETS.handbookOpenMs);
  expect(searchBatchMs).toBeLessThan(PERFORMANCE_BUDGETS.searchBatchMs);
  expect(navigationBatchMs).toBeLessThan(PERFORMANCE_BUDGETS.navigationBatchMs);
});
