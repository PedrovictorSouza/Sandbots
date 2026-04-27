const INTERNAL_HELPER_TOKENS = new Set([
  "build",
  "builder",
  "derive",
  "format",
  "helper",
  "map",
  "normalize",
  "normalizer",
  "parse",
  "resolve",
  "resolver",
  "transform",
  "util",
  "utility"
]);

const SOFT_BOUNDARY_TOKENS = new Set(["app", "tool"]);
const STRONG_BOUNDARY_TOKENS = new Set(["bootstrap", "config", "entry", "init", "main", "runtime"]);

function tokenizeName(name) {
  return String(name || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function inferHiddenInputKind(hiddenInputPath, hiddenInputCategory) {
  const path = String(hiddenInputPath || "");
  if (/^process\.cwd$/.test(path)) return "cwd";
  if (/^process\.env\.[A-Za-z0-9_]+$/.test(path)) return "env";
  if (/^Date\.now$/.test(path)) return "time";
  if (/^Math\.random$/.test(path)) return "random";
  return String(hiddenInputCategory || "unknown");
}

function hasExportForFunction(functionName, exportsList) {
  if (!functionName || !Array.isArray(exportsList)) return false;
  return exportsList.some((entry) => {
    if (!entry) return false;
    return Array.isArray(entry.specifiers) && entry.specifiers.some((specifier) => specifier?.local === functionName || specifier?.exported === functionName);
  });
}

function buildFunctionHeuristicContext({ functionName, hiddenInputKind, analysis }) {
  const moduleSummary = analysis?.moduleSummary || {};
  const roleText = String(moduleSummary.role || "");
  const roleTextLower = roleText.toLowerCase();
  const tokens = tokenizeName(functionName);
  const publicApiOrdered = Array.isArray(moduleSummary.publicAPIOrdered) ? moduleSummary.publicAPIOrdered : [];
  const publicApi = new Set(Array.isArray(moduleSummary.publicAPI) ? moduleSummary.publicAPI : publicApiOrdered);
  const internalHelpers = new Set(Array.isArray(moduleSummary.internalHelpers) ? moduleSummary.internalHelpers : []);
  const functionEntries = Array.isArray(analysis?.functions) ? analysis.functions : [];
  const namedFunctions = functionEntries.filter((entry) => entry?.name && entry.name !== "<anonymous>");
  const functionHiddenInputs = Array.isArray(moduleSummary.hiddenInputs?.[functionName]) ? moduleSummary.hiddenInputs[functionName] : [];
  const functionPlatformApis = Array.isArray(moduleSummary.platformApis?.[functionName]) ? moduleSummary.platformApis[functionName] : [];
  const hiddenCategories = new Set(functionHiddenInputs.map((entry) => entry?.category).filter(Boolean));

  if (hiddenInputKind) hiddenCategories.add(hiddenInputKind);

  const strongBoundaryName = tokens.some((token) => STRONG_BOUNDARY_TOKENS.has(token));
  const softBoundaryName = strongBoundaryName || tokens.some((token) => SOFT_BOUNDARY_TOKENS.has(token));
  const helperName = tokens.some((token) => INTERNAL_HELPER_TOKENS.has(token));
  const moduleLooksBoundary = /(bootstrap|composition|config|entry|integration|runtime|wiring)/.test(roleTextLower);
  const isExported = publicApi.has(functionName) || hasExportForFunction(functionName, analysis?.exports);
  const isPrimaryPublicFunction = publicApiOrdered[0] === functionName;
  const isOnlyNamedFunction = namedFunctions.length <= 1;
  const outgoingCalls = Array.isArray(analysis?.relationshipIndex?.callees?.[functionName]) ? analysis.relationshipIndex.callees[functionName] : [];
  const usesCombinedRuntimeApis =
    functionPlatformApis.length > 0 &&
    ["env", "random", "time", "network"].some((kind) => hiddenCategories.has(kind));
  const isLikelyPivotFunction =
    !!functionName &&
    (
      isPrimaryPublicFunction ||
      (isExported && isOnlyNamedFunction) ||
      (isExported && outgoingCalls.length >= 2 && !internalHelpers.has(functionName))
    );
  const isLikelyInternalHelper =
    !!functionName &&
    !isExported &&
    !isLikelyPivotFunction &&
    (internalHelpers.has(functionName) || helperName);
  const isRuntimeFacing =
    moduleLooksBoundary ||
    softBoundaryName ||
    usesCombinedRuntimeApis ||
    (isLikelyPivotFunction && (isExported || softBoundaryName));
  const isNaturalConfigurationBoundary =
    moduleLooksBoundary ||
    strongBoundaryName ||
    (isLikelyPivotFunction && usesCombinedRuntimeApis);
  const hasStrongInternalLogicSignal =
    isLikelyInternalHelper &&
    !softBoundaryName &&
    !moduleLooksBoundary &&
    !usesCombinedRuntimeApis;

  return {
    moduleRole: roleText,
    isExported,
    isLikelyPivotFunction,
    isLikelyInternalHelper,
    isRuntimeFacing,
    isNaturalConfigurationBoundary,
    hasStrongInternalLogicSignal,
    usesCombinedRuntimeApis,
    strongBoundaryName,
    softBoundaryName,
    helperName,
    platformApiCount: functionPlatformApis.length
  };
}

export function isExplicitParameterRefactorEligible(pathStr) {
  if (!pathStr) return false;
  const path = String(pathStr);
  if (/^process\.cwd$/.test(path)) return true;
  if (/^process\.env\.[A-Za-z0-9_]+$/.test(path)) return true;
  if (/^Date\.now$/.test(path)) return true;
  if (/^Math\.random$/.test(path)) return true;
  return false;
}

export function suggestExplicitParameterName(pathStr) {
  const path = String(pathStr || "");
  if (/^process\.cwd$/.test(path)) return "projectRoot";

  const envMatch = path.match(/^process\.env\.([A-Za-z0-9_]+)$/);
  if (envMatch) {
    const key = envMatch[1];
    const parts = key.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    if (!parts.length) return key.toLowerCase();
    return parts[0] + parts.slice(1).map((part) => part[0].toUpperCase() + part.slice(1)).join("");
  }

  if (/^Date\.now$/.test(path)) return "now";
  if (/^Math\.random$/.test(path)) return "randomFn";
  return path.replace(/[^a-zA-Z0-9]/g, "_");
}

export function evaluateRefactorSuitability({
  hiddenInputPath,
  hiddenInputCategory,
  functionName,
  analysis
}) {
  const hiddenInputKind = inferHiddenInputKind(hiddenInputPath, hiddenInputCategory);
  const context = buildFunctionHeuristicContext({ functionName, hiddenInputKind, analysis });

  if (hiddenInputKind === "cwd") {
    if (context.hasStrongInternalLogicSignal) {
      return {
        suitability: "safe",
        suitabilityReason: "working directory access sits inside an internal helper/resolver, which is a clean candidate for explicit injection",
        context
      };
    }

    if (context.isLikelyPivotFunction) {
      return {
        suitability: "review",
        suitabilityReason: "working directory access happens in the module pivot, so the refactor depends on whether this function is the intended composition boundary",
        context
      };
    }

    return {
      suitability: "review",
      suitabilityReason: "working directory access is injectable, but this function does not look clearly internal enough to promote it without architectural review",
      context
    };
  }

  if (hiddenInputKind === "time" || hiddenInputKind === "random") {
    if (context.isRuntimeFacing) {
      return {
        suitability: "review",
        suitabilityReason: "time/random access is technically injectable, but this function looks runtime-facing or boundary-oriented",
        context
      };
    }

    return {
      suitability: "safe",
      suitabilityReason: "time/random access is a classic dependency-injection candidate in internal logic",
      context
    };
  }

  if (hiddenInputKind === "env") {
    if (context.isNaturalConfigurationBoundary) {
      const roleSuffix = context.moduleRole ? ` (module role: ${context.moduleRole})` : "";
      return {
        suitability: "avoid",
        suitabilityReason: `environment variable is being read in a natural configuration/runtime boundary, so parameterizing it here would likely only move the coupling${roleSuffix}`,
        context
      };
    }

    if (context.hasStrongInternalLogicSignal) {
      return {
        suitability: "safe",
        suitabilityReason: "environment access appears inside reusable internal logic, which suggests accidental runtime coupling and a good injection opportunity",
        context
      };
    }

    return {
      suitability: "review",
      suitabilityReason: "environment variable may represent application-level runtime configuration rather than domain input",
      context
    };
  }

  return {
    suitability: "review",
    suitabilityReason: "this hidden input is technically refactorable, but the current heuristics do not have a stronger recommendation yet",
    context
  };
}

export function buildExplicitParameterRefactorProposal(item, options = {}) {
  const suggestedParameterName = suggestExplicitParameterName(item?.path);
  let refactorStrategy = "add-parameter-and-replace";
  let replacementExpression = suggestedParameterName;

  if (/^Math\.random$/.test(String(item?.path || ""))) {
    refactorStrategy = "add-parameter-function-and-replace-with-call";
    replacementExpression = `${suggestedParameterName}()`;
  }

  const suitability = evaluateRefactorSuitability({
    hiddenInputPath: item?.path,
    hiddenInputCategory: item?.category,
    functionName: item?.function,
    analysis: options.analysis
  });

  const beforeSummary = `Function ${item.function} reads ${item.path} from environment or runtime.`;
  const afterSummary = `Function ${item.function} will accept parameter ${suggestedParameterName} and use it instead of ${item.path}.`;

  return {
    functionName: item.function,
    hiddenInputPath: item.path,
    suggestedParameterName,
    refactorStrategy,
    beforeSummary,
    afterSummary,
    replacementExpression,
    suitability: suitability.suitability,
    suitabilityReason: suitability.suitabilityReason,
    metadata: {
      category: item.category,
      impact: item.impact,
      confidence: item.confidence,
      moduleRole: suitability.context.moduleRole || null,
      isPivotFunction: suitability.context.isLikelyPivotFunction,
      isBoundaryFunction: suitability.context.isRuntimeFacing
    }
  };
}

export function buildRefactorPreview(proposal) {
  return {
    functionName: proposal?.functionName || proposal?.function || "<anonymous>",
    hiddenInputPath: proposal?.hiddenInputPath || proposal?.path || "",
    suggestedParameterName: proposal?.suggestedParameterName || "",
    refactorStrategy: proposal?.refactorStrategy || "add-parameter-and-replace",
    suitability: proposal?.suitability || "unknown",
    suitabilityReason: proposal?.suitabilityReason || "no suitability reason available",
    beforeSummary: proposal?.beforeSummary || "",
    afterSummary: proposal?.afterSummary || "",
    replacementExpression: proposal?.replacementExpression || "",
    metadata: proposal?.metadata || {}
  };
}

export function buildExplicitParameterRefactorProposals(items, options = {}) {
  return Array.isArray(items) ? items.map((item) => buildExplicitParameterRefactorProposal(item, options)) : [];
}
