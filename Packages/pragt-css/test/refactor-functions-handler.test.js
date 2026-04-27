import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRefactorFunctionsPostHandler } from "../src/server/refactor-functions-handler.js";

async function withTempSourceFile(sourceText, runTest) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "pragt-refactor-plan-test-"));
  const sourceFilePath = path.join(tempDir, "tool.jsx");

  try {
    await writeFile(sourceFilePath, sourceText, "utf8");
    await runTest({ sourceFilePath, tempDir });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

test("refactor-functions builds a batch plan for the whole file", async () => {
  const sourceText = `function submitColor(payload) {
  return payload;
}

function parsePixelValue(value) {
  return Number.parseFloat(String(value || "").trim());
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
    const handler = createRefactorFunctionsPostHandler({
      refactor: {
        allowedFilePaths: [sourceFilePath]
      }
    });
    const request = new Request("http://localhost/api/pragt/refactor-functions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "plan",
        script: sourceFilePath
      })
    });

    const response = await handler(request);
    const payload = await response.json();

    assert.equal(response.status, 200, payload.error || "expected plan to succeed");
    assert.equal(payload.ok, true);
    assert.equal(payload.plan.totalFunctions, 3);
    assert.equal(payload.plan.eligibleFunctions.length, 1);
    assert.ok(Array.isArray(payload.plan.batches));
    assert.ok(payload.plan.batches.some((batch) => batch.key === "extract-first"));
  });
});

test("refactor-functions executes safe batches and leaves manual review functions untouched", async () => {
  const sourceText = `function submitColor(payload) {
  return payload;
}

function handlePersistSelection(value) {
  sessionStorage.setItem("selection", value);
  return value;
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
    const handler = createRefactorFunctionsPostHandler({
      refactor: {
        allowedFilePaths: [sourceFilePath]
      }
    });
    const request = new Request("http://localhost/api/pragt/refactor-functions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "execute-safe",
        script: sourceFilePath,
        maxIterations: 3
      })
    });

    const response = await handler(request);
    const payload = await response.json();
    const nextSource = await readFile(sourceFilePath, "utf8");

    assert.equal(response.status, 200, payload.error || "expected execute-safe to succeed");
    assert.equal(payload.ok, true);
    assert.equal(payload.changed, true);
    assert.ok(payload.report.changedFunctions.includes("handleApplyColorToCode"));
    assert.ok(payload.report.blockedFunctions.includes("handlePersistSelection"));
    assert.ok(payload.report.appliedBatches.includes("extract-first"));
    assert.match(nextSource, /function buildApplyColorPayload\(/);
    assert.match(nextSource, /sessionStorage\.setItem\("selection", value\)/);
  });
});

test("refactor-functions executes input normalization batches for shape-based conditional logic", async () => {
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
    const handler = createRefactorFunctionsPostHandler({
      refactor: {
        allowedFilePaths: [sourceFilePath]
      }
    });
    const request = new Request("http://localhost/api/pragt/refactor-functions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "execute-safe",
        script: sourceFilePath,
        maxIterations: 3,
        maxFunctions: 5
      })
    });

    const response = await handler(request);
    const payload = await response.json();
    const nextSource = await readFile(sourceFilePath, "utf8");

    assert.equal(response.status, 200, payload.error || "expected execute-safe to succeed");
    assert.equal(payload.ok, true);
    assert.equal(payload.changed, true);
    assert.ok(payload.report.changedFunctions.includes("buildQuestProgressCopy"));
    assert.ok(payload.report.appliedBatches.includes("shape-first"));
    assert.match(nextSource, /function getQuestProgressDescriptor\(quest\)/);
    assert.match(
      nextSource,
      /function buildQuestProgressCopy\(questProgressDescriptor, inventory\)/
    );
    assert.match(
      nextSource,
      /return buildQuestProgressCopy\(getQuestProgressDescriptor\(quest\), inventory\);/
    );
  });
});

test("refactor-functions stops execute-safe when the source file is structurally compacted", async () => {
  const sourceText = [
    "function submitColor(payload) { return payload; }function handleApplyColorToCode(colorDraft, scope) { const payload = { propertyName: scope.propertyName, colorValue: colorDraft, label: `${scope.propertyName}:${colorDraft}` }; return submitColor(payload); }",
    ""
  ].join("\n");

  await withTempSourceFile(sourceText, async ({ sourceFilePath }) => {
    const handler = createRefactorFunctionsPostHandler({
      refactor: {
        allowedFilePaths: [sourceFilePath]
      }
    });
    const request = new Request("http://localhost/api/pragt/refactor-functions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "execute-safe",
        script: sourceFilePath,
        maxIterations: 3
      })
    });

    const response = await handler(request);
    const payload = await response.json();
    const nextSource = await readFile(sourceFilePath, "utf8");

    assert.equal(response.status, 200, payload.error || "expected execute-safe to succeed");
    assert.equal(payload.ok, true);
    assert.equal(payload.changed, false);
    assert.equal(payload.report.stoppedReason, "source-compacted");
    assert.match(String(payload.report.guardMessage || ""), /normalize a formatacao/i);
    assert.equal(payload.report.appliedSteps.length, 0);
    assert.equal(payload.plan.executionPolicy.canExecuteSafeBatches, false);
    assert.match(String(payload.plan.warnings[0] || ""), /compactacao estrutural/i);
    assert.equal(nextSource, sourceText);
  });
});

test("refactor-functions inserts translated architecture annotations above the selected function", async () => {
  const sourceText = `function buildQuestProgressCopy(quest) {
  return quest;
}
`;

  await withTempSourceFile(sourceText, async ({ sourceFilePath }) => {
    const handler = createRefactorFunctionsPostHandler({
      refactor: {
        allowedFilePaths: [sourceFilePath]
      }
    });
    const request = new Request("http://localhost/api/pragt/refactor-functions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "insert-annotation",
        script: sourceFilePath,
        functionName: "buildQuestProgressCopy",
        annotationText: `role: construtor
camada: interface
deve permanecer puro`
      })
    });

    const response = await handler(request);
    const payload = await response.json();
    const nextSource = await readFile(sourceFilePath, "utf8");

    assert.equal(response.status, 200, payload.error || "expected annotation insertion to succeed");
    assert.equal(payload.ok, true);
    assert.equal(payload.functionName, "buildQuestProgressCopy");
    assert.equal(payload.translatedText, "@pragt-role builder\n@pragt-layer ui\nmust remain pure");
    assert.match(
      nextSource,
      /\/\*\n@pragt-role builder\n@pragt-layer ui\nmust remain pure\n\*\/\nfunction buildQuestProgressCopy/
    );
  });
});

test("refactor-functions replaces a previous pragt annotation and preserves nearby non-pragt comments", async () => {
  const sourceText = `/* regular comment */
/*
@pragt-role builder
*/
export const buildQuestProgressCopy = (quest) => {
  return quest;
};
`;

  await withTempSourceFile(sourceText, async ({ sourceFilePath }) => {
    const handler = createRefactorFunctionsPostHandler({
      refactor: {
        allowedFilePaths: [sourceFilePath]
      }
    });
    const request = new Request("http://localhost/api/pragt/refactor-functions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "insert-annotation",
        script: sourceFilePath,
        functionName: "buildQuestProgressCopy",
        annotationText: "camada: interface"
      })
    });

    const response = await handler(request);
    const payload = await response.json();
    const nextSource = await readFile(sourceFilePath, "utf8");

    assert.equal(response.status, 200, payload.error || "expected annotation replacement to succeed");
    assert.match(
      nextSource,
      /\/\* regular comment \*\/\n\/\*\n@pragt-layer ui\n\*\/\nexport const buildQuestProgressCopy/
    );
    assert.doesNotMatch(nextSource, /@pragt-role builder/);
  });
});
