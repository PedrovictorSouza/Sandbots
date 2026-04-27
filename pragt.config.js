import { createPragtProjectConfig } from "@pragt/css-tool/next";

const APP_OVERRIDES_CSS = "styles/pragt-overrides.css";
const PRAGT_UI_CSS = "packages/pragt-css/src/styles/pragt-specificity-tool.css";

const SOURCE_GROUPS = {
  start: ["startScreen.js"],
  intro: ["introSequence.js"],
  cinematic: ["actTwoSequence.js"],
  tutorial: ["actTwoTutorial.js"],
  pokedex: ["pokedexOverlay.js", "main.js"],
  handbook: ["guidePanel.js", "handbook/guidePanelRenderer.js", "winterBurrowData.js"],
  hud: ["main.js", "gameplayContent.js"],
  global: [
    "main.js",
    "startScreen.js",
    "introSequence.js",
    "actTwoSequence.js",
    "actTwoTutorial.js",
    "pokedexOverlay.js",
    "guidePanel.js",
    "handbook/guidePanelRenderer.js",
    "gameplayContent.js",
    "winterBurrowData.js"
  ]
};

const ALL_SOURCE_FILES = Array.from(
  new Set(Object.values(SOURCE_GROUPS).flat())
);

function includesTargetToken(helpers, target, matcher) {
  return helpers.targetContainsToken(target, (token) => String(token || "").includes(matcher));
}

function resolveViewSourceFiles(target, helpers) {
  if (includesTargetToken(helpers, target, "guide-")) {
    return SOURCE_GROUPS.handbook;
  }

  if (includesTargetToken(helpers, target, "pokedex-")) {
    return SOURCE_GROUPS.pokedex;
  }

  if (
    includesTargetToken(helpers, target, "intro-") ||
    includesTargetToken(helpers, target, "trainer-") ||
    includesTargetToken(helpers, target, "memory-frame")
  ) {
    return SOURCE_GROUPS.intro;
  }

  if (includesTargetToken(helpers, target, "start-")) {
    return SOURCE_GROUPS.start;
  }

  if (includesTargetToken(helpers, target, "cinematic-shell")) {
    return SOURCE_GROUPS.cinematic;
  }

  if (
    includesTargetToken(helpers, target, "act-two-") ||
    includesTargetToken(helpers, target, "name-entry")
  ) {
    return SOURCE_GROUPS.tutorial;
  }

  if (
    includesTargetToken(helpers, target, "hud") ||
    includesTargetToken(helpers, target, "missions-") ||
    includesTargetToken(helpers, target, "inventory-") ||
    includesTargetToken(helpers, target, "skill-")
  ) {
    return SOURCE_GROUPS.hud;
  }

  return SOURCE_GROUPS.global;
}

function resolveTextSourceFiles(target, helpers) {
  return Array.from(
    new Set([
      ...resolveViewSourceFiles(target, helpers),
      "gameplayContent.js",
      "winterBurrowData.js"
    ])
  );
}

export default createPragtProjectConfig({
  css: {
    allowedFilePaths: [APP_OVERRIDES_CSS, PRAGT_UI_CSS],
    resolveTargetFile({ selector }) {
      if (String(selector || "").includes("pragt-")) {
        return PRAGT_UI_CSS;
      }

      return APP_OVERRIDES_CSS;
    }
  },
  sources: {
    allowedFilePaths: ALL_SOURCE_FILES,
    jsxFilePaths: [],
    resolveDeleteSourceFiles({ target }, helpers) {
      return resolveViewSourceFiles(target, helpers);
    },
    resolveUpdateTextSourceFiles({ target }, helpers) {
      return resolveTextSourceFiles(target, helpers);
    },
    resolveSwapSourceFile({ firstTarget, secondTarget, target }, helpers) {
      return resolveViewSourceFiles(firstTarget || secondTarget || target, helpers)[0] || "main.js";
    }
  }
});
