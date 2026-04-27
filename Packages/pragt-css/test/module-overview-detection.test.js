import test from "node:test";
import assert from "node:assert/strict";
import {
  buildModuleOverviewReport,
  classifyFunctionRole,
  classifyModuleRole,
  detectPrimaryEntrySymbol
} from "../src/server/module-overview-detection.js";

function createAnalysis({
  filePath = "/workspace/packages/pragt-css/src/react/PragtSpecificityTool.jsx",
  imports = [],
  exports = [],
  functions = [],
  moduleSummary = {},
  relationshipIndex = {},
  boundaryDetection = null,
  architectureLayerDetection = null
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
    boundaryDetection,
    architectureLayerDetection
  };
}

test("builds module overview for a React UI entry without spreading boundary to all functions", () => {
  const analysis = createAnalysis({
    imports: [{ source: "react", specifiers: [{ local: "useState", imported: "useState" }] }],
    exports: [{ type: "default", declaration: "FunctionDeclaration", name: "PragtSpecificityTool" }],
    functions: [
      { name: "PragtSpecificityTool", params: ["props"] },
      { name: "handleToggleDetachedMode", params: [] },
      { name: "handleApplyColorToCode", params: [] },
      { name: "scanStylePurposeMap", params: ["element"] },
      { name: "formatSpecificity", params: ["value"] }
    ],
    moduleSummary: {
      role: "ui runtime inspector",
      publicAPI: ["PragtSpecificityTool"],
      publicAPIOrdered: ["PragtSpecificityTool"],
      internalHelpers: [
        "handleToggleDetachedMode",
        "handleApplyColorToCode",
        "scanStylePurposeMap",
        "formatSpecificity"
      ],
      platformApis: {
        PragtSpecificityTool: [{ path: "useState", category: "platform_api" }],
        handleApplyColorToCode: [{ path: "fetch", category: "platform_api" }]
      }
    },
    relationshipIndex: {
      importedBy: ["/workspace/packages/pragt-css/src/browser/init.js"],
      callers: {
        formatSpecificity: ["scanStylePurposeMap"]
      },
      callees: {
        PragtSpecificityTool: ["useState", "handleToggleDetachedMode", "handleApplyColorToCode"],
        handleToggleDetachedMode: ["setIsDetached"],
        handleApplyColorToCode: ["fetch"],
        scanStylePurposeMap: ["formatSpecificity"]
      }
    }
  });

  const report = buildModuleOverviewReport(analysis);

  assert.equal(report.moduleRole.role, "boundary/runtime-facing");
  assert.ok(report.moduleRole.reasons.some((reason) => /imports React/i.test(reason)));
  assert.equal(report.primaryEntrySymbol.primarySymbol, "PragtSpecificityTool");
  assert.equal(report.primaryEntrySymbol.symbolType, "top-level entry");
  assert.ok(report.primaryEntrySymbol.reasons.some((reason) => /default exported component/i.test(reason)));

  const componentRole = report.functionRoles.find((entry) => entry.functionName === "PragtSpecificityTool");
  assert.equal(componentRole?.role, "ui-state-orchestrator");
  assert.ok(componentRole?.reasons.some((reason) => /primary entry symbol/i.test(reason)));

  const handlerRole = report.functionRoles.find((entry) => entry.functionName === "handleToggleDetachedMode");
  assert.equal(handlerRole?.role, "ui-event-handler");
  assert.ok(handlerRole?.reasons.some((reason) => /UI handler convention/i.test(reason)));

  const codeApplyRole = report.functionRoles.find((entry) => entry.functionName === "handleApplyColorToCode");
  assert.equal(codeApplyRole?.role, "code-apply-action");
  assert.ok(codeApplyRole?.reasons.some((reason) => /code apply action/i.test(reason)));

  const analysisRole = report.functionRoles.find((entry) => entry.functionName === "scanStylePurposeMap");
  assert.equal(analysisRole?.role, "analysis-engine");
  assert.ok(analysisRole?.reasons.some((reason) => /analysis\/audit work/i.test(reason)));

  const helperRole = report.functionRoles.find((entry) => entry.functionName === "formatSpecificity");
  assert.equal(helperRole?.role, "pure-helper");
  assert.ok(helperRole?.reasons.some((reason) => /helper-style function name/i.test(reason)));
});

test("classifies helper-oriented modules and preserves specific function roles", () => {
  const analysis = createAnalysis({
    filePath: "/workspace/packages/pragt-css/src/shared/selector-utils.js",
    functions: [
      { name: "mapSelectorPurpose", params: ["selector"] },
      { name: "normalizeApiBasePath", params: ["value"] },
      { name: "resolveSelectorToken", params: ["selector"] }
    ],
    exports: [{ type: "named", declaration: "FunctionDeclaration", name: "mapSelectorPurpose", specifiers: [] }],
    moduleSummary: {
      role: "selector normalization utilities",
      publicAPI: ["mapSelectorPurpose"],
      publicAPIOrdered: ["mapSelectorPurpose"],
      internalHelpers: ["normalizeApiBasePath", "resolveSelectorToken"]
    },
    relationshipIndex: {
      callers: {
        normalizeApiBasePath: ["mapSelectorPurpose"],
        resolveSelectorToken: ["mapSelectorPurpose"]
      },
      callees: {
        mapSelectorPurpose: ["normalizeApiBasePath", "resolveSelectorToken"]
      }
    }
  });

  const moduleRole = classifyModuleRole(analysis);
  assert.equal(moduleRole.role, "internal/helper-oriented");
  assert.ok(moduleRole.reasons.some((reason) => /no React\/runtime boundary signals/i.test(reason)));

  const primaryEntrySymbol = detectPrimaryEntrySymbol(analysis, moduleRole);
  assert.equal(primaryEntrySymbol.primarySymbol, "mapSelectorPurpose");
  assert.equal(primaryEntrySymbol.symbolType, "primary exported function");

  const analysisRole = classifyFunctionRole({
    functionName: "mapSelectorPurpose",
    analysis,
    moduleRole,
    primaryEntrySymbol
  });
  assert.equal(analysisRole.role, "analysis-engine");

  const pureHelperRole = classifyFunctionRole({
    functionName: "normalizeApiBasePath",
    analysis,
    moduleRole,
    primaryEntrySymbol
  });
  assert.equal(pureHelperRole.role, "pure-helper");

  const internalHelperRole = classifyFunctionRole({
    functionName: "resolveSelectorToken",
    analysis,
    moduleRole,
    primaryEntrySymbol
  });
  assert.equal(internalHelperRole.role, "internal-helper");
});

test("prefers runtime-effect when the function directly touches runtime APIs", () => {
  const analysis = createAnalysis({
    imports: [{ source: "react", specifiers: [] }],
    exports: [{ type: "default", declaration: "FunctionDeclaration", name: "RemotePickerPanel" }],
    functions: [
      { name: "RemotePickerPanel", params: [] },
      { name: "loadRemoteSelection", params: [] }
    ],
    moduleSummary: {
      role: "remote picker ui",
      publicAPI: ["RemotePickerPanel"],
      publicAPIOrdered: ["RemotePickerPanel"],
      internalHelpers: ["loadRemoteSelection"],
      platformApis: {
        loadRemoteSelection: [
          { path: "fetch", category: "platform_api" },
          { path: "window.addEventListener", category: "platform_api" }
        ]
      }
    }
  });

  const report = buildModuleOverviewReport(analysis);
  const runtimeRole = report.functionRoles.find((entry) => entry.functionName === "loadRemoteSelection");

  assert.equal(runtimeRole?.role, "runtime-effect");
  assert.ok(runtimeRole?.reasons.some((reason) => /runtime APIs or hidden inputs/i.test(reason)));
});
