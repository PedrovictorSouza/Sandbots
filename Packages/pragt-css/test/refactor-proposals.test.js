import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRefactorPreview,
  buildExplicitParameterRefactorProposal,
  evaluateRefactorSuitability
} from "../src/react/refactor-proposals.js";

function createAnalysis({
  role = "unknown",
  publicAPI = [],
  publicAPIOrdered = publicAPI,
  internalHelpers = [],
  functions = [],
  hiddenInputs = {},
  platformApis = {},
  exports = [],
  relationshipIndex = {}
} = {}) {
  return {
    exports,
    functions,
    moduleSummary: {
      role,
      publicAPI,
      publicAPIOrdered,
      internalHelpers,
      hiddenInputs,
      platformApis
    },
    relationshipIndex
  };
}

test("classifies process.env.NODE_ENV in PragtCssTool as review", () => {
  const analysis = createAnalysis({
    publicAPI: ["PragtCssTool"],
    publicAPIOrdered: ["PragtCssTool"],
    functions: [{ name: "PragtCssTool" }],
    hiddenInputs: {
      PragtCssTool: [{ path: "process.env.NODE_ENV", category: "env" }]
    }
  });

  const result = evaluateRefactorSuitability({
    hiddenInputPath: "process.env.NODE_ENV",
    hiddenInputCategory: "env",
    functionName: "PragtCssTool",
    analysis
  });

  assert.equal(result.suitability, "review");
  assert.match(result.suitabilityReason, /application-level runtime configuration/i);
});

test("classifies process.cwd in an internal resolver as safe", () => {
  const analysis = createAnalysis({
    publicAPI: ["createPragtProjectConfig"],
    publicAPIOrdered: ["createPragtProjectConfig"],
    internalHelpers: ["resolveProjectFile"],
    functions: [{ name: "createPragtProjectConfig" }, { name: "resolveProjectFile" }],
    hiddenInputs: {
      resolveProjectFile: [{ path: "process.cwd", category: "env" }]
    }
  });

  const proposal = buildExplicitParameterRefactorProposal(
    {
      function: "resolveProjectFile",
      path: "process.cwd",
      category: "env",
      impact: "medium",
      confidence: 0.9
    },
    { analysis }
  );

  assert.equal(proposal.suitability, "safe");
  assert.equal(proposal.suggestedParameterName, "projectRoot");
  assert.match(proposal.suitabilityReason, /internal helper\/resolver/i);
});

test("classifies process.env feature flags in config boundary as avoid", () => {
  const analysis = createAnalysis({
    role: "config composition / file-path normalization",
    publicAPI: ["createPragtProjectConfig"],
    publicAPIOrdered: ["createPragtProjectConfig"],
    functions: [{ name: "createPragtProjectConfig" }],
    hiddenInputs: {
      createPragtProjectConfig: [{ path: "process.env.FEATURE_FLAG", category: "env" }]
    },
    platformApis: {
      createPragtProjectConfig: [{ path: "path.resolve", category: "platform_api" }]
    },
    relationshipIndex: {
      callees: {
        createPragtProjectConfig: ["path.resolve", "resolveProjectFile"]
      }
    }
  });

  const result = evaluateRefactorSuitability({
    hiddenInputPath: "process.env.FEATURE_FLAG",
    hiddenInputCategory: "env",
    functionName: "createPragtProjectConfig",
    analysis
  });

  assert.equal(result.suitability, "avoid");
  assert.match(result.suitabilityReason, /natural configuration\/runtime boundary/i);
});

test("classifies Date.now in internal logic as safe", () => {
  const analysis = createAnalysis({
    internalHelpers: ["buildSessionSnapshot"],
    functions: [{ name: "buildSessionSnapshot" }],
    hiddenInputs: {
      buildSessionSnapshot: [{ path: "Date.now", category: "time" }]
    }
  });

  const result = evaluateRefactorSuitability({
    hiddenInputPath: "Date.now",
    hiddenInputCategory: "time",
    functionName: "buildSessionSnapshot",
    analysis
  });

  assert.equal(result.suitability, "safe");
  assert.match(result.suitabilityReason, /classic dependency-injection candidate/i);
});

test("classifies Math.random in a runtime-facing App as review", () => {
  const analysis = createAnalysis({
    publicAPI: ["MainApp"],
    publicAPIOrdered: ["MainApp"],
    functions: [{ name: "MainApp" }],
    hiddenInputs: {
      MainApp: [{ path: "Math.random", category: "random" }]
    }
  });

  const result = evaluateRefactorSuitability({
    hiddenInputPath: "Math.random",
    hiddenInputCategory: "random",
    functionName: "MainApp",
    analysis
  });

  assert.equal(result.suitability, "review");
  assert.match(result.suitabilityReason, /runtime-facing or boundary-oriented/i);
});

test("propagates suitability fields into refactor preview", () => {
  const analysis = createAnalysis({
    publicAPI: ["PragtCssTool"],
    publicAPIOrdered: ["PragtCssTool"],
    functions: [{ name: "PragtCssTool" }],
    hiddenInputs: {
      PragtCssTool: [{ path: "process.env.NODE_ENV", category: "env" }]
    }
  });

  const proposal = buildExplicitParameterRefactorProposal(
    {
      function: "PragtCssTool",
      path: "process.env.NODE_ENV",
      category: "env",
      impact: "medium",
      confidence: 0.9
    },
    { analysis }
  );
  const preview = buildRefactorPreview(proposal);

  assert.equal(preview.functionName, "PragtCssTool");
  assert.equal(preview.hiddenInputPath, "process.env.NODE_ENV");
  assert.equal(preview.suitability, "review");
  assert.match(preview.suitabilityReason, /application-level runtime configuration/i);
});

test("uses a clear fallback when suitability reason is missing in preview input", () => {
  const preview = buildRefactorPreview({
    functionName: "PragtCssTool",
    hiddenInputPath: "process.env.NODE_ENV",
    suitability: "review"
  });

  assert.equal(preview.suitability, "review");
  assert.equal(preview.suitabilityReason, "no suitability reason available");
});
