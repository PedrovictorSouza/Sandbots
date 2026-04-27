import test from "node:test";
import assert from "node:assert/strict";
import { inspectSourceText } from "../src/server/inspect-handler.js";

test("separates direct runtime usage from external coupling in orchestrator-style functions", () => {
  const code = `
    const camera = { setPose() {}, zoom: 1 };
    const storyState = { act: 1 };
    const inventory = [];
    const playerCharacter = { update() {} };
    const npcActors = [];
    const pressedKeys = {};
    const cameraTurnKeys = {};
    const WORLD_LIMIT = 12;
    const ACT_TWO_PLAYER_CAMERA_DIRECTION = 1;

    function main(delta) {
      const frameNow = performance.now();
      requestAnimationFrame(main);

      if (pressedKeys.left || cameraTurnKeys.right) {
        camera.setPose(storyState.act, inventory.length);
      }

      playerCharacter.update(delta, npcActors.length);

      return (
        WORLD_LIMIT +
        ACT_TWO_PLAYER_CAMERA_DIRECTION +
        camera.zoom +
        storyState.act +
        inventory.length +
        frameNow
      );
    }
  `;

  const report = inspectSourceText(code);
  const mainEntry = report.functions.find((entry) => entry.name === "main");

  assert.ok(mainEntry, "expected to analyze function main");
  assert.equal(mainEntry.runtimeDirect.level, "medium");
  assert.deepEqual(mainEntry.runtimeDirect.signals, [
    "performance.now",
    "requestAnimationFrame"
  ]);
  assert.equal(mainEntry.externalCoupling.level, "high");
  assert.deepEqual(mainEntry.externalCoupling.reads, [
    "camera",
    "cameraTurnKeys",
    "inventory",
    "npcActors",
    "pressedKeys",
    "storyState"
  ]);
  assert.deepEqual(mainEntry.externalCoupling.calls, [
    "camera.setPose",
    "playerCharacter.update"
  ]);
  assert.deepEqual(mainEntry.externalCoupling.constants, [
    "ACT_TWO_PLAYER_CAMERA_DIRECTION",
    "WORLD_LIMIT"
  ]);
});

test("tracks canvas runtime signals without turning parameter access into external coupling", () => {
  const code = `
    function draw(ctx, position) {
      console.log(position.x);
      ctx.fillRect(0, 0, 10, 10);
      return Math.max(0, position.x);
    }
  `;

  const report = inspectSourceText(code);
  const drawEntry = report.functions.find((entry) => entry.name === "draw");

  assert.ok(drawEntry, "expected to analyze function draw");
  assert.equal(drawEntry.runtimeDirect.level, "medium");
  assert.deepEqual(drawEntry.runtimeDirect.signals, ["canvas", "console.log"]);
  assert.equal(drawEntry.externalCoupling.level, "none");
  assert.deepEqual(drawEntry.externalCoupling.reads, []);
  assert.deepEqual(drawEntry.externalCoupling.calls, []);
  assert.deepEqual(drawEntry.externalCoupling.constants, []);
});

test("collects architecture annotations attached above a function", () => {
  const code = `
    /*
    @pragt-role builder
    @pragt-layer ui
    must remain pure
    */
    function buildQuestProgressCopy(quest) {
      return quest;
    }
  `;

  const report = inspectSourceText(code);
  const entry = report.functions.find((item) => item.name === "buildQuestProgressCopy");

  assert.ok(entry, "expected to analyze function buildQuestProgressCopy");
  assert.equal(entry.architectureAnnotation?.directives?.role, "builder");
  assert.equal(entry.architectureAnnotation?.directives?.layer, "ui");
  assert.deepEqual(entry.architectureAnnotation?.notes, ["must remain pure"]);
});

test("flags structurally compacted files for manual stop", () => {
  const code = [
    "function submitColor(payload) { return payload; }function handleApplyColorToCode(colorDraft, scope) { const payload = { propertyName: scope.propertyName, colorValue: colorDraft, label: `${scope.propertyName}:${colorDraft}` }; return submitColor(payload); }",
    "function parsePixelValue(value) { return Number.parseFloat(String(value || '').trim()); }"
  ].join("\n");

  const report = inspectSourceText(code);

  assert.equal(report.sourceHealth?.requiresManualStop, true);
  assert.equal(report.sourceHealth?.stopReason, "source-compacted");
  assert.ok(Array.isArray(report.sourceHealth?.gluedFunctionPairs));
  assert.equal(report.sourceHealth.gluedFunctionPairs.length, 1);
  assert.match(String(report.warnings[0] || ""), /compactacao estrutural/i);
});

test("does not flag nested helper functions as glued function pairs", () => {
  const code = `
    export function createIntroSequence() {
      function syncUiMode() {
        return "intro";
      }

      function render() {
        return syncUiMode();
      }

      return {
        render
      };
    }
  `;

  const report = inspectSourceText(code);

  assert.equal(report.sourceHealth?.requiresManualStop, false);
  assert.deepEqual(report.sourceHealth?.gluedFunctionPairs, []);
});
