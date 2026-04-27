import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe.configure({ timeout: 90000 });

async function bootHandbook(page) {
  await page.goto("/?boot=handbook");
  await page.waitForFunction(() => document.documentElement.dataset.appReady === "ready");
  await page.locator("main").click({ position: { x: 24, y: 24 } });
}

function getSeriousViolations(results) {
  return results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact));
}

function formatViolations(violations) {
  return violations
    .map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.length} nodes)`)
    .join("\n");
}

test("handbook opening is keyboard-accessible and assigns focus to a visible control", async ({ page }) => {
  await bootHandbook(page);

  await page.keyboard.press("KeyM");
  await expect(page.locator("#builder-panel")).toBeVisible();
  await expect(page.locator("#guide-close")).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(page.locator("#builder-panel")).toBeHidden();
});

test("handbook content has no serious or critical axe violations", async ({ page }) => {
  await bootHandbook(page);
  await page.keyboard.press("KeyM");
  await page.locator("#guide-nav").locator('[data-guide-view="database"]').click();
  await expect(page.locator("#guide-title")).toHaveText("Unified Recipe Index");

  const results = await new AxeBuilder({ page })
    .include("#builder-panel")
    .withTags(["wcag2a", "wcag2aa"])
    .disableRules(["color-contrast"])
    .analyze();

  const seriousViolations = getSeriousViolations(results);
  expect(seriousViolations, formatViolations(seriousViolations)).toEqual([]);
});

test("core HUD panels have no serious or critical axe violations", async ({ page }) => {
  await bootHandbook(page);

  const results = await new AxeBuilder({ page })
    .include(".hud")
    .include(".missions-panel")
    .include(".inventory")
    .withTags(["wcag2a", "wcag2aa"])
    .disableRules(["color-contrast"])
    .analyze();

  const seriousViolations = getSeriousViolations(results);
  expect(seriousViolations, formatViolations(seriousViolations)).toEqual([]);
});
