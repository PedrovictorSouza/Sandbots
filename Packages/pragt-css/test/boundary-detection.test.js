import test from "node:test";
import assert from "node:assert/strict";
import {
  buildBoundaryDetectionReport,
  classifyFunctionBoundary,
  classifyModuleBoundary
} from "../src/server/boundary-detection.js";

function createAnalysis({
  filePath = "/workspace/packages/pragt-css/src/react/PragtCssTool.jsx",
  imports = [],
  exports = [],
  functions = [],
  moduleSummary = {},
  relationshipIndex = {}
} = {}) {
  return {
    filePath,
    imports,
    exports,
    functions,
    moduleSummary: Object.assign(
      {
        role: "unknown",
        publicAPI: [],
        publicAPIOrdered: [],
        internalHelpers: [],
        hiddenInputs: {},
        platformApis: {},
        internalReferences: {},
        sideEffects: "none detected"
      },
      moduleSummary
    ),
    relationshipIndex: Object.assign(
      {
        callers: {},
        callees: {},
        importedBy: []
      },
      relationshipIndex
    )
  };
}

test("classifies a React tool module as boundary/runtime-facing", () => {
  const analysis = createAnalysis({
    imports: [{ source: "react", specifiers: [{ local: "useState", imported: "useState" }] }],
    exports: [{ type: "default", declaration: "FunctionDeclaration", name: "PragtCssTool" }],
    functions: [{ name: "PragtCssTool", params: ["props"] }],
    moduleSummary: {
      publicAPI: ["PragtCssTool"],
      publicAPIOrdered: ["PragtCssTool"],
      hiddenInputs: {
        PragtCssTool: [{ path: "process.env.NODE_ENV", category: "env" }]
      },
      platformApis: {
        PragtCssTool: [{ path: "useState", category: "platform_api" }]
      }
    },
    relationshipIndex: {
      importedBy: ["/workspace/packages/pragt-css/src/browser/init.js"]
    }
  });

  const report = buildBoundaryDetectionReport(analysis);

  assert.equal(report.moduleBoundary.status, "boundary");
  assert.ok(report.moduleBoundary.confidence >= 0.8);
  assert.ok(report.moduleBoundary.reasons.some((reason) => /imports React/i.test(reason)));
  assert.ok(report.moduleBoundary.reasons.some((reason) => /default export detected/i.test(reason)));
  assert.ok(report.moduleBoundary.reasons.some((reason) => /browser\/init\.js/i.test(reason)));

  const functionBoundary = report.functionBoundaries.find((entry) => entry.functionName === "PragtCssTool");
  assert.equal(functionBoundary?.status, "boundary");
  assert.ok(functionBoundary?.reasons.some((reason) => /default exported top-level component/i.test(reason)));
  assert.ok(functionBoundary?.reasons.some((reason) => /uses process\.env\.NODE_ENV/i.test(reason)));
  assert.ok(functionBoundary?.reasons.some((reason) => /uses useState/i.test(reason)));
});

test("classifies helper-style utility module as internal", () => {
  const analysis = createAnalysis({
    filePath: "/workspace/packages/pragt-css/src/server/normalize-project-file-list.js",
    exports: [{ type: "named", declaration: "FunctionDeclaration", name: "normalizeProjectFileList", specifiers: [] }],
    functions: [{ name: "normalizeProjectFileList", params: ["files"] }],
    moduleSummary: {
      publicAPI: ["normalizeProjectFileList"],
      publicAPIOrdered: ["normalizeProjectFileList"],
      hiddenInputs: {},
      platformApis: {
        normalizeProjectFileList: [{ path: "Array.isArray", category: "platform_api" }]
      }
    }
  });

  const moduleBoundary = classifyModuleBoundary(analysis);
  const functionBoundary = classifyFunctionBoundary({
    functionName: "normalizeProjectFileList",
    analysis,
    moduleBoundary
  });

  assert.equal(moduleBoundary.status, "internal");
  assert.ok(moduleBoundary.reasons.some((reason) => /helper-style|no direct runtime\/framework/i.test(reason)));
  assert.equal(functionBoundary.status, "internal");
  assert.ok(functionBoundary.reasons.some((reason) => /helper-style function name normalizeProjectFileList/i.test(reason)));
  assert.ok(functionBoundary.reasons.some((reason) => /no direct runtime API usage/i.test(reason)));
});

test("returns unknown when helper/internal and runtime signals conflict", () => {
  const analysis = createAnalysis({
    filePath: "/workspace/packages/pragt-css/src/server/resolve-project-root.js",
    functions: [{ name: "resolveProjectRoot", params: [] }],
    moduleSummary: {
      internalHelpers: ["resolveProjectRoot"],
      hiddenInputs: {
        resolveProjectRoot: [{ path: "process.cwd", category: "env" }]
      },
      publicAPI: [],
      publicAPIOrdered: []
    }
  });

  const report = buildBoundaryDetectionReport(analysis);

  assert.equal(report.moduleBoundary.status, "unknown");
  assert.ok(report.moduleBoundary.reasons.some((reason) => /mixed|insufficient/i.test(reason)));

  const functionBoundary = report.functionBoundaries.find((entry) => entry.functionName === "resolveProjectRoot");
  assert.equal(functionBoundary?.status, "unknown");
  assert.ok(functionBoundary?.reasons.some((reason) => /mixed|insufficient/i.test(reason)));
});
