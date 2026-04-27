import path from "node:path";
import { buildBoundaryDetectionReport } from "./boundary-detection.js";

const UI_NAME_TOKENS = new Set(["app", "component", "dialog", "modal", "page", "panel", "screen", "tool", "view", "widget"]);
const APPLICATION_NAME_TOKENS = new Set(["app", "bootstrap", "controller", "entry", "flow", "init", "main", "orchestrator", "root", "service", "workflow"]);
const DOMAIN_NAME_PATTERN = /^(build|collect|compute|derive|format|map|match|normalize|parse|tokenize|transform|validate)/i;
const DOMAIN_HINT_PATTERN = /(collect|match|normalize|parse|token|transform|validate)/i;
const INFRASTRUCTURE_NAME_PATTERN = /(config|env|file|path|resolver|runtime|storage)/i;
const REACT_IMPORT_PATTERN = /^(react|react-dom)$/i;
const UI_FRAMEWORK_IMPORT_PATTERN = /^(react|react-dom|next($|\/)|preact|solid-js|vue|svelte)/i;
const ENTRYPOINT_PATH_PATTERN = /(^|[\\/])(browser[\\/](init|main)|bootstrap|entry|init|main|root|runtime)(\.[jt]sx?)?$/i;
const REACT_HOOK_PATTERN = /^use[A-Z]/;
const INFRA_ROLE_PATTERN = /(config|env|file-path|filesystem|integration|io|path|runtime|storage|transport|wiring)/i;
const APPLICATION_ROLE_PATTERN = /(application|bootstrap|compose|composition|controller|entry|flow|orchestrat|workflow)/i;
const DOMAIN_ROLE_PATTERN = /(collect|domain|match|normalize|parse|rule|token|transform|validation)/i;
const STRONG_RUNTIME_PATH_PATTERN = /^(process(\.|$)|document(\.|$)|window(\.|$)|localStorage(\.|$)|sessionStorage(\.|$)|navigator(\.|$)|location(\.|$)|history(\.|$)|fetch(\.|$)|XMLHttpRequest(\.|$)|http(\.|$)|https(\.|$)|axios|got|node-fetch)/i;
const INFRASTRUCTURE_PLATFORM_PATH_PATTERN = /^(process(\.|$)|path(\.|$)|fs(\.|$)|os(\.|$)|url(\.|$)|crypto(\.|$)|stream(\.|$)|net(\.|$)|tty(\.|$)|zlib(\.|$)|document(\.|$)|window(\.|$)|localStorage(\.|$)|sessionStorage(\.|$)|navigator(\.|$)|location(\.|$)|history(\.|$)|fetch(\.|$)|XMLHttpRequest(\.|$)|http(\.|$)|https(\.|$)|node:)/i;
const GENERIC_BUILTIN_PATH_PATTERN = /^(Array\.|String$|Boolean$|Number$|Object\.|JSON\.|Math\.(?!random$)|RegExp$|Promise$)/;
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

function uniqueStrings(values) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

function pushWeightedReason(bucket, text, weight) {
  if (!text) return;
  const existing = bucket.get(text);
  if (!existing || existing.weight < weight) {
    bucket.set(text, { text, weight });
  }
}

function sortReasons(bucket) {
  return Array.from(bucket.values()).sort((a, b) => b.weight - a.weight || a.text.localeCompare(b.text));
}

function sumReasonWeights(bucket) {
  return sortReasons(bucket).reduce((total, entry) => total + entry.weight, 0);
}

function tokenizeName(name) {
  return String(name || "")
    .replace(/\.[^.]+$/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function sampleList(values, max = 3) {
  return uniqueStrings(values).slice(0, max);
}

function shortPathLabel(filePath) {
  const normalized = String(filePath || "").replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);
  return parts.slice(-3).join("/") || normalized;
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

function isUiStyleName(name) {
  return tokenizeName(name).some((token) => UI_NAME_TOKENS.has(token));
}

function isApplicationStyleName(name) {
  return tokenizeName(name).some((token) => APPLICATION_NAME_TOKENS.has(token));
}

function isHelperStyleName(name) {
  return DOMAIN_NAME_PATTERN.test(String(name || ""));
}

function isInfrastructureStyleName(name) {
  return INFRASTRUCTURE_NAME_PATTERN.test(String(name || ""));
}

function isReactHookName(name) {
  return REACT_HOOK_PATTERN.test(String(name || ""));
}

function isStrongRuntimeHiddenPath(pathValue) {
  return STRONG_RUNTIME_PATH_PATTERN.test(String(pathValue || ""));
}

function isInfrastructurePlatformPath(pathValue) {
  const pathText = String(pathValue || "");
  return !GENERIC_BUILTIN_PATH_PATTERN.test(pathText) && INFRASTRUCTURE_PLATFORM_PATH_PATTERN.test(pathText);
}

function collectFunctionUsage(functionName, moduleSummary) {
  return {
    hiddenInputs: Array.isArray(moduleSummary?.hiddenInputs?.[functionName]) ? moduleSummary.hiddenInputs[functionName] : [],
    platformApis: Array.isArray(moduleSummary?.platformApis?.[functionName]) ? moduleSummary.platformApis[functionName] : [],
    internalReferences: Array.isArray(moduleSummary?.internalReferences?.[functionName]) ? moduleSummary.internalReferences[functionName] : []
  };
}

function getBoundaryDetection(analysis) {
  return analysis?.boundaryDetection || buildBoundaryDetectionReport(analysis);
}

function collectModuleHookNames(imports, moduleSummary) {
  const reactImportHooks = imports
    .filter((entry) => REACT_IMPORT_PATTERN.test(String(entry?.source || "")))
    .flatMap((entry) => entry?.specifiers || [])
    .map((specifier) => specifier?.local || specifier?.imported)
    .filter((name) => isReactHookName(name));
  const platformHooks = flattenDependencyMap(moduleSummary?.platformApis)
    .map((entry) => entry.path)
    .filter((name) => isReactHookName(name));
  return sampleList([...reactImportHooks, ...platformHooks], 4);
}

function determineLayer(scoresMap, thresholds) {
  const ranked = Object.entries(scoresMap).sort((a, b) => b[1] - a[1]);
  const [winnerLayer, winnerScore] = ranked[0] || ["Unknown", 0];
  const [, runnerScore = 0] = ranked[1] || [];
  if (winnerScore < thresholds.minScore) return { layer: "Unknown", ranked, winnerScore, runnerScore };
  if (winnerScore < runnerScore + thresholds.margin) return { layer: "Unknown", ranked, winnerScore, runnerScore };
  return { layer: winnerLayer, ranked, winnerScore, runnerScore };
}

function determineConfidence(layer, winnerScore, runnerScore) {
  const gap = Math.max(0, winnerScore - runnerScore);
  if (layer === "Unknown") {
    return roundConfidence(0.36 + Math.min(0.22, winnerScore * 0.03 + gap * 0.08));
  }
  return roundConfidence(0.58 + Math.min(0.37, winnerScore * 0.06 + gap * 0.1));
}

function buildLayerReasons(layer, reasonsByLayer, ranked, fallbackText) {
  if (layer !== "Unknown") {
    return sortReasons(reasonsByLayer[layer]).map((entry) => entry.text).slice(0, 5);
  }

  const [topLayer, topScore] = ranked[0] || ["Unknown", 0];
  const [secondLayer, secondScore] = ranked[1] || ["Unknown", 0];
  const mixedReasons = [];

  if (topScore > 0 && secondScore > 0) {
    mixedReasons.push(`signals are mixed between ${topLayer} and ${secondLayer}`);
    mixedReasons.push(...sortReasons(reasonsByLayer[topLayer]).map((entry) => entry.text).slice(0, 2));
    mixedReasons.push(...sortReasons(reasonsByLayer[secondLayer]).map((entry) => entry.text).slice(0, 2));
  } else if (topScore > 0) {
    mixedReasons.push(...sortReasons(reasonsByLayer[topLayer]).map((entry) => entry.text).slice(0, 2));
    mixedReasons.push(fallbackText);
  } else {
    mixedReasons.push(fallbackText);
  }

  return uniqueStrings(mixedReasons).slice(0, 5);
}

export function classifyModuleLayer(analysis) {
  const imports = Array.isArray(analysis?.imports) ? analysis.imports : [];
  const exportsList = Array.isArray(analysis?.exports) ? analysis.exports : [];
  const functions = Array.isArray(analysis?.functions) ? analysis.functions.filter((entry) => entry?.name && entry.name !== "<anonymous>") : [];
  const moduleSummary = analysis?.moduleSummary || {};
  const relationshipIndex = analysis?.relationshipIndex || {};
  const publicAPIOrdered = Array.isArray(moduleSummary.publicAPIOrdered) ? moduleSummary.publicAPIOrdered : [];
  const publicAPI = new Set(Array.isArray(moduleSummary.publicAPI) ? moduleSummary.publicAPI : publicAPIOrdered);
  const importedBy = Array.isArray(relationshipIndex.importedBy) ? relationshipIndex.importedBy : [];
  const hiddenEntries = flattenDependencyMap(moduleSummary.hiddenInputs);
  const platformEntries = flattenDependencyMap(moduleSummary.platformApis);
  const boundaryDetection = getBoundaryDetection(analysis);
  const fileBaseName = path.basename(String(analysis?.filePath || ""), path.extname(String(analysis?.filePath || "")));
  const roleText = String(moduleSummary.role || "");
  const scores = {
    UI: new Map(),
    Application: new Map(),
    Domain: new Map(),
    Infrastructure: new Map()
  };

  const reactImports = imports.filter((entry) => REACT_IMPORT_PATTERN.test(String(entry?.source || "")));
  const uiFrameworkImports = imports.filter((entry) => UI_FRAMEWORK_IMPORT_PATTERN.test(String(entry?.source || "")));
  const nodeRuntimeImports = sampleList(imports.map((entry) => entry?.source).filter(isNodeRuntimeImport), 4);
  const hookNames = collectModuleHookNames(imports, moduleSummary);
  const strongHiddenPaths = sampleList(hiddenEntries.map((entry) => entry.path).filter(isStrongRuntimeHiddenPath), 4);
  const infrastructurePlatformPaths = sampleList(platformEntries.map((entry) => entry.path).filter(isInfrastructurePlatformPath), 4);
  const entrypointConsumers = sampleList(importedBy.filter((filePath) => isEntrypointLikePath(filePath)), 3);
  const helperFunctions = functions.filter((entry) => isHelperStyleName(entry.name)).map((entry) => entry.name);
  const primaryPublicFunction = publicAPIOrdered[0] || getDefaultExportName(exportsList);
  const knownFunctions = new Set(functions.map((entry) => entry.name));
  const primaryLocalCallees = primaryPublicFunction
    ? sampleList((relationshipIndex.callees?.[primaryPublicFunction] || []).filter((name) => knownFunctions.has(name) && name !== primaryPublicFunction), 4)
    : [];
  const hasDefault = hasDefaultExport(exportsList);
  const noDirectRuntimeSignals =
    reactImports.length === 0 &&
    uiFrameworkImports.length === 0 &&
    nodeRuntimeImports.length === 0 &&
    strongHiddenPaths.length === 0 &&
    infrastructurePlatformPaths.length === 0 &&
    hookNames.length === 0;

  if (reactImports.length) {
    pushWeightedReason(scores.UI, "imports React", 1.2);
  }

  if (uiFrameworkImports.length && !reactImports.length) {
    pushWeightedReason(scores.UI, `imports UI framework: ${sampleList(uiFrameworkImports.map((entry) => entry.source)).join(", ")}`, 0.95);
  }

  if (hookNames.length) {
    pushWeightedReason(scores.UI, `uses React hooks: ${hookNames.join(", ")}`, 1.05);
  }

  if (hasDefault && (reactImports.length || hookNames.length || isUiStyleName(fileBaseName))) {
    pushWeightedReason(scores.UI, "default export detected on a UI-facing module", 0.9);
  }

  if (isUiStyleName(fileBaseName)) {
    pushWeightedReason(scores.UI, `filename suggests UI/presentation role: ${fileBaseName}`, 0.7);
  }

  if (entrypointConsumers.length && (reactImports.length || hookNames.length || hasDefault)) {
    pushWeightedReason(scores.UI, `consumed by ${entrypointConsumers.map((filePath) => shortPathLabel(filePath)).join(", ")}`, 0.7);
  }

  if (/presentation|ui|visual|browser/.test(roleText.toLowerCase())) {
    pushWeightedReason(scores.UI, `module role suggests UI/presentation responsibility: ${roleText}`, 0.75);
  }

  if (nodeRuntimeImports.length) {
    pushWeightedReason(scores.Infrastructure, `imports runtime modules: ${nodeRuntimeImports.join(", ")}`, 1.15);
  }

  if (strongHiddenPaths.length) {
    pushWeightedReason(scores.Infrastructure, `uses runtime hidden inputs: ${strongHiddenPaths.join(", ")}`, 1.05);
  }

  if (infrastructurePlatformPaths.length) {
    pushWeightedReason(scores.Infrastructure, `uses runtime/platform APIs: ${infrastructurePlatformPaths.join(", ")}`, 0.9);
  }

  if (INFRA_ROLE_PATTERN.test(roleText)) {
    pushWeightedReason(scores.Infrastructure, `module role suggests config/path/runtime integration: ${roleText}`, 0.9);
  }

  if (isInfrastructureStyleName(fileBaseName) && (nodeRuntimeImports.length || strongHiddenPaths.length || infrastructurePlatformPaths.length || INFRA_ROLE_PATTERN.test(roleText))) {
    pushWeightedReason(scores.Infrastructure, `filename suggests infrastructure/runtime role: ${fileBaseName}`, 0.55);
  }

  if (isEntrypointLikePath(analysis?.filePath) || entrypointConsumers.length) {
    pushWeightedReason(
      scores.Application,
      isEntrypointLikePath(analysis?.filePath)
        ? `file path looks like an entrypoint: ${shortPathLabel(analysis?.filePath)}`
        : `module is consumed by entrypoint-like file: ${entrypointConsumers.join(", ")}`,
      1
    );
  }

  if (APPLICATION_ROLE_PATTERN.test(roleText)) {
    pushWeightedReason(scores.Application, `module role suggests orchestration/composition: ${roleText}`, 0.85);
  }

  if (primaryPublicFunction && primaryLocalCallees.length >= 2) {
    pushWeightedReason(
      scores.Application,
      `primary exported flow coordinates sibling functions: ${primaryPublicFunction} -> ${primaryLocalCallees.join(", ")}`,
      0.85
    );
  }

  if ((strongHiddenPaths.length || infrastructurePlatformPaths.length || nodeRuntimeImports.length) && helperFunctions.length >= 2) {
    pushWeightedReason(scores.Application, "combines runtime-facing concerns with internal helper coordination", 0.55);
  }

  if (functions.length && helperFunctions.length >= Math.max(1, functions.length - 1) && noDirectRuntimeSignals) {
    pushWeightedReason(scores.Domain, `functions look helper-style: ${sampleList(helperFunctions, 4).join(", ")}`, 1.1);
  }

  if (noDirectRuntimeSignals) {
    pushWeightedReason(scores.Domain, "no direct runtime/framework signals detected", 0.95);
  }

  if (DOMAIN_ROLE_PATTERN.test(roleText)) {
    pushWeightedReason(scores.Domain, `module role suggests transformation/normalization logic: ${roleText}`, 0.8);
  }

  if (functions.length && publicAPI.size <= 1 && !hasDefault && noDirectRuntimeSignals) {
    pushWeightedReason(scores.Domain, "module surface looks like transformation/helper logic", 0.65);
  }

  if (boundaryDetection?.moduleBoundary?.status === "boundary") {
    if (reactImports.length || hookNames.length) {
      pushWeightedReason(scores.UI, "boundary detection also marks the module as browser/UI-facing", 0.35);
    } else if (nodeRuntimeImports.length || strongHiddenPaths.length || infrastructurePlatformPaths.length) {
      pushWeightedReason(scores.Infrastructure, "boundary detection also marks the module as runtime-facing", 0.3);
    } else {
      pushWeightedReason(scores.Application, "boundary detection indicates a top-level integration role", 0.25);
    }
  }

  if (boundaryDetection?.moduleBoundary?.status === "internal" && noDirectRuntimeSignals) {
    pushWeightedReason(scores.Domain, "boundary detection indicates helper/internal orientation", 0.35);
  }

  const layerScores = {
    UI: sumReasonWeights(scores.UI),
    Application: sumReasonWeights(scores.Application),
    Domain: sumReasonWeights(scores.Domain),
    Infrastructure: sumReasonWeights(scores.Infrastructure)
  };
  const { layer, ranked, winnerScore, runnerScore } = determineLayer(layerScores, {
    minScore: 1.85,
    margin: 0.65
  });

  return {
    layer,
    confidence: determineConfidence(layer, winnerScore, runnerScore),
    reasons: buildLayerReasons(layer, scores, ranked, "insufficient strong evidence to infer the module architecture layer confidently")
  };
}

export function classifyFunctionLayer({ functionName, analysis, moduleLayer }) {
  const imports = Array.isArray(analysis?.imports) ? analysis.imports : [];
  const exportsList = Array.isArray(analysis?.exports) ? analysis.exports : [];
  const functions = Array.isArray(analysis?.functions) ? analysis.functions.filter((entry) => entry?.name && entry.name !== "<anonymous>") : [];
  const moduleSummary = analysis?.moduleSummary || {};
  const relationshipIndex = analysis?.relationshipIndex || {};
  const publicAPIOrdered = Array.isArray(moduleSummary.publicAPIOrdered) ? moduleSummary.publicAPIOrdered : [];
  const publicAPI = new Set(Array.isArray(moduleSummary.publicAPI) ? moduleSummary.publicAPI : publicAPIOrdered);
  const boundaryDetection = getBoundaryDetection(analysis);
  const functionBoundary = Array.isArray(boundaryDetection?.functionBoundaries)
    ? boundaryDetection.functionBoundaries.find((entry) => entry.functionName === functionName)
    : null;
  const usage = collectFunctionUsage(functionName, moduleSummary);
  const knownFunctions = new Set(functions.map((entry) => entry.name));
  const callers = Array.isArray(relationshipIndex.callers?.[functionName]) ? relationshipIndex.callers[functionName] : [];
  const callees = Array.isArray(relationshipIndex.callees?.[functionName]) ? relationshipIndex.callees[functionName] : [];
  const localCallers = sampleList(callers.filter((name) => knownFunctions.has(name) && name !== functionName), 4);
  const localCallees = sampleList(callees.filter((name) => knownFunctions.has(name) && name !== functionName), 4);
  const hookNames = sampleList(usage.platformApis.map((entry) => entry.path).filter((name) => isReactHookName(name)), 4);
  const strongHiddenPaths = sampleList(usage.hiddenInputs.map((entry) => entry.path).filter((pathValue) => isStrongRuntimeHiddenPath(pathValue)), 4);
  const infrastructurePlatformPaths = sampleList(usage.platformApis.map((entry) => entry.path).filter((pathValue) => isInfrastructurePlatformPath(pathValue)), 4);
  const isExported = publicAPI.has(functionName);
  const isPrimaryPublicFunction = publicAPIOrdered[0] === functionName;
  const isDefaultExport = getDefaultExportName(exportsList) === functionName;
  const moduleHasReact = imports.some((entry) => REACT_IMPORT_PATTERN.test(String(entry?.source || "")));
  const roleText = String(moduleSummary.role || "");
  const hasDirectRuntimeUsage = hookNames.length > 0 || strongHiddenPaths.length > 0 || infrastructurePlatformPaths.length > 0;
  const scores = {
    UI: new Map(),
    Application: new Map(),
    Domain: new Map(),
    Infrastructure: new Map()
  };

  if (isDefaultExport && moduleHasReact) {
    pushWeightedReason(scores.UI, "top-level React component", 1.3);
  }

  if (hookNames.length) {
    pushWeightedReason(scores.UI, `uses React hooks: ${hookNames.join(", ")}`, 0.95);
  }

  if (isUiStyleName(functionName) && (moduleHasReact || isExported || isDefaultExport)) {
    pushWeightedReason(scores.UI, `function name suggests UI/presentation role: ${functionName}`, 0.7);
  }

  if (moduleLayer?.layer === "UI" && (isExported || hookNames.length || isDefaultExport)) {
    pushWeightedReason(scores.UI, "module classified as UI", 0.4);
  }

  if (isPrimaryPublicFunction) {
    pushWeightedReason(scores.Application, "primary exported function in module", 0.8);
  }

  if (localCallees.length >= 2) {
    pushWeightedReason(scores.Application, `coordinates sibling functions: ${localCallees.join(", ")}`, 0.9);
  }

  if (isPrimaryPublicFunction && APPLICATION_ROLE_PATTERN.test(roleText)) {
    pushWeightedReason(scores.Application, `module role suggests orchestration/composition: ${roleText}`, 0.8);
  }

  if (moduleLayer?.layer === "Application" && (isExported || localCallees.length)) {
    pushWeightedReason(scores.Application, "module classified as Application", 0.45);
  }

  if (moduleLayer?.layer === "Infrastructure" && isPrimaryPublicFunction && (hasDirectRuntimeUsage || localCallees.length)) {
    pushWeightedReason(scores.Application, "exported pivot integrates runtime inputs with helper flow", 0.5);
  }

  if (strongHiddenPaths.length) {
    pushWeightedReason(scores.Infrastructure, `uses runtime hidden inputs: ${strongHiddenPaths.join(", ")}`, 0.9);
  }

  if (infrastructurePlatformPaths.length) {
    pushWeightedReason(scores.Infrastructure, `uses runtime/platform APIs: ${infrastructurePlatformPaths.join(", ")}`, 0.85);
  }

  if (isInfrastructureStyleName(functionName) && (hasDirectRuntimeUsage || moduleLayer?.layer === "Infrastructure")) {
    pushWeightedReason(scores.Infrastructure, `function name suggests runtime/config integration: ${functionName}`, 0.55);
  }

  if (moduleLayer?.layer === "Infrastructure" && hasDirectRuntimeUsage) {
    pushWeightedReason(scores.Infrastructure, "module classified as Infrastructure", 0.45);
  }

  if (isHelperStyleName(functionName) && !hasDirectRuntimeUsage) {
    pushWeightedReason(scores.Domain, `helper-style function name ${functionName}`, 1);
  } else if (DOMAIN_HINT_PATTERN.test(functionName) && !hasDirectRuntimeUsage) {
    pushWeightedReason(scores.Domain, `function name suggests transformation logic: ${functionName}`, 0.45);
  }

  if (!hasDirectRuntimeUsage) {
    pushWeightedReason(scores.Domain, "no direct runtime/framework usage", 0.9);
  }

  if (!isExported) {
    pushWeightedReason(scores.Domain, "not exported from module", 0.6);
  }

  if (!isExported && localCallers.length) {
    pushWeightedReason(scores.Domain, `used by sibling functions in the same module: ${localCallers.join(", ")}`, 0.55);
  }

  if (moduleLayer?.layer === "Domain" && !hasDirectRuntimeUsage) {
    pushWeightedReason(scores.Domain, "module classified as Domain", 0.45);
  }

  if (functionBoundary?.status === "boundary") {
    if (hookNames.length || (moduleHasReact && (isDefaultExport || isUiStyleName(functionName)))) {
      pushWeightedReason(scores.UI, "boundary detection also marks this function as runtime/UI-facing", 0.25);
    } else if (hasDirectRuntimeUsage) {
      pushWeightedReason(scores.Infrastructure, "boundary detection also marks this function as runtime-facing", 0.2);
    }
  }

  if (functionBoundary?.status === "internal" && !hasDirectRuntimeUsage) {
    pushWeightedReason(scores.Domain, "boundary detection also marks this function as helper/internal", 0.25);
  }

  const layerScores = {
    UI: sumReasonWeights(scores.UI),
    Application: sumReasonWeights(scores.Application),
    Domain: sumReasonWeights(scores.Domain),
    Infrastructure: sumReasonWeights(scores.Infrastructure)
  };
  const { layer, ranked, winnerScore, runnerScore } = determineLayer(layerScores, {
    minScore: 1.7,
    margin: 0.55
  });

  return {
    functionName,
    layer,
    confidence: determineConfidence(layer, winnerScore, runnerScore),
    reasons: buildLayerReasons(layer, scores, ranked, "insufficient strong evidence to infer this function architecture layer confidently")
  };
}

export function buildArchitectureLayerReport(analysis) {
  const functions = Array.isArray(analysis?.functions) ? analysis.functions.filter((entry) => entry?.name && entry.name !== "<anonymous>") : [];
  const boundaryDetection = getBoundaryDetection(analysis);
  const moduleLayer = classifyModuleLayer(Object.assign({}, analysis, { boundaryDetection }));
  const functionLayers = functions
    .map((entry) =>
      classifyFunctionLayer({
        functionName: entry.name,
        analysis: Object.assign({}, analysis, { boundaryDetection }),
        moduleLayer
      })
    )
    .sort((a, b) => {
      const order = { UI: 5, Application: 4, Infrastructure: 3, Domain: 2, Unknown: 1 };
      const byLayer = (order[b.layer] || 0) - (order[a.layer] || 0);
      if (byLayer !== 0) return byLayer;
      return b.confidence - a.confidence;
    });

  return {
    moduleLayer,
    functionLayers
  };
}
