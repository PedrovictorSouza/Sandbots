import path from "node:path";
import { buildBoundaryDetectionReport } from "./boundary-detection.js";

const REACT_IMPORT_PATTERN = /^(react|react-dom)$/i;
const UI_FRAMEWORK_IMPORT_PATTERN = /^(react|react-dom|next($|\/)|preact|solid-js|vue|svelte)/i;
const UI_DIRECTORY_PATTERN = /(^|[\\/])(react|pages|routes|ui)([\\/]|$)/i;
const ENTRYPOINT_PATH_PATTERN = /(^|[\\/])(browser[\\/](init|main)|bootstrap|entry|init|main|root|runtime|app)(\.[jt]sx?)?$/i;
const REACT_HOOK_PATTERN = /^use[A-Z]/;
const RUNTIME_EFFECT_PATH_PATTERN = /^(fetch|window(\.|$)|document(\.|$)|localStorage(\.|$)|sessionStorage(\.|$)|navigator(\.|$)|location(\.|$)|history(\.|$)|addEventListener|setTimeout|Date\.now|process(\.|$))/i;
const EVENT_HANDLER_NAME_PATTERN = /^handle(?:Click|Mouse|Pointer|Key|Toggle|Scan|Pick|Select|Change|Refresh|Close|Open|Preview|Clear|Undo|Reset|Move|Delete|Apply|Attach|Detach)/;
const GENERIC_HANDLER_NAME_PATTERN = /^handle[A-Z]/;
const CODE_APPLY_NAME_PATTERN = /(Apply.*ToCode|Delete.*ToCode|Reparent.*ToCode|Swap.*ToCode|Move.*ToCode|Apply.*Code|Write.*Code|Persist|Commit)/i;
const ANALYSIS_ENGINE_NAME_PATTERN = /^(analy[sz]e|audit|classify|compute|detect|explain|inspect|map|scan|summarize)/i;
const PURE_HELPER_NAME_PATTERN = /^(build|derive|extract|format|normalize|parse|tokenize|match|create.*Token)/i;
const INTERNAL_HELPER_NAME_PATTERN = /^(build|collect|derive|extract|find|format|map|normalize|parse|resolve|tokenize|match)/i;
const COMPONENT_NAME_TOKEN_PATTERN = /(app|component|dialog|modal|panel|screen|tool|view|widget)/i;
const INTERNAL_ROLE_HINT_PATTERN = /(helper|normaliz|parser|token|transform|utility|analysis)/i;
const BOUNDARY_ROLE_HINT_PATTERN = /(browser|component|entry|runtime|ui|view)/i;

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

function tokenizeName(name) {
  return String(name || "")
    .replace(/\.[^.]+$/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function sampleList(values, max = 4) {
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

function isUiDirectory(filePath) {
  return UI_DIRECTORY_PATTERN.test(String(filePath || ""));
}

function isEntrypointLikePath(filePath) {
  return ENTRYPOINT_PATH_PATTERN.test(String(filePath || ""));
}

function isReactHookName(name) {
  return REACT_HOOK_PATTERN.test(String(name || ""));
}

function isRuntimeEffectPath(pathValue) {
  return RUNTIME_EFFECT_PATH_PATTERN.test(String(pathValue || ""));
}

function isReactComponentName(name) {
  const value = String(name || "");
  return /^[A-Z]/.test(value) || COMPONENT_NAME_TOKEN_PATTERN.test(value);
}

function collectModuleHookNames(imports, moduleSummary) {
  const reactImportHooks = imports
    .filter((entry) => REACT_IMPORT_PATTERN.test(String(entry?.source || "")))
    .flatMap((entry) => entry?.specifiers || [])
    .map((specifier) => specifier?.local || specifier?.imported)
    .filter((name) => isReactHookName(name));
  const functionHookPaths = flattenDependencyMap(moduleSummary?.platformApis)
    .map((entry) => entry.path)
    .filter((name) => isReactHookName(name));
  return sampleList([...reactImportHooks, ...functionHookPaths], 5);
}

function buildReasonList(primaryBucket, secondaryBucket, fallbackText, limit = 5) {
  const reasons = [
    ...sortReasons(primaryBucket).map((entry) => entry.text),
    ...sortReasons(secondaryBucket).map((entry) => entry.text)
  ];
  const unique = uniqueStrings(reasons);
  return unique.length ? unique.slice(0, limit) : [fallbackText];
}

function determineBinaryStatus(boundaryScore, internalScore) {
  if (boundaryScore >= 1.7 && boundaryScore >= internalScore + 0.35) {
    return "boundary/runtime-facing";
  }
  if (internalScore >= 1.4 && internalScore >= boundaryScore + 0.35) {
    return "internal/helper-oriented";
  }
  return "unknown";
}

function determineBinaryConfidence(role, boundaryScore, internalScore) {
  const dominant = Math.max(boundaryScore, internalScore);
  const diff = Math.abs(boundaryScore - internalScore);
  if (role === "unknown") {
    return roundConfidence(0.38 + Math.min(0.22, dominant * 0.05 + diff * 0.04));
  }
  return roundConfidence(0.58 + Math.min(0.36, dominant * 0.06 + diff * 0.09));
}

function determineRole(scoresMap, minScore = 1.05, margin = 0.25) {
  const ranked = Object.entries(scoresMap).sort((a, b) => b[1] - a[1]);
  const [winnerRole, winnerScore] = ranked[0] || ["unknown", 0];
  const [, runnerScore = 0] = ranked[1] || [];
  if (winnerScore < minScore) return { role: "unknown", ranked, winnerScore, runnerScore };
  if (winnerScore < runnerScore + margin) return { role: "unknown", ranked, winnerScore, runnerScore };
  return { role: winnerRole, ranked, winnerScore, runnerScore };
}

function determineRoleConfidence(role, winnerScore, runnerScore) {
  const gap = Math.max(0, winnerScore - runnerScore);
  if (role === "unknown") {
    return roundConfidence(0.34 + Math.min(0.2, winnerScore * 0.04 + gap * 0.08));
  }
  return roundConfidence(0.56 + Math.min(0.36, winnerScore * 0.07 + gap * 0.1));
}

function buildFunctionRoleReasons(role, reasonsByRole, ranked) {
  if (role !== "unknown") {
    return sortReasons(reasonsByRole[role]).map((entry) => entry.text).slice(0, 5);
  }

  const [topRole, topScore] = ranked[0] || ["unknown", 0];
  const [secondRole, secondScore] = ranked[1] || ["unknown", 0];
  const mixedReasons = [];

  if (topScore > 0 && secondScore > 0) {
    mixedReasons.push(`signals are mixed between ${topRole} and ${secondRole}`);
    mixedReasons.push(...sortReasons(reasonsByRole[topRole]).map((entry) => entry.text).slice(0, 2));
    mixedReasons.push(...sortReasons(reasonsByRole[secondRole]).map((entry) => entry.text).slice(0, 2));
  } else if (topScore > 0) {
    mixedReasons.push(...sortReasons(reasonsByRole[topRole]).map((entry) => entry.text).slice(0, 2));
  } else {
    mixedReasons.push("insufficient structural signals for a specific function role");
  }

  return uniqueStrings(mixedReasons).slice(0, 5);
}

export function classifyModuleRole(analysis) {
  const imports = Array.isArray(analysis?.imports) ? analysis.imports : [];
  const exportsList = Array.isArray(analysis?.exports) ? analysis.exports : [];
  const functions = Array.isArray(analysis?.functions) ? analysis.functions.filter((entry) => entry?.name && entry.name !== "<anonymous>") : [];
  const moduleSummary = analysis?.moduleSummary || {};
  const relationshipIndex = analysis?.relationshipIndex || {};
  const importedBy = Array.isArray(relationshipIndex.importedBy) ? relationshipIndex.importedBy : [];
  const hiddenEntries = flattenDependencyMap(moduleSummary.hiddenInputs);
  const platformEntries = flattenDependencyMap(moduleSummary.platformApis);
  const boundaryDetection = getBoundaryDetection(analysis);
  const roleText = String(moduleSummary.role || "");
  const filePath = String(analysis?.filePath || "");
  const fileBaseName = path.basename(filePath, path.extname(filePath));

  const boundaryReasons = new Map();
  const internalReasons = new Map();

  const reactImports = imports.filter((entry) => REACT_IMPORT_PATTERN.test(String(entry?.source || "")));
  const uiFrameworkImports = imports.filter((entry) => UI_FRAMEWORK_IMPORT_PATTERN.test(String(entry?.source || "")));
  const hookNames = collectModuleHookNames(imports, moduleSummary);
  const runtimeHiddenPaths = sampleList(hiddenEntries.map((entry) => entry.path).filter(isRuntimeEffectPath), 4);
  const runtimePlatformPaths = sampleList(platformEntries.map((entry) => entry.path).filter(isRuntimeEffectPath), 4);
  const entrypointConsumers = sampleList(importedBy.filter((value) => isEntrypointLikePath(value)), 3);
  const helperFunctions = functions.filter((entry) => INTERNAL_HELPER_NAME_PATTERN.test(entry.name)).map((entry) => entry.name);
  const hasDefault = hasDefaultExport(exportsList);
  const defaultExportName = getDefaultExportName(exportsList);
  const noStrongBoundarySignals =
    reactImports.length === 0 &&
    uiFrameworkImports.length === 0 &&
    hookNames.length === 0 &&
    runtimeHiddenPaths.length === 0 &&
    runtimePlatformPaths.length === 0 &&
    entrypointConsumers.length === 0 &&
    !isUiDirectory(filePath);

  if (reactImports.length) {
    pushWeightedReason(boundaryReasons, "imports React", 1.15);
  }

  if (uiFrameworkImports.length && !reactImports.length) {
    pushWeightedReason(
      boundaryReasons,
      `imports UI framework: ${sampleList(uiFrameworkImports.map((entry) => entry.source)).join(", ")}`,
      0.95
    );
  }

  if (hookNames.length) {
    pushWeightedReason(boundaryReasons, `uses React hooks: ${hookNames.join(", ")}`, 1.05);
  }

  if (hasDefault && (reactImports.length || hookNames.length || isUiDirectory(filePath) || isReactComponentName(defaultExportName))) {
    pushWeightedReason(boundaryReasons, "contains default export of a React/UI component", 1);
  }

  if (isUiDirectory(filePath)) {
    pushWeightedReason(boundaryReasons, `file path suggests UI/runtime boundary: ${shortPathLabel(filePath)}`, 0.9);
  }

  if (entrypointConsumers.length) {
    pushWeightedReason(
      boundaryReasons,
      `consumed by UI/runtime entrypoint: ${entrypointConsumers.map((item) => shortPathLabel(item)).join(", ")}`,
      1
    );
  }

  if (runtimeHiddenPaths.length) {
    pushWeightedReason(boundaryReasons, `uses runtime hidden inputs: ${runtimeHiddenPaths.join(", ")}`, 0.95);
  }

  if (runtimePlatformPaths.length) {
    pushWeightedReason(boundaryReasons, `uses runtime APIs: ${runtimePlatformPaths.join(", ")}`, 0.9);
  }

  if (BOUNDARY_ROLE_HINT_PATTERN.test(roleText)) {
    pushWeightedReason(boundaryReasons, `module summary role suggests UI/runtime boundary: ${roleText}`, 0.75);
  }

  if (boundaryDetection?.moduleBoundary?.status === "boundary") {
    pushWeightedReason(boundaryReasons, "boundary detection also marks this module as boundary/runtime-facing", 0.45);
  }

  if (noStrongBoundarySignals && helperFunctions.length) {
    pushWeightedReason(internalReasons, `helper-style module functions detected: ${sampleList(helperFunctions).join(", ")}`, 0.95);
  }

  if (noStrongBoundarySignals && !hasDefault && !uiFrameworkImports.length) {
    pushWeightedReason(internalReasons, "no React/runtime boundary signals detected at module level", 0.9);
  }

  if (INTERNAL_ROLE_HINT_PATTERN.test(roleText)) {
    pushWeightedReason(internalReasons, `module summary role suggests helper/analysis work: ${roleText}`, 0.7);
  }

  if (boundaryDetection?.moduleBoundary?.status === "internal") {
    pushWeightedReason(internalReasons, "boundary detection marks this module as internal", 0.45);
  }

  const boundaryScore = sortReasons(boundaryReasons).reduce((sum, entry) => sum + entry.weight, 0);
  const internalScore = sortReasons(internalReasons).reduce((sum, entry) => sum + entry.weight, 0);
  const role = determineBinaryStatus(boundaryScore, internalScore);
  const confidence = determineBinaryConfidence(role, boundaryScore, internalScore);
  const reasons =
    role === "boundary/runtime-facing"
      ? buildReasonList(boundaryReasons, new Map(), "insufficient boundary evidence")
      : role === "internal/helper-oriented"
        ? buildReasonList(internalReasons, new Map(), "insufficient helper/internal evidence")
        : buildReasonList(boundaryReasons, internalReasons, "insufficient or mixed signals for module role");

  return {
    role,
    confidence,
    reasons
  };
}

export function detectPrimaryEntrySymbol(analysis, moduleRole) {
  const imports = Array.isArray(analysis?.imports) ? analysis.imports : [];
  const exportsList = Array.isArray(analysis?.exports) ? analysis.exports : [];
  const functions = Array.isArray(analysis?.functions) ? analysis.functions.filter((entry) => entry?.name && entry.name !== "<anonymous>") : [];
  const moduleSummary = analysis?.moduleSummary || {};
  const knownFunctions = new Set(functions.map((entry) => entry.name));
  const publicAPIOrdered = Array.isArray(moduleSummary.publicAPIOrdered) ? moduleSummary.publicAPIOrdered : [];
  const reactImports = imports.filter((entry) => REACT_IMPORT_PATTERN.test(String(entry?.source || "")));
  const defaultExportName = getDefaultExportName(exportsList);
  const reasons = new Map();

  let primarySymbol = null;
  let symbolType = "unknown";

  if (defaultExportName && knownFunctions.has(defaultExportName)) {
    primarySymbol = defaultExportName;
    symbolType =
      reactImports.length || moduleRole?.role === "boundary/runtime-facing" || isReactComponentName(defaultExportName)
        ? "top-level entry"
        : "default export entry";

    if (reactImports.length || isReactComponentName(defaultExportName)) {
      pushWeightedReason(reasons, "default exported component", 1.2);
    } else {
      pushWeightedReason(reasons, "default export detected", 1.05);
    }

    pushWeightedReason(reasons, "primary exported function", 0.9);
  } else {
    const primaryPublicFunction = publicAPIOrdered.find((name) => knownFunctions.has(name));
    if (primaryPublicFunction) {
      primarySymbol = primaryPublicFunction;
      symbolType = moduleRole?.role === "boundary/runtime-facing" ? "top-level entry" : "primary exported function";
      pushWeightedReason(reasons, "primary exported function", 1.05);
      pushWeightedReason(reasons, "selected from ordered public API surface", 0.75);
    }
  }

  if (!primarySymbol && functions.length === 1) {
    primarySymbol = functions[0].name;
    symbolType = "sole function entry";
    pushWeightedReason(reasons, "single named function in module", 0.8);
  }

  if (!primarySymbol) {
    return {
      primarySymbol: null,
      symbolType: "unknown",
      confidence: 0.32,
      reasons: ["No clear entry symbol detected for this module."]
    };
  }

  const confidence = roundConfidence(0.62 + Math.min(0.33, sortReasons(reasons).reduce((sum, entry) => sum + entry.weight, 0) * 0.08));

  return {
    primarySymbol,
    symbolType,
    confidence,
    reasons: sortReasons(reasons).map((entry) => entry.text).slice(0, 4)
  };
}

export function classifyFunctionRole({ functionName, analysis, moduleRole, primaryEntrySymbol }) {
  const functions = Array.isArray(analysis?.functions) ? analysis.functions.filter((entry) => entry?.name && entry.name !== "<anonymous>") : [];
  const exportsList = Array.isArray(analysis?.exports) ? analysis.exports : [];
  const moduleSummary = analysis?.moduleSummary || {};
  const relationshipIndex = analysis?.relationshipIndex || {};
  const publicAPIOrdered = Array.isArray(moduleSummary.publicAPIOrdered) ? moduleSummary.publicAPIOrdered : [];
  const publicAPI = new Set(Array.isArray(moduleSummary.publicAPI) ? moduleSummary.publicAPI : publicAPIOrdered);
  const usage = collectFunctionUsage(functionName, moduleSummary);
  const knownFunctions = new Set(functions.map((entry) => entry.name));
  const callers = Array.isArray(relationshipIndex.callers?.[functionName]) ? relationshipIndex.callers[functionName] : [];
  const callees = Array.isArray(relationshipIndex.callees?.[functionName]) ? relationshipIndex.callees[functionName] : [];
  const localCallees = uniqueStrings(callees.filter((name) => knownFunctions.has(name) && name !== functionName));
  const runtimePaths = sampleList(
    [...usage.hiddenInputs.map((entry) => entry.path), ...usage.platformApis.map((entry) => entry.path)].filter(isRuntimeEffectPath),
    5
  );
  const hookNames = sampleList(
    [...usage.platformApis.map((entry) => entry.path), ...callees].filter((name) => isReactHookName(name)),
    4
  );
  const scores = {
    "ui-event-handler": new Map(),
    "ui-state-orchestrator": new Map(),
    "runtime-effect": new Map(),
    "analysis-engine": new Map(),
    "code-apply-action": new Map(),
    "pure-helper": new Map(),
    "internal-helper": new Map()
  };

  const defaultExportName = getDefaultExportName(exportsList);
  const isPrimary = primaryEntrySymbol?.primarySymbol === functionName;
  const isExported = publicAPI.has(functionName) || defaultExportName === functionName;
  const isEventHandlerName = EVENT_HANDLER_NAME_PATTERN.test(functionName) || GENERIC_HANDLER_NAME_PATTERN.test(functionName);
  const isCodeApplyName = CODE_APPLY_NAME_PATTERN.test(functionName);
  const isAnalysisName = ANALYSIS_ENGINE_NAME_PATTERN.test(functionName);
  const isPureHelperName = PURE_HELPER_NAME_PATTERN.test(functionName);
  const isInternalHelperName = INTERNAL_HELPER_NAME_PATTERN.test(functionName);
  const noDirectRuntimeUsage = runtimePaths.length === 0 && hookNames.length === 0;
  const siblingOnlyUsage = callers.length > 0 && callers.every((caller) => knownFunctions.has(caller));

  if (isCodeApplyName) {
    pushWeightedReason(scores["code-apply-action"], `function name indicates code apply action: ${functionName}`, 1.25);
  }

  if (isCodeApplyName && (localCallees.length || runtimePaths.length)) {
    pushWeightedReason(scores["code-apply-action"], "applies or persists structural changes rather than only analyzing", 0.45);
  }

  if (isEventHandlerName) {
    pushWeightedReason(scores["ui-event-handler"], `name follows UI handler convention: ${functionName}`, 1.05);
  }

  if (isEventHandlerName && moduleRole?.role === "boundary/runtime-facing") {
    pushWeightedReason(scores["ui-event-handler"], "lives in a boundary/runtime-facing UI module", 0.45);
  }

  if (isEventHandlerName && (hookNames.length || callees.some((name) => /^set[A-Z]/.test(String(name || ""))))) {
    pushWeightedReason(scores["ui-event-handler"], "updates UI state or coordinates interactive behavior", 0.55);
  }

  if (isPrimary && moduleRole?.role === "boundary/runtime-facing") {
    pushWeightedReason(scores["ui-state-orchestrator"], "primary entry symbol for a boundary/runtime-facing module", 1.2);
  }

  if (hookNames.length) {
    pushWeightedReason(scores["ui-state-orchestrator"], `uses React hooks: ${hookNames.join(", ")}`, 0.95);
  }

  if (localCallees.length >= 2 && (isPrimary || hookNames.length)) {
    pushWeightedReason(
      scores["ui-state-orchestrator"],
      `coordinates sibling functions: ${sampleList(localCallees).join(", ")}`,
      0.45
    );
  }

  if (runtimePaths.length) {
    pushWeightedReason(scores["runtime-effect"], `uses runtime APIs or hidden inputs: ${runtimePaths.join(", ")}`, 1.05);
  }

  if (runtimePaths.some((value) => /fetch|window|document|localStorage|sessionStorage|addEventListener|setTimeout|Date\.now/i.test(value))) {
    pushWeightedReason(scores["runtime-effect"], "touches browser/runtime effect APIs directly", 0.55);
  }

  if (isAnalysisName) {
    pushWeightedReason(scores["analysis-engine"], `function name suggests analysis/audit work: ${functionName}`, 1.1);
  }

  if (isAnalysisName && noDirectRuntimeUsage) {
    pushWeightedReason(scores["analysis-engine"], "runs analysis without direct runtime side effects", 0.45);
  }

  if (isPureHelperName) {
    pushWeightedReason(scores["pure-helper"], `helper-style function name: ${functionName}`, 1.05);
  }

  if (isPureHelperName && noDirectRuntimeUsage) {
    pushWeightedReason(scores["pure-helper"], "no direct runtime API usage", 0.5);
  }

  if (isPureHelperName && !isExported) {
    pushWeightedReason(scores["pure-helper"], "not exported from module", 0.35);
  }

  if (isPureHelperName && siblingOnlyUsage) {
    pushWeightedReason(scores["pure-helper"], "used only by sibling functions in the same module", 0.3);
  }

  if (isInternalHelperName || (!isExported && !isEventHandlerName && !isCodeApplyName && !isAnalysisName)) {
    pushWeightedReason(scores["internal-helper"], `internal utility role detected for ${functionName}`, 0.8);
  }

  if (!isExported) {
    pushWeightedReason(scores["internal-helper"], "not exported from module", 0.35);
  }

  if (siblingOnlyUsage) {
    pushWeightedReason(scores["internal-helper"], "used only by sibling functions in the same module", 0.3);
  }

  if (!noDirectRuntimeUsage && !isCodeApplyName && !isAnalysisName) {
    pushWeightedReason(scores["internal-helper"], `contains runtime-coupled utility usage: ${sampleList(runtimePaths, 2).join(", ")}`, 0.25);
  }

  const numericScores = Object.fromEntries(
    Object.entries(scores).map(([roleName, reasonsMap]) => [
      roleName,
      sortReasons(reasonsMap).reduce((sum, entry) => sum + entry.weight, 0)
    ])
  );

  let forcedRole = null;
  if (isCodeApplyName && numericScores["code-apply-action"] >= 1.25) {
    forcedRole = "code-apply-action";
  } else if (
    runtimePaths.length &&
    !isCodeApplyName &&
    numericScores["runtime-effect"] >= 1.2 &&
    numericScores["runtime-effect"] >= numericScores["internal-helper"] + 0.15
  ) {
    forcedRole = "runtime-effect";
  }

  const { role, ranked, winnerScore, runnerScore } = forcedRole
    ? {
        role: forcedRole,
        ranked: Object.entries(numericScores).sort((a, b) => b[1] - a[1]),
        winnerScore: numericScores[forcedRole],
        runnerScore: Math.max(...Object.entries(numericScores).filter(([name]) => name !== forcedRole).map(([, score]) => score), 0)
      }
    : determineRole(numericScores);
  const confidence = determineRoleConfidence(role, winnerScore, runnerScore);
  const reasons = buildFunctionRoleReasons(role, scores, ranked);

  return {
    functionName,
    role,
    confidence,
    reasons
  };
}

export function buildModuleOverviewReport(analysis) {
  const functions = Array.isArray(analysis?.functions) ? analysis.functions.filter((entry) => entry?.name && entry.name !== "<anonymous>") : [];
  const moduleRole = classifyModuleRole(analysis);
  const primaryEntrySymbol = detectPrimaryEntrySymbol(analysis, moduleRole);
  const functionRoles = functions.map((entry) =>
    classifyFunctionRole({
      functionName: entry.name,
      analysis,
      moduleRole,
      primaryEntrySymbol
    })
  );

  return {
    moduleRole,
    primaryEntrySymbol,
    functionRoles
  };
}
