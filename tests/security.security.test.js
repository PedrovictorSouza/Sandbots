// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createGuidePanel } from "../guidePanel.js";
import { createActTwoTutorial } from "../actTwoTutorial.js";
import { TOOLKIT_ARTICLES, COOKING_RECIPES } from "../winterBurrowData.js";

function click(element) {
  if (!element) {
    throw new Error("Expected clickable element.");
  }

  element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

function typeInto(element, value) {
  if (!element) {
    throw new Error("Expected input element.");
  }

  element.value = value;
  element.dispatchEvent(new Event("input", { bubbles: true }));
}

function findByDataset(rootNode, attribute, value) {
  return [...rootNode.querySelectorAll(`[${attribute}]`)].find((node) => node.getAttribute(attribute) === value) || null;
}

function pressKey(handler, { code, key, repeat = false, ctrlKey = false, metaKey = false, altKey = false } = {}) {
  const event = {
    code,
    key,
    repeat,
    ctrlKey,
    metaKey,
    altKey,
    preventDefault: vi.fn(),
  };

  handler(event);
  return event;
}

const fakeCamera = {
  project() {
    return { x: 160, y: 120, depth: 0.25 };
  },
};

describe("security hardening", () => {
  let root;
  let uiLayer;
  let originalArticle;
  let originalRecipe;

  beforeEach(() => {
    document.body.innerHTML = "";
    root = document.createElement("section");
    uiLayer = document.createElement("div");
    document.body.append(root, uiLayer);
    originalArticle = structuredClone(TOOLKIT_ARTICLES[0]);
    originalRecipe = structuredClone(COOKING_RECIPES[0]);
  });

  afterEach(() => {
    Object.assign(TOOLKIT_ARTICLES[0], structuredClone(originalArticle));
    Object.assign(COOKING_RECIPES[0], structuredClone(originalRecipe));
    delete window.__xssFlag;
  });

  it("escapes handbook article and recipe content instead of rendering injected HTML", { timeout: 30000 }, () => {
    Object.assign(TOOLKIT_ARTICLES[0], {
      ...structuredClone(originalArticle),
      title: '<img src=x data-xss-title="1">',
      summary: '<script data-xss-script="1">window.__xssFlag = 1</script>',
      sections: [
        {
          ...originalArticle.sections[0],
          title: '<svg data-xss-section="1"></svg>',
          body: '<a href="javascript:window.__xssFlag=1" data-xss-link="1">owned</a>',
        },
        ...originalArticle.sections.slice(1),
      ],
    });

    Object.assign(COOKING_RECIPES[0], {
      ...structuredClone(originalRecipe),
      name: '<img src=x data-xss-recipe="1">',
      category: '<svg data-xss-category="1"></svg>',
      ingredients: [{ amount: 1, name: '<iframe data-xss-ingredient="1"></iframe>' }],
      statBoosts: ['<img src=x data-xss-boost="1">'],
      duration: '<script data-xss-duration="1">window.__xssFlag = 1</script>',
    });

    createGuidePanel({ root });

    click(root.querySelector('[data-guide-view="articles"]'));
    expect(root.querySelector('[data-xss-title="1"]')).toBeNull();
    expect(root.querySelector('[data-xss-script="1"]')).toBeNull();
    expect(root.querySelector('[data-xss-section="1"]')).toBeNull();
    expect(root.querySelector('[data-xss-link="1"]')).toBeNull();
    expect(root.querySelector(".detail-title")?.textContent).toContain('<img src=x data-xss-title="1">');
    expect(root.querySelector(".article-section__title")?.textContent).toContain('<svg data-xss-section="1"></svg>');

    click(root.querySelector('[data-guide-view="database"]'));
    click(root.querySelector('[data-guide-filter="cooking"]'));
    const recipeButton = root.querySelector(".database-row-button");
    expect(root.querySelector('[data-xss-recipe="1"]')).toBeNull();
    expect(root.querySelector('[data-xss-category="1"]')).toBeNull();
    expect(root.querySelector('[data-xss-ingredient="1"]')).toBeNull();
    expect(root.querySelector('[data-xss-boost="1"]')).toBeNull();
    expect(root.querySelector('[data-xss-duration="1"]')).toBeNull();
    expect(recipeButton?.textContent).toContain('<img src=x data-xss-recipe="1">');
    click(recipeButton);
    expect(root.querySelector("#guide-detail .detail-title")?.textContent).toContain('<img src=x data-xss-recipe="1">');
    expect(root.textContent).toContain('<iframe data-xss-ingredient="1"></iframe>');
    expect(window.__xssFlag).toBeUndefined();
  });

  it("escapes player-entered tutorial names in the name entry and confirmation dialogue", { timeout: 30000 }, () => {
    const tutorial = createActTwoTutorial({ root, uiLayer });

    tutorial.start({
      monsterPosition: [0, 0, 0],
      squirtlePosition: [2, 0, 0],
      inspectablePosition: [0, 0, 0],
      repairPlantPosition: [4, 0, 0],
    });

    tutorial.__debugStartConversation("namePrompt");
    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });
    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });

    const payloadKeys = ["<", "I", "M", "G", " ", "S", "R", "C", "=", "X", ">"];
    for (const keyValue of payloadKeys) {
      if (keyValue === " ") {
        click(findByDataset(root, "data-name-action", "space"));
        continue;
      }

      click(findByDataset(root, "data-name-key", keyValue));
    }

    expect(root.querySelector(".name-entry__value img")).toBeNull();
    expect(root.querySelector(".name-entry__value")?.textContent).toContain("<IMG SRC=X>");

    click(root.querySelector('[data-name-action="submit"]'));
    pressKey(tutorial.handleKeydown, { code: "Space", key: " " });

    expect(root.querySelector(".act-two-dialogue__text img")).toBeNull();
    expect(root.querySelector(".act-two-dialogue__text")?.textContent).toContain('"<IMG SRC=X>"');
    expect(window.__xssFlag).toBeUndefined();
  });
});
