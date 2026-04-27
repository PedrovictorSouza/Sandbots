import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createExtractPureBlockPostHandler } from "../src/server/extract-pure-block-handler.js";

async function withTempSourceFile(sourceText, runTest) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "pragt-extract-test-"));
  const sourceFilePath = path.join(tempDir, "tool.jsx");

  try {
    await writeFile(sourceFilePath, sourceText, "utf8");
    await runTest({ sourceFilePath, tempDir });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

test("extract-pure-block previews and applies the selected helper extraction", async () => {
  const sourceText = `function submitColor(payload) {
  return payload;
}

function handleApplyColorToCode(colorDraft, scope) {
  const payload = {
    propertyName: scope.propertyName,
    colorValue: colorDraft
  };

  return submitColor(payload);
}
`;

  await withTempSourceFile(sourceText, async ({ sourceFilePath }) => {
    const handler = createExtractPureBlockPostHandler({
      refactor: {
        allowedFilePaths: [sourceFilePath]
      }
    });

    const previewRequest = new Request("http://localhost/api/pragt/extract-pure-block", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        operation: "preview",
        script: sourceFilePath,
        functionName: "handleApplyColorToCode",
        functionRole: "Action Handler",
        functionCategory: "handlers"
      })
    });

    const previewResponse = await handler(previewRequest);
    const previewPayload = await previewResponse.json();

    assert.equal(previewResponse.status, 200, previewPayload.error || "expected preview to succeed");
    assert.equal(previewPayload.ok, true);
    assert.equal(previewPayload.preview.helperName, "buildApplyColorPayload");
    assert.equal(previewPayload.preview.candidates.length, 1);
    assert.equal(previewPayload.preview.progress.safeNextExtraction, "buildApplyColorPayload");
    assert.equal(typeof previewPayload.preview.progress.remainingMixedZones, "number");
    assert.match(
      previewPayload.preview.beforeSource,
      /function handleApplyColorToCode\(colorDraft, scope\)/
    );
    assert.match(
      previewPayload.preview.afterSource,
      /const payload = buildApplyColorPayload\(/
    );
    assert.doesNotMatch(previewPayload.preview.afterSource, /function buildApplyColorPayload\(/);
    assert.match(previewPayload.preview.diff, /const payload = buildApplyColorPayload\(/);

    const applyRequest = new Request("http://localhost/api/pragt/extract-pure-block", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        operation: "apply",
        script: sourceFilePath,
        functionName: "handleApplyColorToCode",
        proposal: {
          helperSource: previewPayload.preview.helperSource,
          updatedFunctionSource: previewPayload.preview.updatedFunctionSource
        }
      })
    });

    const applyResponse = await handler(applyRequest);
    const applyPayload = await applyResponse.json();
    const nextSource = await readFile(sourceFilePath, "utf8");

    assert.equal(applyResponse.status, 200, applyPayload.error || "expected apply to succeed");
    assert.equal(applyPayload.ok, true);
    assert.equal(applyPayload.helperName, "buildApplyColorPayload");
    assert.match(nextSource, /function buildApplyColorPayload\(scope, colorDraft\)|function buildApplyColorPayload\(colorDraft, scope\)/);
    assert.match(nextSource, /const payload = buildApplyColorPayload\(/);
    assert.doesNotMatch(nextSource, /}function buildApplyColorPayload\(/);
  });
});

test("extract-pure-block refuses ambiguous runtime-only blocks", async () => {
  const sourceText = `async function handleDelete(url) {
  const response = await fetch(url);
  return response.json();
}
`;

  await withTempSourceFile(sourceText, async ({ sourceFilePath }) => {
    const handler = createExtractPureBlockPostHandler({
      refactor: {
        allowedFilePaths: [sourceFilePath]
      }
    });

    const previewRequest = new Request("http://localhost/api/pragt/extract-pure-block", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        operation: "preview",
        script: sourceFilePath,
        functionName: "handleDelete"
      })
    });

    const previewResponse = await handler(previewRequest);
    const previewPayload = await previewResponse.json();

    assert.equal(previewResponse.status, 200, previewPayload.error || "expected preview to succeed");
    assert.equal(previewPayload.ok, true);
    assert.equal(previewPayload.preview.candidates.length, 0);
    assert.equal(previewPayload.preview.helperSource, "");
    assert.equal(previewPayload.preview.mode, "manual-review");
    assert.ok(typeof previewPayload.preview.progress.safeNextExtraction === "string");
    assert.match(
      String(previewPayload.preview.summary),
      /Nenhum bloco extraivel encontrado/
    );
  });
});

test("extract-pure-block prefers structural builders over trivial formatters", async () => {
  const sourceText = [
    "function registerCodeUndoAction(payload) {",
    "  return payload;",
    "}",
    "",
    "function handleApplyReparentToCode(movementLabel, elementDescription, payload, previewSnapshot) {",
    "  registerCodeUndoAction({",
    "    label: `${movementLabel} ${elementDescription}`,",
    '    route: "/api/reparent",',
    "    undoRequest: {",
    '      operation: "undo",',
    '      sourceFilePath: payload.undoSnapshot?.sourceFilePath || "",',
    '      sourceText: payload.undoSnapshot?.sourceText || ""',
    "    },",
    "    previewSnapshot,",
    "    reloadAfterUndo: true",
    "  });",
    "}"
  ].join("\n");

  await withTempSourceFile(sourceText, async ({ sourceFilePath }) => {
    const handler = createExtractPureBlockPostHandler({
      refactor: {
        allowedFilePaths: [sourceFilePath]
      }
    });

    const previewRequest = new Request("http://localhost/api/pragt/extract-pure-block", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        operation: "preview",
        script: sourceFilePath,
        functionName: "handleApplyReparentToCode"
      })
    });

    const previewResponse = await handler(previewRequest);
    const previewPayload = await previewResponse.json();

    assert.equal(previewResponse.status, 200, previewPayload.error || "expected preview to succeed");
    assert.equal(previewPayload.ok, true);
    assert.equal(previewPayload.preview.helperName, "buildApplyReparentRegisterCodeUndoActionPayload");
    assert.match(
      previewPayload.preview.helperSource,
      /function buildApplyReparentRegisterCodeUndoActionPayload\(movementLabel, elementDescription, payload, previewSnapshot\)/
    );
    assert.match(
      previewPayload.preview.updatedFunctionSource,
      /registerCodeUndoAction\(buildApplyReparentRegisterCodeUndoActionPayload\(movementLabel, elementDescription, payload, previewSnapshot\)\s*\);/s
    );
    assert.doesNotMatch(previewPayload.preview.helperName, /^format/i);
  });
});

test("extract-pure-block avoids helper name collisions inside the containing scope", async () => {
  const sourceText = [
    "function registerCodeUndoAction(payload) {",
    "  return payload;",
    "}",
    "",
    "function PragtSpecificityTool() {",
    "  function buildApplyTextRegisterCodeUndoActionPayload() {",
    "    return null;",
    "  }",
    "",
    "  async function handleApplyTextToCode(payload, previewSnapshot, editableTextTarget) {",
    "    registerCodeUndoAction({",
    "      label: `aplicar texto em ${editableTextTarget.description}`,",
    '      route: "/api/text",',
    "      undoRequest: {",
    '        operation: "undo",',
    '        sourceFilePath: payload.undoSnapshot?.sourceFilePath || "",',
    '        sourceText: payload.undoSnapshot?.sourceText || ""',
    "      },",
    "      previewSnapshot",
    "    });",
    "  }",
    "}"
  ].join("\n");

  await withTempSourceFile(sourceText, async ({ sourceFilePath }) => {
    const handler = createExtractPureBlockPostHandler({
      refactor: {
        allowedFilePaths: [sourceFilePath]
      }
    });

    const previewRequest = new Request("http://localhost/api/pragt/extract-pure-block", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        operation: "preview",
        script: sourceFilePath,
        functionName: "handleApplyTextToCode"
      })
    });

    const previewResponse = await handler(previewRequest);
    const previewPayload = await previewResponse.json();

    assert.equal(previewResponse.status, 200, previewPayload.error || "expected preview to succeed");
    assert.equal(previewPayload.ok, true);
    assert.equal(
      previewPayload.preview.helperName,
      "buildApplyTextRegisterCodeUndoActionPayloadHelper"
    );
    assert.match(
      previewPayload.preview.helperSource,
      /function buildApplyTextRegisterCodeUndoActionPayloadHelper\((editableTextTarget, payload, previewSnapshot|payload, previewSnapshot, editableTextTarget|previewSnapshot, payload, editableTextTarget)\)/
    );
  });
});

test("extract-pure-block falls back to dependency-injection surfacing when no pure block is available", async () => {
  const sourceText = [
    "function createPreviewStateSnapshot() {",
    "  return {};",
    "}",
    "",
    "function PragtSpecificityTool() {",
    "  const apiEndpoints = { reparentElement: \"/api/reparent\" };",
    "  const selectedElementSnapshot = { id: \"node\" };",
    "  const selectedElementParentDescription = \"wrapper\";",
    "  async function handleApplyReparentToCode(movement) {",
    "    if (movement !== \"promote\" && movement !== \"demote\") {",
    "      return;",
    "    }",
    "    const previewSnapshot = createPreviewStateSnapshot();",
    "    try {",
    "      const response = await fetch(apiEndpoints.reparentElement, {",
    '        method: "POST",',
    '        headers: { "Content-Type": "application/json" },',
    "        body: JSON.stringify({ pathname: window.location.pathname, movement, target: selectedElementSnapshot })",
    "      });",
    "      const payload = await response.json();",
    "      if (!response.ok) {",
    "        throw new Error(payload.error || `Falha em ${selectedElementParentDescription}`);",
    "      }",
    "      return previewSnapshot;",
    "    } catch (error) {",
    "      throw error;",
    "    }",
    "  }",
    "}"
  ].join("\n");

  await withTempSourceFile(sourceText, async ({ sourceFilePath }) => {
    const handler = createExtractPureBlockPostHandler({
      refactor: {
        allowedFilePaths: [sourceFilePath]
      }
    });

    const previewRequest = new Request("http://localhost/api/pragt/extract-pure-block", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        operation: "preview",
        script: sourceFilePath,
        functionName: "handleApplyReparentToCode"
      })
    });

    const previewResponse = await handler(previewRequest);
    const previewPayload = await previewResponse.json();

    assert.equal(previewResponse.status, 200, previewPayload.error || "expected preview to succeed");
    assert.equal(previewPayload.ok, true);
    assert.equal(previewPayload.preview.mode, "dependency-injection-surfacing");
    assert.equal(previewPayload.preview.helperName, "buildApplyReparentContext");
    assert.match(
      previewPayload.preview.helperSource,
      /function buildApplyReparentContext\(apiEndpoints, selectedElementSnapshot, selectedElementParentDescription, location\)/
    );
    assert.match(
      previewPayload.preview.updatedFunctionSource,
      /const applyReparentContext = buildApplyReparentContext\(apiEndpoints, selectedElementSnapshot, selectedElementParentDescription, window.location\);/
    );
  });
});

test("extract-pure-block falls back to side-effect isolation after pure extraction and dependency-injection surfacing", async () => {
  const sourceText = [
    "function PragtSpecificityTool() {",
    "  const apiEndpoints = { updateText: \"/api/text\" };",
    "  const requestOptions = { method: \"POST\" };",
    "  async function handleEffectOnly() {",
    "    try {",
    "      const response = await fetch(apiEndpoints.updateText, requestOptions);",
    "      const payload = await response.json();",
    "      if (!response.ok) {",
    "        throw new Error(payload.error || \"Falha ao sincronizar.\");",
    "      }",
    "      return payload;",
    "    } catch (error) {",
    "      throw error;",
    "    }",
    "  }",
    "}"
  ].join("\n");

  await withTempSourceFile(sourceText, async ({ sourceFilePath }) => {
    const handler = createExtractPureBlockPostHandler({
      refactor: {
        allowedFilePaths: [sourceFilePath]
      }
    });

    const previewRequest = new Request("http://localhost/api/pragt/extract-pure-block", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        operation: "preview",
        script: sourceFilePath,
        functionName: "handleEffectOnly"
      })
    });

    const previewResponse = await handler(previewRequest);
    const previewPayload = await previewResponse.json();

    assert.equal(previewResponse.status, 200, previewPayload.error || "expected preview to succeed");
    assert.equal(previewPayload.ok, true);
    assert.equal(previewPayload.preview.mode, "side-effect-isolation");
    assert.equal(previewPayload.preview.helperName, "performEffectOnlyRequest");
    assert.match(
      previewPayload.preview.helperSource,
      /async function performEffectOnlyRequest\(apiEndpoints, requestOptions\)/
    );
    assert.match(
      previewPayload.preview.updatedFunctionSource,
      /const payload = await performEffectOnlyRequest\(apiEndpoints, requestOptions\);/
    );
  });
});

test("extract-pure-block avoids helper name collisions against other named functions in the file", async () => {
  const sourceText = [
    "function submitColor(payload) {",
    "  return payload;",
    "}",
    "",
    "function buildApplyColorPayload() {",
    "  return null;",
    "}",
    "",
    "function handleApplyColorToCode(colorDraft, scope) {",
    "  const payload = {",
    "    propertyName: scope.propertyName,",
    "    colorValue: colorDraft",
    "  };",
    "",
    "  return submitColor(payload);",
    "}"
  ].join("\n");

  await withTempSourceFile(sourceText, async ({ sourceFilePath }) => {
    const handler = createExtractPureBlockPostHandler({
      refactor: {
        allowedFilePaths: [sourceFilePath]
      }
    });

    const previewRequest = new Request("http://localhost/api/pragt/extract-pure-block", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        operation: "preview",
        script: sourceFilePath,
        functionName: "handleApplyColorToCode"
      })
    });

    const previewResponse = await handler(previewRequest);
    const previewPayload = await previewResponse.json();

    assert.equal(previewResponse.status, 200, previewPayload.error || "expected preview to succeed");
    assert.equal(previewPayload.ok, true);
    assert.equal(previewPayload.preview.helperName, "buildApplyColorPayloadHelper");
  });
});

test("extract-pure-block resolves local context identifier collisions during dependency-injection surfacing", async () => {
  const sourceText = [
    "function createPreviewStateSnapshot() {",
    "  return {};",
    "}",
    "",
    "function PragtSpecificityTool() {",
    "  const apiEndpoints = { reparentElement: \"/api/reparent\" };",
    "  const selectedElementSnapshot = { id: \"node\" };",
    "  const selectedElementKey = \".node\";",
    "  const applyReparentContext = null;",
    "",
    "  async function handleApplyReparentToCode() {",
    "    const previewSnapshot = createPreviewStateSnapshot();",
    "",
    "    return registerCodeUndoAction({",
    "      route: apiEndpoints.reparentElement,",
    "      selector: selectedElementKey,",
    "      snapshot: selectedElementSnapshot,",
    "      pathname: window.location.pathname,",
    "      previewSnapshot",
    "    });",
    "  }",
    "}"
  ].join("\n");

  await withTempSourceFile(sourceText, async ({ sourceFilePath }) => {
    const handler = createExtractPureBlockPostHandler({
      refactor: {
        allowedFilePaths: [sourceFilePath]
      }
    });

    const previewRequest = new Request("http://localhost/api/pragt/extract-pure-block", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        operation: "preview",
        script: sourceFilePath,
        functionName: "handleApplyReparentToCode"
      })
    });

    const previewResponse = await handler(previewRequest);
    const previewPayload = await previewResponse.json();

    assert.equal(previewResponse.status, 200, previewPayload.error || "expected preview to succeed");
    assert.equal(previewPayload.ok, true);
    assert.equal(previewPayload.preview.mode, "dependency-injection-surfacing");
    assert.match(
      previewPayload.preview.updatedFunctionSource,
      /const applyReparentContextCtx = buildApplyReparentContext/
    );
  });
});

test("extract-pure-block applies input normalization for shape-based conditional logic", async () => {
  const sourceText = [
    "function formatRequirementSummary(requirements, inventory) {",
    "  return `${requirements.length}:${inventory.length}`;",
    "}",
    "",
    "function getWorldLabelById(targetId) {",
    "  return targetId;",
    "}",
    "",
    "function buildQuestProgressCopy(quest, inventory) {",
    "  if (quest.requirements) {",
    "    return formatRequirementSummary(quest.requirements, inventory);",
    "  }",
    "",
    "  if (quest.delivery) {",
    "    return formatRequirementSummary(quest.delivery, inventory);",
    "  }",
    "",
    "  return quest.targetId",
    "    ? `Alvo: ${getWorldLabelById(quest.targetId)}`",
    '    : "Livre exploracao";',
    "}",
    "",
    "function renderMissionCards(quest, inventory) {",
    "  return buildQuestProgressCopy(quest, inventory);",
    "}"
  ].join("\n");

  await withTempSourceFile(sourceText, async ({ sourceFilePath }) => {
    const handler = createExtractPureBlockPostHandler({
      refactor: {
        allowedFilePaths: [sourceFilePath]
      }
    });

    const previewRequest = new Request("http://localhost/api/pragt/extract-pure-block", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        operation: "preview",
        script: sourceFilePath,
        functionName: "buildQuestProgressCopy"
      })
    });

    const previewResponse = await handler(previewRequest);
    const previewPayload = await previewResponse.json();

    assert.equal(previewResponse.status, 200, previewPayload.error || "expected preview to succeed");
    assert.equal(previewPayload.ok, true);
    assert.equal(previewPayload.preview.mode, "input-normalization");
    assert.equal(previewPayload.preview.helperName, "getQuestProgressDescriptor");
    assert.match(
      previewPayload.preview.helperSource,
      /function getQuestProgressDescriptor\(quest\)/
    );
    assert.match(
      previewPayload.preview.updatedFunctionSource,
      /function buildQuestProgressCopy\(questProgressDescriptor, inventory\)/
    );
    assert.match(
      previewPayload.preview.updatedFunctionSource,
      /switch \(questProgressDescriptor\.kind\)/
    );
    assert.doesNotMatch(
      previewPayload.preview.updatedFunctionSource,
      /case "requirements":\s*case "delivery":/
    );
    assert.match(
      previewPayload.preview.beforeSource,
      /function buildQuestProgressCopy\(quest, inventory\)/
    );
    assert.match(
      previewPayload.preview.afterSource,
      /function buildQuestProgressCopy\(questProgressDescriptor, inventory\)/
    );
    assert.doesNotMatch(
      previewPayload.preview.afterSource,
      /function getQuestProgressDescriptor\(quest\)/
    );
    assert.doesNotMatch(
      previewPayload.preview.afterSource,
      /buildQuestProgressCopy\(getQuestProgressDescriptor\(quest\), inventory\)/
    );
    assert.match(
      previewPayload.preview.diff,
      /switch \(questProgressDescriptor\.kind\)/
    );

    const applyRequest = new Request("http://localhost/api/pragt/extract-pure-block", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        operation: "apply",
        script: sourceFilePath,
        functionName: "buildQuestProgressCopy",
        proposal: {
          mode: previewPayload.preview.mode,
          helperSource: previewPayload.preview.helperSource,
          updatedFunctionSource: previewPayload.preview.updatedFunctionSource
        }
      })
    });

    const applyResponse = await handler(applyRequest);
    const applyPayload = await applyResponse.json();
    const nextSource = await readFile(sourceFilePath, "utf8");

    assert.equal(applyResponse.status, 200, applyPayload.error || "expected apply to succeed");
    assert.equal(applyPayload.ok, true);
    assert.equal(applyPayload.helperName, "getQuestProgressDescriptor");
    assert.match(nextSource, /function getQuestProgressDescriptor\(quest\)/);
    assert.match(
      nextSource,
      /function buildQuestProgressCopy\(questProgressDescriptor, inventory\)/
    );
    assert.doesNotMatch(nextSource, /}function getQuestProgressDescriptor\(quest\)/);
    assert.doesNotMatch(nextSource, /case "requirements":\s*case "delivery":/);
    assert.match(
      nextSource,
      /return buildQuestProgressCopy\(getQuestProgressDescriptor\(quest\), inventory\);/
    );
  });
});
