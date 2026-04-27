import path from "node:path";

const BOUNDARY_NAME_TOKENS = new Set(["app", "bootstrap", "entry", "init", "main", "root", "runtime", "tool"]);
const HELPER_NAME_PATTERN = /^(build|collect|derive|format|map|normalize|parse|resolve|transform)/i;
const BROWSER_PATH_PATTERN = /^(document|window|localStorage|sessionStorage|navigator|location|history)(\.|$)/;
const ENV_PATH_PATTERN = /^process(\.|$)/;
const NETWORK_PATH_PATTERN = /^(fetch|XMLHttpRequest)(\.|$)|axios|got|node-fetch|http|https/i;
const TIME_RANDOM_PATH_PATTERN = /^(Date\.now|Math\.random)$/;
const NODE_PLATFORM_PATH_PATTERN = /^(path|fs|os|url|crypto|stream|net|tty|zlib)(\.|$)|^node:/;
const REACT_IMPORT_PATTERN = /^(react|react-dom)$/i;
const UI_FRAMEWORK_IMPORT_PATTERN = /^(react|react-dom|next($|\/)|preact|solid-js|vue|svelte)/i;
const ENTRYPOINT_PATH_PATTERN = /(^|[\\/])(browser[\\/](init|main)|bootstrap|entry|init|main|root|runtime)(\.[jt]sx?)?$/i;
const NODE_RUNTIME_IMPORTS = new Set([
  "assert",
  "buffer",
  "child_process",
  "crypto",
  "events",
  "fs",
  "http",
  "https",
  "net",
  "os",
  "path",
  "process",
  "stream",
  "timers",
  "tty",
  "url",
  "util",
  "zlib"
]);

function roundConfidence(value) {
  return Number(Math.max(0, Math.min(0.99, value)).toFixed(2));
}

function tokenizeName(name) {
  return String(name || "")
    .replace(/\.[^.]+$/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function uniqueStrings(values) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

function pushWeightedReason(bucket, text, weight) {
  if (!text) return;
  const existing = bucket.get(text);
  if (!existing || existing.weight < weight) bucket.set(text, { text, weight });
}

function sortReasons(bucket) {
  return Array.from(bucket.values()).sort((a, b) => b.weight - a.weight || a.text.localeCompare(b.text));
}

function shortPathLabel(filePath) {
  const normalized = String(filePath || "").replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);
  return parts.slice(-3).join("/") || normalized;
}

function sampleList(values, max = 3) {
  return uniqueStrings(values).slice(0, max);
}

function flattenDependencyMap(map) {
  return Object.entries(map || {}).flatMap(([functionName, entries]) =>
    (entries || []).map((entry) => Object.assign({ functionName }, entry))
  );
}

function hasDefaultExport(exportsList) {
  return Array.isArray(exportsList) && exportsList.some((entry) => entry?.type === "default");
}

function getDefaultExportName(exportsList) {
  const entry = Array.isArray(exportsList) ? exportsList.find((item) => item?.type === "default") : null;
  return entry?.name || null;
}

function isNodeRuntimeImport(source) {
  const value = String(source || "");
  return value.startsWith("node:") || NODE_RUNTIME_IMPORTS.has(value);
}

function isEntrypointLikePath(filePath) {
  return ENTRYPOINT_PATH_PATTERN.test(String(filePath || ""));
}

function isHelperStyleName(name) {
  return HELPER_NAME_PATTERN.test(String(name || ""));
}

function isBoundaryStyleName(name) {
  return tokenizeName(name).some((token) => BOUNDARY_NAME_TOKENS.has(token));
}

function isReactHookName(name) {
  return /^use[A-Z]/.test(String(name || ""));
}

function isStrongRuntimeHiddenPath(pathValue) {
  const pathText = String(pathValue || "");
  return ENV_PATH_PATTERN.test(pathText) || BROWSER_PATH_PATTERN.test(pathText) || NETWORK_PATH_PATTERN.test(pathText);
}

function isWeakRuntimeHiddenPath(pathValue) {
  return TIME_RANDOM_PATH_PATTERN.test(String(pathValue || ""));
}

function isRuntimePlatformPath(pathValue) {
  const pathText = String(pathValue || "");
  return BROWSER_PATH_PATTERN.test(pathText) || NETWORK_PATH_PATTERN.test(pathText) || NODE_PLATFORM_PATH_PATTERN.test(pathText);
}

function buildEvidenceSummary(reasonsMap, fallbackReason) {
  const reasons = sortReasons(reasonsMap).map((entry) => entry.text);
  return reasons.length ? reasons : [fallbackReason];
}

function determineStatus(boundaryScore, internalScore, thresholds) {
  if (boundaryScore >= thresholds.boundaryMin && boundaryScore >= internalScore + thresholds.margin) return "boundary";
  if (internalScore >= thresholds.internalMin && internalScore >= boundaryScore + thresholds.margin) return "internal";
  return "unknown";
}

function determineConfidence(status, boundaryScore, internalScore) {
  const dominant = Math.max(boundaryScore, internalScore);
  const diff = Math.abs(boundaryScore - internalScore);
  if (status === "unknown") {
    return roundConfidence(0.38 + Math.min(0.22, dominant * 0.04 + diff * 0.03));
  }
  return roundConfidence(0.56 + Math.min(0.39, dominant * 0.06 + diff * 0.08));
}

function collectFunctionUsage(functionName, moduleSummary) {
  return {
    hiddenInputs: Array.isArray(moduleSummary?.hiddenInputs?.[functionName]) ? moduleSummary.hiddenInputs[functionName] : [],
    platformApis: Array.isArray(moduleSummary?.platformApis?.[functionName]) ? moduleSummary.platformApis[functionName] : [],
    internalReferences: Array.isArray(moduleSummary?.internalReferences?.[functionName]) ? moduleSummary.internalReferences[functionName] : []
  };
}

export function classifyModuleBoundary(analysis) {
  const imports = Array.isArray(analysis?.imports) ? analysis.imports : [];
  const exportsList = Array.isArray(analysis?.exports) ? analysis.exports : [];
  const functions = Array.isArray(analysis?.functions) ? analysis.functions.filter((entry) => entry?.name && entry.name !== "<anonymous>") : [];
  const moduleSummary = analysis?.moduleSummary || {};
  const importedBy = Array.isArray(analysis?.relationshipIndex?.importedBy) ? analysis.relationshipIndex.importedBy : [];
  const roleText = String(moduleSummary.role || "");
  const roleTextLower = roleText.toLowerCase();
  const publicAPIOrdered = Array.isArray(moduleSummary.publicAPIOrdered) ? moduleSummary.publicAPIOrdered : [];
  const fileBaseName = path.basename(String(analysis?.filePath || ""), path.extname(String(analysis?.filePath || "")));
  const fileNameLooksBoundary = isBoundaryStyleName(fileBaseName);
  const fileNameLooksHelper = isHelperStyleName(fileBaseName);
  const defaultExportPresent = hasDefaultExport(exportsList);
  const defaultExportName = getDefaultExportName(exportsList);
  const hiddenEntries = flattenDependencyMap(moduleSummary.hiddenInputs);
  const platformEntries = flattenDependencyMap(moduleSummary.platformApis);
  const reactImports = imports.filter((entry) => REACT_IMPORT_PATTERN.test(String(entry?.source || "")));
  const uiFrameworkImports = imports.filter((entry) => UI_FRAMEWORK_IMPORT_PATTERN.test(String(entry?.source || "")));
  const nodeRuntimeImports = uniqueStrings(imports.map((entry) => entry?.source).filter(isNodeRuntimeImport));
  const boundaryReasons = new Map();
  const internalReasons = new Map();

  const hookNames = sampleList(
    platformEntries
      .map((entry) => entry.path)
      .filter((pathValue) => isReactHookName(pathValue))
  );
  const strongHiddenPaths = sampleList(hiddenEntries.map((entry) => entry.path).filter((pathValue) => isStrongRuntimeHiddenPath(pathValue)), 4);
  const weakHiddenPaths = sampleList(hiddenEntries.map((entry) => entry.path).filter((pathValue) => isWeakRuntimeHiddenPath(pathValue)), 2);
  const runtimePlatformPaths = sampleList(platformEntries.map((entry) => entry.path).filter((pathValue) => isRuntimePlatformPath(pathValue)), 4);
  const exportedFunctionsWithRuntime = sampleList(
    publicAPIOrdered.filter((functionName) => {
      const usage = collectFunctionUsage(functionName, moduleSummary);
      return usage.hiddenInputs.some((entry) => isStrongRuntimeHiddenPath(entry.path));
    })
  );
  const entrypointConsumers = sampleList(importedBy.filter((filePath) => isEntrypointLikePath(filePath)));
  const hasStrongRuntimeSignals =
    reactImports.length > 0 ||
    nodeRuntimeImports.length > 0 ||
    strongHiddenPaths.length > 0 ||
    runtimePlatformPaths.length > 0 ||
    hookNames.length > 0 ||
    entrypointConsumers.length > 0 ||
    /(bootstrap|config|entry|integration|runtime|wiring)/.test(roleTextLower);
  const hasDirectRuntimeCoupling =
    reactImports.length > 0 ||
    nodeRuntimeImports.length > 0 ||
    strongHiddenPaths.length > 0 ||
    runtimePlatformPaths.length > 0 ||
    hookNames.length > 0;
  const helperLikeFunctions = functions.filter((entry) => isHelperStyleName(entry.name)).map((entry) => entry.name);

  if (reactImports.length) {
    pushWeightedReason(boundaryReasons, "imports React", 1.2);
  }

  if (uiFrameworkImports.length && !reactImports.length) {
    pushWeightedReason(
      boundaryReasons,
      `imports UI/runtime framework: ${sampleList(uiFrameworkImports.map((entry) => entry.source)).join(", ")}`,
      1
    );
  }

  if (nodeRuntimeImports.length) {
    pushWeightedReason(
      boundaryReasons,
      `imports Node runtime modules: ${sampleList(nodeRuntimeImports).join(", ")}`,
      0.85
    );
  }

  if (defaultExportPresent) {
    pushWeightedReason(boundaryReasons, "default export detected", 0.95);
  }

  if (defaultExportName && isBoundaryStyleName(defaultExportName)) {
    pushWeightedReason(boundaryReasons, `default export name suggests top-level role: ${defaultExportName}`, 0.75);
  }

  if (fileNameLooksBoundary) {
    pushWeightedReason(boundaryReasons, `filename suggests top-level runtime/UI role: ${fileBaseName}`, 0.75);
  }

  if (entrypointConsumers.length) {
    pushWeightedReason(
      boundaryReasons,
      `consumed by ${entrypointConsumers.map((filePath) => shortPathLabel(filePath)).join(", ")}`,
      1.15
    );
  }

  if (strongHiddenPaths.length) {
    pushWeightedReason(
      boundaryReasons,
      `uses runtime hidden inputs: ${strongHiddenPaths.join(", ")}`,
      1.05
    );
  }

  if (exportedFunctionsWithRuntime.length) {
    pushWeightedReason(
      boundaryReasons,
      `runtime hidden inputs appear in exported function${exportedFunctionsWithRuntime.length > 1 ? "s" : ""}: ${exportedFunctionsWithRuntime.join(", ")}`,
      0.9
    );
  }

  if (hookNames.length) {
    pushWeightedReason(
      boundaryReasons,
      `contains React hook usage: ${hookNames.join(", ")}`,
      0.9
    );
  }

  if (runtimePlatformPaths.length) {
    pushWeightedReason(
      boundaryReasons,
      `uses runtime/platform APIs: ${runtimePlatformPaths.join(", ")}`,
      0.7
    );
  }

  if (/(bootstrap|config|entry|integration|runtime|wiring|composition)/.test(roleTextLower)) {
    pushWeightedReason(boundaryReasons, `module role suggests runtime/configuration wiring: ${roleText}`, 0.9);
  }

  if (moduleSummary.sideEffects && moduleSummary.sideEffects !== "none detected") {
    pushWeightedReason(boundaryReasons, `top-level side effects detected: ${moduleSummary.sideEffects}`, 0.55);
  }

  if (!hasStrongRuntimeSignals) {
    pushWeightedReason(internalReasons, "no direct runtime/framework signals detected", 1);
  }

  if (functions.length && helperLikeFunctions.length === functions.length && !hasDirectRuntimeCoupling) {
    pushWeightedReason(
      internalReasons,
      `functions look helper-style: ${sampleList(helperLikeFunctions, 4).join(", ")}`,
      1.15
    );
  }

  if (fileNameLooksHelper && !fileNameLooksBoundary && !hasDirectRuntimeCoupling) {
    pushWeightedReason(internalReasons, `filename suggests helper/internal role: ${fileBaseName}`, 0.7);
  }

  if (functions.length && publicAPIOrdered.length <= 1 && helperLikeFunctions.length === functions.length && !defaultExportPresent && !hasDirectRuntimeCoupling) {
    pushWeightedReason(internalReasons, "module surface looks like utility/helper API", 0.85);
  }

  if (functions.length && helperLikeFunctions.length >= Math.max(1, functions.length - 1) && !hasDirectRuntimeCoupling) {
    pushWeightedReason(internalReasons, "most detected functions look like internal transformation/helpers", 0.8);
  }

  if (!imports.length && !publicAPIOrdered.length && functions.length && !hasDirectRuntimeCoupling) {
    pushWeightedReason(internalReasons, "module has no framework/runtime imports and no public API surface", 0.75);
  }

  if (weakHiddenPaths.length && !strongHiddenPaths.length && !runtimePlatformPaths.length) {
    pushWeightedReason(boundaryReasons, `contains weak runtime signals: ${weakHiddenPaths.join(", ")}`, 0.35);
  }

  const boundaryScore = sortReasons(boundaryReasons).reduce((sum, entry) => sum + entry.weight, 0);
  const internalScore = sortReasons(internalReasons).reduce((sum, entry) => sum + entry.weight, 0);
  const status = determineStatus(boundaryScore, internalScore, {
    boundaryMin: 2.35,
    internalMin: 2.2,
    margin: 0.8
  });

  let reasons;
  if (status === "boundary") {
    reasons = buildEvidenceSummary(boundaryReasons, "boundary/runtime-facing signals detected");
  } else if (status === "internal") {
    reasons = buildEvidenceSummary(internalReasons, "helper/internal signals dominate");
  } else if (boundaryScore > 0 && internalScore > 0) {
    reasons = [
      "signals are mixed between boundary/runtime-facing and helper/internal indicators",
      ...buildEvidenceSummary(boundaryReasons, "").slice(0, 2),
      ...buildEvidenceSummary(internalReasons, "").slice(0, 2)
    ].filter(Boolean);
  } else {
    reasons = [
      boundaryScore > 0 ? buildEvidenceSummary(boundaryReasons, "some runtime-facing signals detected")[0] : null,
      internalScore > 0 ? buildEvidenceSummary(internalReasons, "some helper/internal signals detected")[0] : null,
      "insufficient strong evidence to classify the module confidently"
    ].filter(Boolean);
  }

  return {
    status,
    confidence: determineConfidence(status, boundaryScore, internalScore),
    reasons: uniqueStrings(reasons).slice(0, 5)
  };
}

export function classifyFunctionBoundary({ functionName, analysis, moduleBoundary }) {
  const moduleSummary = analysis?.moduleSummary || {};
  const relationshipIndex = analysis?.relationshipIndex || {};
  const exportsList = Array.isArray(analysis?.exports) ? analysis.exports : [];
  const publicAPIOrdered = Array.isArray(moduleSummary.publicAPIOrdered) ? moduleSummary.publicAPIOrdered : [];
  const publicAPI = new Set(Array.isArray(moduleSummary.publicAPI) ? moduleSummary.publicAPI : publicAPIOrdered);
  const defaultExportName = getDefaultExportName(exportsList);
  const importedBy = Array.isArray(relationshipIndex.importedBy) ? relationshipIndex.importedBy : [];
  const callers = Array.isArray(relationshipIndex.callers?.[functionName]) ? relationshipIndex.callers[functionName] : [];
  const moduleReactImport = Array.isArray(analysis?.imports) && analysis.imports.some((entry) => REACT_IMPORT_PATTERN.test(String(entry?.source || "")));
  const usage = collectFunctionUsage(functionName, moduleSummary);
  const boundaryReasons = new Map();
  const internalReasons = new Map();
  const isExported = publicAPI.has(functionName);
  const isPrimaryPublicFunction = publicAPIOrdered[0] === functionName;
  const isDefaultExport = defaultExportName === functionName;
  const helperStyleName = isHelperStyleName(functionName);
  const boundaryStyleName = isBoundaryStyleName(functionName);
  const strongHiddenPaths = sampleList(usage.hiddenInputs.map((entry) => entry.path).filter((pathValue) => isStrongRuntimeHiddenPath(pathValue)), 3);
  const weakHiddenPaths = sampleList(usage.hiddenInputs.map((entry) => entry.path).filter((pathValue) => isWeakRuntimeHiddenPath(pathValue)), 2);
  const runtimePlatformPaths = sampleList(usage.platformApis.map((entry) => entry.path).filter((pathValue) => isRuntimePlatformPath(pathValue)), 3);
  const hookNames = sampleList(usage.platformApis.map((entry) => entry.path).filter((pathValue) => isReactHookName(pathValue)), 3);
  const entrypointConsumers = sampleList(importedBy.filter((filePath) => isEntrypointLikePath(filePath)));
  const hasDirectRuntimeUsage = strongHiddenPaths.length > 0 || runtimePlatformPaths.length > 0 || hookNames.length > 0;

  if (isDefaultExport && moduleReactImport) {
    pushWeightedReason(boundaryReasons, "default exported top-level component", 1.3);
  } else if (isDefaultExport) {
    pushWeightedReason(boundaryReasons, "default exported function", 1.05);
  }

  if (isPrimaryPublicFunction) {
    pushWeightedReason(boundaryReasons, "primary exported function in module", 0.85);
  }

  if (boundaryStyleName) {
    pushWeightedReason(boundaryReasons, `function name suggests top-level runtime/UI role: ${functionName}`, 0.75);
  }

  if (strongHiddenPaths.length) {
    strongHiddenPaths.forEach((pathValue) => {
      pushWeightedReason(boundaryReasons, `uses ${pathValue}`, 0.85);
    });
  }

  if (hookNames.length) {
    hookNames.forEach((hookName) => {
      pushWeightedReason(boundaryReasons, `uses ${hookName}`, 0.8);
    });
  }

  if (runtimePlatformPaths.length) {
    runtimePlatformPaths.forEach((pathValue) => {
      pushWeightedReason(boundaryReasons, `uses runtime/platform API ${pathValue}`, 0.65);
    });
  }

  if (entrypointConsumers.length && (isExported || isDefaultExport || boundaryStyleName)) {
    pushWeightedReason(
      boundaryReasons,
      `module is consumed by ${entrypointConsumers.map((filePath) => shortPathLabel(filePath)).join(", ")}`,
      0.75
    );
  }

  if (moduleBoundary?.status === "boundary" && (isExported || boundaryStyleName || hasDirectRuntimeUsage)) {
    pushWeightedReason(boundaryReasons, "lives inside a module classified as boundary/runtime-facing", 0.45);
  }

  if (weakHiddenPaths.length && !strongHiddenPaths.length) {
    weakHiddenPaths.forEach((pathValue) => {
      pushWeightedReason(boundaryReasons, `uses weak runtime signal ${pathValue}`, 0.3);
    });
  }

  if (!isExported) {
    pushWeightedReason(internalReasons, "not exported from module", 0.7);
  }

  if (helperStyleName) {
    pushWeightedReason(internalReasons, `helper-style function name ${functionName}`, 0.95);
  }

  if (!hasDirectRuntimeUsage && !weakHiddenPaths.length) {
    pushWeightedReason(internalReasons, "no direct runtime API usage", 0.95);
  }

  if (!isExported && callers.length) {
    pushWeightedReason(internalReasons, "used only by sibling functions in the same module", 0.6);
  }

  if (moduleBoundary?.status === "internal" && !hasDirectRuntimeUsage) {
    pushWeightedReason(internalReasons, "lives inside a module classified as internal/helper-oriented", 0.45);
  }

  const boundaryScore = sortReasons(boundaryReasons).reduce((sum, entry) => sum + entry.weight, 0);
  const internalScore = sortReasons(internalReasons).reduce((sum, entry) => sum + entry.weight, 0);
  const status = determineStatus(boundaryScore, internalScore, {
    boundaryMin: 1.95,
    internalMin: 1.85,
    margin: 0.7
  });

  let reasons;
  if (status === "boundary") {
    reasons = buildEvidenceSummary(boundaryReasons, "boundary/runtime-facing signals dominate");
  } else if (status === "internal") {
    reasons = buildEvidenceSummary(internalReasons, "helper/internal signals dominate");
  } else if (boundaryScore > 0 && internalScore > 0) {
    reasons = [
      "signals are mixed between top-level/boundary and helper/internal roles",
      ...buildEvidenceSummary(boundaryReasons, "").slice(0, 2),
      ...buildEvidenceSummary(internalReasons, "").slice(0, 2)
    ].filter(Boolean);
  } else {
    reasons = [
      boundaryScore > 0 ? buildEvidenceSummary(boundaryReasons, "").slice(0, 1)[0] : null,
      internalScore > 0 ? buildEvidenceSummary(internalReasons, "").slice(0, 1)[0] : null,
      "insufficient strong evidence to classify this function confidently"
    ].filter(Boolean);
  }

  return {
    functionName,
    status,
    confidence: determineConfidence(status, boundaryScore, internalScore),
    reasons: uniqueStrings(reasons).slice(0, 5)
  };
}

export function buildBoundaryDetectionReport(analysis) {
  const functions = Array.isArray(analysis?.functions) ? analysis.functions.filter((entry) => entry?.name && entry.name !== "<anonymous>") : [];
  const moduleBoundary = classifyModuleBoundary(analysis);
  const functionBoundaries = functions
    .map((entry) => classifyFunctionBoundary({ functionName: entry.name, analysis, moduleBoundary }))
    .sort((a, b) => {
      const order = { boundary: 3, unknown: 2, internal: 1 };
      const byStatus = (order[b.status] || 0) - (order[a.status] || 0);
      if (byStatus !== 0) return byStatus;
      return b.confidence - a.confidence;
    });

  return {
    moduleBoundary,
    functionBoundaries
  };
}
