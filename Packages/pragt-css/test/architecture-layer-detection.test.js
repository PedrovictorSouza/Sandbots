import test from "node:test";
import assert from "node:assert/strict";
import {
  buildArchitectureLayerReport,
  classifyFunctionLayer,
  classifyModuleLayer
} from "../src/server/architecture-layer-detection.js";

function createAnalysis({
  filePath = "/workspace/packages/pragt-css/src/react/PragtCssTool.jsx",
  imports = [],
  exports = [],
  functions = [],
  moduleSummary = {},
  relationshipIndex = {},
  boundaryDetection = null
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
    ),
    boundaryDetection
  };
}

test("classifies a React component module as UI", () => {
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

  const report = buildArchitectureLayerReport(analysis);

  assert.equal(report.moduleLayer.layer, "UI");
  assert.ok(report.moduleLayer.confidence >= 0.85);
  assert.ok(report.moduleLayer.reasons.some((reason) => /imports React/i.test(reason)));
  assert.ok(report.moduleLayer.reasons.some((reason) => /uses React hooks/i.test(reason)));

  const functionLayer = report.functionLayers.find((entry) => entry.functionName === "PragtCssTool");
  assert.equal(functionLayer?.layer, "UI");
  assert.ok(functionLayer?.reasons.some((reason) => /top-level React component/i.test(reason)));
  assert.ok(functionLayer?.reasons.some((reason) => /module classified as UI/i.test(reason)));
});

test("classifies config and path wiring module as Infrastructure with mixed function layers", () => {
  const analysis = createAnalysis({
    filePath: "/workspace/packages/pragt-css/src/next/project-config.js",
    imports: [{ source: "node:path", specifiers: [{ local: "path", imported: null }] }],
    exports: [{ type: "named", declaration: "FunctionDeclaration", name: "createPragtProjectConfig", specifiers: [] }],
    functions: [
      { name: "createPragtProjectConfig", params: ["args"] },
      { name: "createProjectFileResolver", params: ["projectRoot"] },
      { name: "normalizeProjectFileList", params: ["projectRoot", "filePaths"] }
    ],
    moduleSummary: {
      role: "config composition / file-path normalization",
      publicAPI: ["createPragtProjectConfig"],
      publicAPIOrdered: ["createPragtProjectConfig"],
      internalHelpers: ["createProjectFileResolver", "normalizeProjectFileList"],
      hiddenInputs: {
        createPragtProjectConfig: [{ path: "process.cwd", category: "env" }]
      },
      platformApis: {
        createProjectFileResolver: [
          { path: "path.normalize", category: "platform_api" },
          { path: "path.join", category: "platform_api" },
          { path: "path.isAbsolute", category: "platform_api" }
        ],
        normalizeProjectFileList: [{ path: "Array.isArray", category: "platform_api" }]
      }
    },
    relationshipIndex: {
      callers: {
        createProjectFileResolver: ["createPragtProjectConfig"],
        normalizeProjectFileList: ["createPragtProjectConfig"]
      },
      callees: {
        createPragtProjectConfig: ["createProjectFileResolver", "normalizeProjectFileList"]
      }
    }
  });

  const moduleLayer = classifyModuleLayer(analysis);
  assert.equal(moduleLayer.layer, "Infrastructure");
  assert.ok(moduleLayer.reasons.some((reason) => /imports runtime modules: node:path/i.test(reason)));
  assert.ok(moduleLayer.reasons.some((reason) => /process\.cwd/i.test(reason)));

  const pivotLayer = classifyFunctionLayer({
    functionName: "createPragtProjectConfig",
    analysis,
    moduleLayer
  });
  assert.equal(pivotLayer.layer, "Application");
  assert.ok(pivotLayer.reasons.some((reason) => /primary exported function/i.test(reason)));
  assert.ok(pivotLayer.reasons.some((reason) => /coordinates sibling functions/i.test(reason)));

  const resolverLayer = classifyFunctionLayer({
    functionName: "createProjectFileResolver",
    analysis,
    moduleLayer
  });
  assert.equal(resolverLayer.layer, "Infrastructure");
  assert.ok(resolverLayer.reasons.some((reason) => /path\.normalize|runtime\/platform APIs/i.test(reason)));

  const normalizerLayer = classifyFunctionLayer({
    functionName: "normalizeProjectFileList",
    analysis,
    moduleLayer
  });
  assert.equal(normalizerLayer.layer, "Domain");
  assert.ok(normalizerLayer.reasons.some((reason) => /helper-style function name normalizeProjectFileList/i.test(reason)));
  assert.ok(normalizerLayer.reasons.some((reason) => /no direct runtime\/framework usage/i.test(reason)));
});

test("returns Unknown when architecture signals are too weak or mixed", () => {
  const analysis = createAnalysis({
    filePath: "/workspace/packages/pragt-css/src/server/resolve-project-root.js",
    functions: [{ name: "resolveProjectRoot", params: [] }],
    moduleSummary: {
      internalHelpers: ["resolveProjectRoot"],
      hiddenInputs: {
        resolveProjectRoot: [{ path: "process.cwd", category: "env" }]
      }
    }
  });

  const report = buildArchitectureLayerReport(analysis);

  assert.equal(report.moduleLayer.layer, "Unknown");
  assert.ok(report.moduleLayer.reasons.some((reason) => /insufficient|mixed/i.test(reason)));

  const functionLayer = report.functionLayers.find((entry) => entry.functionName === "resolveProjectRoot");
  assert.equal(functionLayer?.layer, "Unknown");
  assert.ok(functionLayer?.reasons.some((reason) => /insufficient|mixed/i.test(reason)));
});
