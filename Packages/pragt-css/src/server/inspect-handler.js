import { promises as fs } from "node:fs";
import path from "node:path";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";
import { getArchitectureAnnotationForFunctionPath } from "./architecture-annotations.js";

const traverse = traverseModule.default;

const DEFAULT_PARSER_PLUGINS_TS = [
  "jsx",
  "typescript",
  "classProperties",
  "optionalChaining",
  "nullishCoalescingOperator",
  "dynamicImport",
  "topLevelAwait"
];

const DEFAULT_PARSER_PLUGINS_FLOW = [
  "jsx",
  "flow",
  "classProperties",
  "optionalChaining",
  "nullishCoalescingOperator",
  "dynamicImport",
  "topLevelAwait"
];

function resolveFile(script) {
  if (!script) {
    return "";
  }

  return path.isAbsolute(script) ? path.normalize(script) : path.join(process.cwd(), script);
}

export function parseSourceFile(code) {
  try {
    return {
      ast: parse(code, {
        sourceType: "module",
        plugins: DEFAULT_PARSER_PLUGINS_TS
      }),
      parserMode: "typescript",
      warnings: []
    };
  } catch (_typescriptError) {
    return {
      ast: parse(code, {
        sourceType: "module",
        plugins: DEFAULT_PARSER_PLUGINS_FLOW
      }),
      parserMode: "flow",
      warnings: [
        "Arquivo parseado com fallback Flow porque o parse TypeScript falhou."
      ]
    };
  }
}

function getNodeSource(code, node, fallback = "") {
  if (
    !node ||
    !Number.isInteger(node.start) ||
    !Number.isInteger(node.end) ||
    node.end <= node.start
  ) {
    return fallback;
  }

  return code.slice(node.start, node.end).replace(/\s+/g, " ").trim() || fallback;
}

function normalizeTrackedLabel(label) {
  return String(label || "")
    .replace(/\?\.\[/g, "[")
    .replace(/\?\./g, ".")
    .trim();
}

function getTrackedLabelRoot(label) {
  const normalizedLabel = normalizeTrackedLabel(label).replace(/\s+/g, "");
  const match = normalizedLabel.match(/^(this|[A-Za-z_$][A-Za-z0-9_$]*)/);

  return match?.[1] || "";
}

function addTrackedLabel(output, label) {
  const normalizedLabel = normalizeTrackedLabel(label);

  if (normalizedLabel) {
    output.add(normalizedLabel);
  }
}

function getList(items) {
  return Array.isArray(items) ? items : [];
}

function sortLabels(items) {
  const list = Array.isArray(items) ? items : items instanceof Set ? Array.from(items) : [];

  return Array.from(new Set(list)).sort((left, right) =>
    String(left).localeCompare(String(right))
  );
}

function uniqueStrings(items) {
  return Array.from(
    new Set(
      getList(items)
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    )
  );
}

function getSourceLines(code) {
  return String(code || "").split(/\r?\n/);
}

function getFunctionSourceSpan(entry) {
  const start = Number(entry?.start);
  const end = Number(entry?.end);

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return 0;
  }

  return end - start;
}

export function analyzeSourceHealth(code, functions = []) {
  const lines = getSourceLines(code);
  const lineLengths = lines.map((line) => line.length);
  const longLineThreshold = 220;
  const veryLongLineThreshold = 360;
  const compactSingleLineSpanThreshold = 160;
  const compactPairSpanThreshold = 220;
  const sortedFunctions = getList(functions)
    .filter((entry) => Number.isFinite(entry?.start) && Number.isFinite(entry?.end))
    .slice()
    .sort((left, right) => Number(left.start) - Number(right.start));
  const compactSingleLineFunctions = sortedFunctions
    .filter((entry) => {
      const startLine = Number(entry?.loc?.start?.line || 0);
      const endLine = Number(entry?.loc?.end?.line || 0);

      return (
        startLine > 0 &&
        endLine > 0 &&
        startLine === endLine &&
        getFunctionSourceSpan(entry) >= compactSingleLineSpanThreshold
      );
    })
    .map((entry) => entry.name);
  const gluedFunctionPairs = [];

  for (let index = 1; index < sortedFunctions.length; index += 1) {
    const previousEntry = sortedFunctions[index - 1];
    const nextEntry = sortedFunctions[index];

    if (Number(nextEntry?.start) < Number(previousEntry?.end)) {
      continue;
    }

    const betweenSource = String(code || "").slice(previousEntry.end, nextEntry.start);

    if (/[\r\n]/.test(betweenSource)) {
      continue;
    }

    const combinedSpan =
      getFunctionSourceSpan(previousEntry) + getFunctionSourceSpan(nextEntry);

    if (
      getFunctionSourceSpan(previousEntry) < compactSingleLineSpanThreshold &&
      getFunctionSourceSpan(nextEntry) < compactSingleLineSpanThreshold &&
      combinedSpan < compactPairSpanThreshold
    ) {
      continue;
    }

    gluedFunctionPairs.push({
      left: previousEntry.name,
      right: nextEntry.name,
      line: Number(previousEntry?.loc?.end?.line || nextEntry?.loc?.start?.line || 0) || null
    });
  }

  const longLinesCount = lineLengths.filter((lineLength) => lineLength >= longLineThreshold).length;
  const veryLongLinesCount = lineLengths.filter(
    (lineLength) => lineLength >= veryLongLineThreshold
  ).length;
  const requiresManualStop =
    gluedFunctionPairs.length > 0 ||
    compactSingleLineFunctions.length >= 3 ||
    veryLongLinesCount >= 3 ||
    (compactSingleLineFunctions.length >= 2 && longLinesCount >= 4);
  const warnings = [];

  if (requiresManualStop) {
    warnings.push(
      `Arquivo com sinais de compactacao estrutural: ${gluedFunctionPairs.length} par(es) de funcoes coladas, ` +
        `${compactSingleLineFunctions.length} funcao(oes) de linha unica longa e ${veryLongLinesCount} linha(s) muito longa(s). ` +
        "Pare a automacao e normalize a formatacao antes de aplicar lotes seguros."
    );
  }

  return {
    lineCount: lines.length,
    longLinesCount,
    veryLongLinesCount,
    compactSingleLineFunctions,
    gluedFunctionPairs,
    requiresManualStop,
    stopReason: requiresManualStop ? "source-compacted" : "",
    warnings
  };
}

const STANDARD_GLOBAL_ROOTS = new Set([
  "AbortController",
  "AbortSignal",
  "Array",
  "ArrayBuffer",
  "Atomics",
  "BigInt",
  "BigInt64Array",
  "BigUint64Array",
  "Blob",
  "Boolean",
  "Buffer",
  "Date",
  "DataView",
  "decodeURI",
  "decodeURIComponent",
  "encodeURI",
  "encodeURIComponent",
  "Error",
  "escape",
  "eval",
  "EvalError",
  "EventSource",
  "fetch",
  "File",
  "FinalizationRegistry",
  "Float32Array",
  "Float64Array",
  "FormData",
  "Function",
  "globalThis",
  "Headers",
  "history",
  "Infinity",
  "Int8Array",
  "Int16Array",
  "Int32Array",
  "Intl",
  "isFinite",
  "isNaN",
  "JSON",
  "localStorage",
  "location",
  "Map",
  "Math",
  "MutationObserver",
  "NaN",
  "navigator",
  "Number",
  "Object",
  "parseFloat",
  "parseInt",
  "performance",
  "process",
  "Promise",
  "Proxy",
  "queueMicrotask",
  "RangeError",
  "ReadableStream",
  "ReferenceError",
  "Reflect",
  "RegExp",
  "removeEventListener",
  "Request",
  "requestAnimationFrame",
  "Response",
  "sessionStorage",
  "Set",
  "setInterval",
  "setTimeout",
  "SharedArrayBuffer",
  "String",
  "structuredClone",
  "Symbol",
  "SyntaxError",
  "TextDecoder",
  "TextEncoder",
  "TransformStream",
  "TypeError",
  "Uint8Array",
  "Uint8ClampedArray",
  "Uint16Array",
  "Uint32Array",
  "undefined",
  "unescape",
  "URIError",
  "URL",
  "URLSearchParams",
  "WeakMap",
  "WeakRef",
  "WeakSet",
  "WebSocket",
  "window",
  "WritableStream",
  "XMLHttpRequest",
  "addEventListener",
  "cancelAnimationFrame",
  "clearInterval",
  "clearTimeout",
  "console",
  "document"
]);

const CANVAS_CONTEXT_METHODS = new Set([
  "arc",
  "beginPath",
  "clearRect",
  "clip",
  "createImageData",
  "createLinearGradient",
  "createPattern",
  "createRadialGradient",
  "drawImage",
  "ellipse",
  "fill",
  "fillRect",
  "fillText",
  "getImageData",
  "lineTo",
  "measureText",
  "moveTo",
  "putImageData",
  "quadraticCurveTo",
  "rect",
  "resetTransform",
  "restore",
  "rotate",
  "save",
  "scale",
  "setTransform",
  "stroke",
  "strokeRect",
  "strokeText",
  "transform",
  "translate"
]);

function getParamLabel(param, code) {
  if (!param) {
    return "unknown";
  }

  if (param.type === "Identifier") {
    return param.name;
  }

  if (param.type === "RestElement" && param.argument?.type === "Identifier") {
    return `...${param.argument.name}`;
  }

  return getNodeSource(code, param, param.type || "unknown");
}

function collectPatternIdentifiers(pattern, output) {
  if (!pattern || !output) {
    return;
  }

  if (pattern.type === "Identifier") {
    output.add(pattern.name);
    return;
  }

  if (pattern.type === "RestElement") {
    collectPatternIdentifiers(pattern.argument, output);
    return;
  }

  if (pattern.type === "AssignmentPattern") {
    collectPatternIdentifiers(pattern.left, output);
    return;
  }

  if (pattern.type === "ObjectPattern") {
    pattern.properties.forEach((property) => {
      if (!property) {
        return;
      }

      if (property.type === "RestElement") {
        collectPatternIdentifiers(property.argument, output);
        return;
      }

      collectPatternIdentifiers(property.value, output);
    });
    return;
  }

  if (pattern.type === "ArrayPattern") {
    pattern.elements.forEach((element) => collectPatternIdentifiers(element, output));
    return;
  }

  if (pattern.type === "TSParameterProperty") {
    collectPatternIdentifiers(pattern.parameter, output);
  }
}

function getRootReferenceInfo(node) {
  if (!node) {
    return null;
  }

  if (node.type === "Identifier") {
    return {
      kind: "identifier",
      name: node.name
    };
  }

  if (node.type === "ThisExpression") {
    return {
      kind: "this",
      name: "this"
    };
  }

  if (node.type === "MemberExpression" || node.type === "OptionalMemberExpression") {
    return getRootReferenceInfo(node.object);
  }

  if (
    node.type === "ParenthesizedExpression" ||
    node.type === "TSNonNullExpression" ||
    node.type === "TypeCastExpression"
  ) {
    return getRootReferenceInfo(node.expression);
  }

  return null;
}

function normalizeSignalPath(label) {
  return normalizeTrackedLabel(label)
    .replace(/\[\s*["']([A-Za-z_$][A-Za-z0-9_$]*)["']\s*\]/g, ".$1")
    .replace(/\s+/g, "");
}

function getFirstPropertyName(label) {
  const normalizedLabel = normalizeSignalPath(label);
  const match = normalizedLabel.match(
    /^(?:import\.meta|this|[A-Za-z_$][A-Za-z0-9_$]*)(?:\.([A-Za-z_$][A-Za-z0-9_$]*))/
  );

  return match?.[1] || "";
}

function isConstantLike(name) {
  return /^[A-Z][A-Z0-9_]*$/.test(String(name || ""));
}

function isStandardGlobalRoot(name) {
  return STANDARD_GLOBAL_ROOTS.has(String(name || ""));
}

function isLikelyCanvasContextRoot(name) {
  return /(ctx|context)$/i.test(String(name || "")) || /canvas/i.test(String(name || ""));
}

function detectRuntimeSignalFromNormalizedLabel(normalizedLabel) {
  if (!normalizedLabel) {
    return "";
  }

  if (normalizedLabel === "window") {
    return "window";
  }

  if (normalizedLabel.startsWith("window.")) {
    return detectRuntimeSignalFromNormalizedLabel(normalizedLabel.slice("window.".length)) || "window";
  }

  if (normalizedLabel.startsWith("globalThis.")) {
    return detectRuntimeSignalFromNormalizedLabel(normalizedLabel.slice("globalThis.".length));
  }

  if (normalizedLabel.startsWith("import.meta")) {
    return "import.meta";
  }

  if (normalizedLabel.startsWith("process.env")) {
    return "process.env";
  }

  if (normalizedLabel === "localStorage" || normalizedLabel.startsWith("localStorage.")) {
    return "localStorage";
  }

  if (normalizedLabel === "sessionStorage" || normalizedLabel.startsWith("sessionStorage.")) {
    return "sessionStorage";
  }

  if (normalizedLabel === "fetch") {
    return "fetch";
  }

  if (normalizedLabel === "WebSocket") {
    return "WebSocket";
  }

  if (normalizedLabel === "EventSource") {
    return "EventSource";
  }

  if (normalizedLabel === "XMLHttpRequest") {
    return "XMLHttpRequest";
  }

  if (normalizedLabel === "requestAnimationFrame") {
    return "requestAnimationFrame";
  }

  if (normalizedLabel === "cancelAnimationFrame") {
    return "cancelAnimationFrame";
  }

  if (normalizedLabel === "setTimeout") {
    return "setTimeout";
  }

  if (normalizedLabel === "setInterval") {
    return "setInterval";
  }

  if (normalizedLabel === "addEventListener" || normalizedLabel.endsWith(".addEventListener")) {
    return "addEventListener";
  }

  if (
    normalizedLabel === "removeEventListener" ||
    normalizedLabel.endsWith(".removeEventListener")
  ) {
    return "removeEventListener";
  }

  if (normalizedLabel === "document" || normalizedLabel.startsWith("document.")) {
    return "document";
  }

  if (normalizedLabel === "navigator" || normalizedLabel.startsWith("navigator.")) {
    return "navigator";
  }

  if (normalizedLabel === "location" || normalizedLabel.startsWith("location.")) {
    return "location";
  }

  if (normalizedLabel === "history" || normalizedLabel.startsWith("history.")) {
    return "history";
  }

  if (normalizedLabel === "console") {
    return "console";
  }

  const consoleMatch = normalizedLabel.match(/^console\.([A-Za-z_$][A-Za-z0-9_$]*)/);

  if (consoleMatch) {
    return `console.${consoleMatch[1]}`;
  }

  if (normalizedLabel === "performance") {
    return "performance";
  }

  if (normalizedLabel.startsWith("performance.now")) {
    return "performance.now";
  }

  if (normalizedLabel.startsWith("performance.")) {
    return "performance";
  }

  const rootName = getTrackedLabelRoot(normalizedLabel);
  const propertyName = getFirstPropertyName(normalizedLabel);

  if (rootName === "gl") {
    return "gl";
  }

  if (propertyName === "getContext") {
    return "canvas.getContext";
  }

  if (CANVAS_CONTEXT_METHODS.has(propertyName) && isLikelyCanvasContextRoot(rootName)) {
    return "canvas";
  }

  return "";
}

function detectRuntimeSignal(label) {
  return detectRuntimeSignalFromNormalizedLabel(normalizeSignalPath(label));
}

function finalizeRuntimeSignals(items) {
  const signals = sortLabels(items);
  const hasSpecificConsoleSignal = signals.some((signal) => signal.startsWith("console."));
  const hasSpecificPerformanceSignal = signals.includes("performance.now");

  return signals.filter((signal) => {
    if (signal === "console" && hasSpecificConsoleSignal) {
      return false;
    }

    if (signal === "performance" && hasSpecificPerformanceSignal) {
      return false;
    }

    return true;
  });
}

function getRuntimeLevel(signalCount) {
  if (signalCount <= 0) {
    return "none";
  }

  if (signalCount === 1) {
    return "low";
  }

  if (signalCount <= 4) {
    return "medium";
  }

  return "high";
}

function getExternalCouplingLevel(referenceCount) {
  if (referenceCount <= 0) {
    return "none";
  }

  if (referenceCount <= 3) {
    return "low";
  }

  if (referenceCount <= 8) {
    return "medium";
  }

  return "high";
}

function isBindingLocalToFunction(binding, functionPath) {
  if (!binding) {
    return false;
  }

  if (binding.scope === functionPath.scope) {
    return true;
  }

  return binding.scope.getFunctionParent?.() === functionPath.scope;
}

function isParamBinding(binding, functionPath) {
  return isBindingLocalToFunction(binding, functionPath) && binding.kind === "param";
}

function isBindingDeclaredInsideNestedFunction(binding, functionPath) {
  if (!binding) {
    return false;
  }

  const bindingFunctionParent = binding.scope.getFunctionParent?.();

  return Boolean(bindingFunctionParent) && bindingFunctionParent !== functionPath.scope;
}

function isInsideCallCallee(path) {
  let currentPath = path;

  while (currentPath?.parentPath) {
    const parentPath = currentPath.parentPath;

    if (
      (parentPath.isMemberExpression() || parentPath.isOptionalMemberExpression()) &&
      currentPath.key === "object"
    ) {
      currentPath = parentPath;
      continue;
    }

    if (
      (parentPath.isCallExpression() || parentPath.isOptionalCallExpression()) &&
      currentPath.key === "callee"
    ) {
      return true;
    }

    if (parentPath.isNewExpression() && currentPath.key === "callee") {
      return true;
    }

    if (
      parentPath.isParenthesizedExpression?.() ||
      parentPath.isTSNonNullExpression?.() ||
      parentPath.isTypeCastExpression?.()
    ) {
      currentPath = parentPath;
      continue;
    }

    break;
  }

  return false;
}

function isWriteTargetPath(path) {
  let currentPath = path;

  while (currentPath?.parentPath) {
    const parentPath = currentPath.parentPath;

    if (
      (parentPath.isMemberExpression() || parentPath.isOptionalMemberExpression()) &&
      currentPath.key === "object"
    ) {
      currentPath = parentPath;
      continue;
    }

    if (parentPath.isAssignmentExpression() && currentPath.key === "left") {
      return true;
    }

    if (parentPath.isUpdateExpression() && currentPath.key === "argument") {
      return true;
    }

    if (parentPath.isUnaryExpression({ operator: "delete" }) && currentPath.key === "argument") {
      return true;
    }

    if (
      parentPath.isParenthesizedExpression?.() ||
      parentPath.isTSNonNullExpression?.() ||
      parentPath.isTypeCastExpression?.()
    ) {
      currentPath = parentPath;
      continue;
    }

    break;
  }

  return false;
}

function shouldIncludeCall(calleePath, functionPath) {
  if (calleePath.isIdentifier()) {
    const binding = calleePath.scope.getBinding(calleePath.node.name);

    if (isBindingDeclaredInsideNestedFunction(binding, functionPath)) {
      return false;
    }

    return isParamBinding(binding, functionPath) || !isBindingLocalToFunction(binding, functionPath);
  }

  if (calleePath.isMemberExpression() || calleePath.isOptionalMemberExpression()) {
    const rootReference = getRootReferenceInfo(calleePath.node);

    if (!rootReference) {
      return false;
    }

    if (rootReference.kind === "this") {
      return true;
    }

    const binding = calleePath.scope.getBinding(rootReference.name);

    if (isBindingDeclaredInsideNestedFunction(binding, functionPath)) {
      return false;
    }

    return isParamBinding(binding, functionPath) || !isBindingLocalToFunction(binding, functionPath);
  }

  return false;
}

function isFunctionLikeBinding(binding) {
  if (!binding?.path) {
    return false;
  }

  if (binding.path.isFunctionDeclaration()) {
    return true;
  }

  if (
    binding.path.isVariableDeclarator() &&
    (binding.path.node.init?.type === "ArrowFunctionExpression" ||
      binding.path.node.init?.type === "FunctionExpression")
  ) {
    return true;
  }

  return binding.path.isImportSpecifier?.() || binding.path.isImportDefaultSpecifier?.();
}

function shouldTrackExternalTarget(targetPath, functionPath) {
  const rootReference = getRootReferenceInfo(targetPath.node);

  if (!rootReference) {
    return false;
  }

  if (rootReference.kind === "this") {
    return true;
  }

  const binding = targetPath.scope.getBinding(rootReference.name);

  return isParamBinding(binding, functionPath) || !isBindingLocalToFunction(binding, functionPath);
}

function shouldTrackExternalCouplingTarget(targetPath, functionPath) {
  const rootReference = getRootReferenceInfo(targetPath.node);

  if (!rootReference) {
    return false;
  }

  if (rootReference.kind === "this") {
    return true;
  }

  const binding = targetPath.scope.getBinding(rootReference.name);

  if (isBindingLocalToFunction(binding, functionPath)) {
    return false;
  }

  if (!binding && isStandardGlobalRoot(rootReference.name)) {
    return false;
  }

  return true;
}

function matchesUsageLabel(label, rootName) {
  const normalizedLabel = String(label || "").replace(/\s+/g, "");

  return (
    normalizedLabel === rootName ||
    normalizedLabel.startsWith(`${rootName}.`) ||
    normalizedLabel.startsWith(`${rootName}?.`) ||
    normalizedLabel.startsWith(`${rootName}[`) ||
    normalizedLabel.startsWith(`${rootName}?.[`)
  );
}

function isStorageUsageLabel(label) {
  const normalizedLabel = String(label || "").replace(/\s+/g, "");

  return (
    matchesUsageLabel(normalizedLabel, "localStorage") ||
    matchesUsageLabel(normalizedLabel, "sessionStorage") ||
    normalizedLabel.includes("window.localStorage") ||
    normalizedLabel.includes("window?.localStorage") ||
    normalizedLabel.includes("window.sessionStorage") ||
    normalizedLabel.includes("window?.sessionStorage")
  );
}

function buildUsageFlags({
  runtimeDirect
}) {
  const runtimeSignals = new Set(getList(runtimeDirect?.signals));

  return {
    usesWindow: runtimeSignals.has("window"),
    usesDocument: runtimeSignals.has("document"),
    usesStorage:
      runtimeSignals.has("localStorage") || runtimeSignals.has("sessionStorage"),
    usesProcessEnv: runtimeSignals.has("process.env")
  };
}

function analyzeFunction(functionPath, code) {
  const localIdentifiers = new Set();
  const externalReads = new Set();
  const externalWrites = new Set();
  const calls = new Set();
  const hiddenInputs = new Set();
  const runtimeSignals = new Set();
  const externalCouplingReads = new Set();
  const externalCouplingCallCandidates = new Set();
  const externalCouplingConstants = new Set();
  const paramLabels = (functionPath.node.params || []).map((param) => getParamLabel(param, code));
  const paramIdentifierNames = new Set();

  (functionPath.node.params || []).forEach((param) =>
    collectPatternIdentifiers(param, paramIdentifierNames)
  );

  function collectRuntimeSignal(label) {
    const signal = detectRuntimeSignal(label);

    if (signal) {
      runtimeSignals.add(signal);
    }
  }

  function trackExternalCouplingLabel(label) {
    const rootName = getTrackedLabelRoot(label);

    if (!rootName) {
      return;
    }

    if (isConstantLike(rootName)) {
      externalCouplingConstants.add(rootName);
      externalCouplingReads.delete(rootName);
      return;
    }

    externalCouplingReads.add(rootName);
  }

  functionPath.traverse({
    Function(innerPath) {
      if (innerPath === functionPath) {
        return;
      }

      if (innerPath.isFunctionDeclaration() && innerPath.node.id?.name) {
        localIdentifiers.add(innerPath.node.id.name);
      }

      (innerPath.node.params || []).forEach((param) =>
        collectPatternIdentifiers(param, localIdentifiers)
      );
    },
    VariableDeclarator(variablePath) {
      collectPatternIdentifiers(variablePath.node.id, localIdentifiers);
    },
    ClassDeclaration(classPath) {
      if (classPath.node.id?.name) {
        localIdentifiers.add(classPath.node.id.name);
      }
    },
    CatchClause(catchPath) {
      collectPatternIdentifiers(catchPath.node.param, localIdentifiers);
    },
    ReferencedIdentifier(referencePath) {
      if (referencePath.getFunctionParent() !== functionPath) {
        return;
      }

      collectRuntimeSignal(referencePath.node.name);

      if (isInsideCallCallee(referencePath)) {
        return;
      }

      const identifierName = referencePath.node.name;
      const binding = referencePath.scope.getBinding(identifierName);

      if (isBindingLocalToFunction(binding, functionPath)) {
        return;
      }

      externalReads.add(identifierName);

      if (shouldTrackExternalCouplingTarget(referencePath, functionPath)) {
        trackExternalCouplingLabel(identifierName);
      }
    },
    Identifier(referencePath) {
      if (referencePath.getFunctionParent() !== functionPath) {
        return;
      }

      if (
        referencePath.listKey !== "arguments" ||
        !referencePath.parentPath ||
        (!referencePath.parentPath.isCallExpression() &&
          !referencePath.parentPath.isOptionalCallExpression())
      ) {
        return;
      }

      const binding = referencePath.scope.getBinding(referencePath.node.name);

      if (
        isBindingDeclaredInsideNestedFunction(binding, functionPath) ||
        isBindingLocalToFunction(binding, functionPath) ||
        !isFunctionLikeBinding(binding)
      ) {
        return;
      }

      addTrackedLabel(calls, referencePath.node.name);
    },
    AssignmentExpression(assignmentPath) {
      if (assignmentPath.getFunctionParent() !== functionPath) {
        return;
      }

      const leftPath = assignmentPath.get("left");

      if (!shouldTrackExternalTarget(leftPath, functionPath)) {
        return;
      }

      addTrackedLabel(externalWrites, getNodeSource(code, leftPath.node, "unknown"));

      if (shouldTrackExternalCouplingTarget(leftPath, functionPath)) {
        trackExternalCouplingLabel(getNodeSource(code, leftPath.node, "unknown"));
      }
    },
    UpdateExpression(updatePath) {
      if (updatePath.getFunctionParent() !== functionPath) {
        return;
      }

      const argumentPath = updatePath.get("argument");

      if (!shouldTrackExternalTarget(argumentPath, functionPath)) {
        return;
      }

      addTrackedLabel(externalWrites, getNodeSource(code, argumentPath.node, "unknown"));

      if (shouldTrackExternalCouplingTarget(argumentPath, functionPath)) {
        trackExternalCouplingLabel(getNodeSource(code, argumentPath.node, "unknown"));
      }
    },
    CallExpression(callPath) {
      if (callPath.getFunctionParent() !== functionPath) {
        return;
      }

      const calleePath = callPath.get("callee");

      if (!shouldIncludeCall(calleePath, functionPath)) {
        if (calleePath.node) {
          collectRuntimeSignal(getNodeSource(code, calleePath.node, "unknown"));
        }
      } else {
        const calleeLabel = getNodeSource(code, calleePath.node, "unknown");
        collectRuntimeSignal(calleeLabel);
        addTrackedLabel(calls, calleeLabel);
      }

      if (
        shouldIncludeCall(calleePath, functionPath) &&
        shouldTrackExternalCouplingTarget(calleePath, functionPath)
      ) {
        externalCouplingCallCandidates.add(getNodeSource(code, calleePath.node, "unknown"));
      }
    },
    OptionalCallExpression(callPath) {
      if (callPath.getFunctionParent() !== functionPath) {
        return;
      }

      const calleePath = callPath.get("callee");

      if (!shouldIncludeCall(calleePath, functionPath)) {
        if (calleePath.node) {
          collectRuntimeSignal(getNodeSource(code, calleePath.node, "unknown"));
        }
      } else {
        const calleeLabel = getNodeSource(code, calleePath.node, "unknown");
        collectRuntimeSignal(calleeLabel);
        addTrackedLabel(calls, calleeLabel);
      }

      if (
        shouldIncludeCall(calleePath, functionPath) &&
        shouldTrackExternalCouplingTarget(calleePath, functionPath)
      ) {
        externalCouplingCallCandidates.add(getNodeSource(code, calleePath.node, "unknown"));
      }
    },
    NewExpression(newPath) {
      if (newPath.getFunctionParent() !== functionPath) {
        return;
      }

      const calleePath = newPath.get("callee");
      const calleeLabel = getNodeSource(code, calleePath.node, "unknown");

      collectRuntimeSignal(calleeLabel);

      if (shouldTrackExternalCouplingTarget(calleePath, functionPath)) {
        externalCouplingCallCandidates.add(calleeLabel);
      }
    },
    MemberExpression(memberPath) {
      if (memberPath.getFunctionParent() !== functionPath) {
        return;
      }

      collectRuntimeSignal(getNodeSource(code, memberPath.node, "unknown"));

      const parentPath = memberPath.parentPath;

      if (
        (parentPath.isMemberExpression() || parentPath.isOptionalMemberExpression()) &&
        memberPath.key === "object"
      ) {
        return;
      }

      if (isInsideCallCallee(memberPath) || isWriteTargetPath(memberPath)) {
        return;
      }

      if (!shouldTrackExternalTarget(memberPath, functionPath)) {
        return;
      }

      addTrackedLabel(hiddenInputs, getNodeSource(code, memberPath.node, "unknown"));

      if (shouldTrackExternalCouplingTarget(memberPath, functionPath)) {
        trackExternalCouplingLabel(getNodeSource(code, memberPath.node, "unknown"));
      }
    },
    OptionalMemberExpression(memberPath) {
      if (memberPath.getFunctionParent() !== functionPath) {
        return;
      }

      collectRuntimeSignal(getNodeSource(code, memberPath.node, "unknown"));

      const parentPath = memberPath.parentPath;

      if (
        (parentPath.isMemberExpression() || parentPath.isOptionalMemberExpression()) &&
        memberPath.key === "object"
      ) {
        return;
      }

      if (isInsideCallCallee(memberPath) || isWriteTargetPath(memberPath)) {
        return;
      }

      if (!shouldTrackExternalTarget(memberPath, functionPath)) {
        return;
      }

      addTrackedLabel(hiddenInputs, getNodeSource(code, memberPath.node, "unknown"));
      if (shouldTrackExternalCouplingTarget(memberPath, functionPath)) {
        trackExternalCouplingLabel(getNodeSource(code, memberPath.node, "unknown"));
      }
    },
    MetaProperty(metaPath) {
      if (metaPath.getFunctionParent() !== functionPath) {
        return;
      }

      if (metaPath.node.meta?.name === "import" && metaPath.node.property?.name === "meta") {
        runtimeSignals.add("import.meta");
      }
    }
  });

  paramIdentifierNames.forEach((identifierName) => localIdentifiers.delete(identifierName));

  const finalizedRuntimeSignals = finalizeRuntimeSignals(runtimeSignals);
  const runtimeDirect = {
    level: getRuntimeLevel(finalizedRuntimeSignals.length),
    signals: finalizedRuntimeSignals
  };

  const externalCoupling = {
    level: getExternalCouplingLevel(
      externalCouplingReads.size +
        externalCouplingCallCandidates.size +
        externalCouplingConstants.size
    ),
    reads: sortLabels(externalCouplingReads),
    calls: sortLabels(externalCouplingCallCandidates),
    constants: sortLabels(externalCouplingConstants)
  };

  const summary = {
    params: paramLabels,
    localIdentifiers: Array.from(localIdentifiers),
    externalReads: Array.from(externalReads),
    externalWrites: Array.from(externalWrites),
    calls: Array.from(calls),
    hiddenInputs: Array.from(hiddenInputs),
    runtimeDirect,
    externalCoupling
  };

  return {
    ...summary,
    ...buildUsageFlags(summary)
  };
}

export function collectFunctions(ast, code) {
  const rawFunctions = [];

  function pushFunction(functionName, node, declarationShape, functionPath) {
    if (!functionName || !functionPath) {
      return;
    }

    const architectureAnnotation = getArchitectureAnnotationForFunctionPath(
      functionPath,
      ast.comments,
      code
    );

    rawFunctions.push({
      name: functionName,
      declarationShape,
      start: Number.isInteger(node?.start) ? node.start : null,
      end: Number.isInteger(node?.end) ? node.end : null,
      loc: node?.loc || null,
      architectureAnnotation,
      ...analyzeFunction(functionPath, code)
    });
  }

  traverse(ast, {
    FunctionDeclaration(functionPath) {
      pushFunction(
        functionPath.node.id?.name || "",
        functionPath.node,
        "function-declaration",
        functionPath
      );
    },
    VariableDeclarator(variablePath) {
      const { id, init } = variablePath.node;

      if (
        id?.type !== "Identifier" ||
        !init ||
        (init.type !== "ArrowFunctionExpression" &&
          init.type !== "FunctionExpression")
      ) {
        return;
      }

      pushFunction(
        id.name,
        variablePath.node,
        init.type === "ArrowFunctionExpression"
          ? "arrow-function"
          : "function-expression",
        variablePath.get("init")
      );
    }
  });

  const localFunctionNames = new Set(rawFunctions.map((entry) => entry.name));
  const calledByMap = new Map(
    Array.from(localFunctionNames).map((functionName) => [functionName, new Set()])
  );
  const functions = rawFunctions.map((entry) => {
    const localCalls = [];
    const externalCalls = [];
    const externalCouplingCalls = [];
    const externalCouplingReads = sortLabels(entry.externalCoupling?.reads).filter(
      (label) => label !== entry.name
    );

    getList(entry.calls).forEach((callLabel) => {
      const rootName = getTrackedLabelRoot(callLabel);

      if (rootName && localFunctionNames.has(rootName)) {
        localCalls.push(callLabel);
        if (rootName !== entry.name) {
          calledByMap.get(rootName)?.add(entry.name);
        }
        return;
      }

      externalCalls.push(callLabel);
    });

    getList(entry.externalCoupling?.calls).forEach((callLabel) => {
      const rootName = getTrackedLabelRoot(callLabel);

      if (rootName && localFunctionNames.has(rootName)) {
        return;
      }

      externalCouplingCalls.push(callLabel);
    });

    return {
      ...entry,
      localCalls,
      externalCalls,
      externalCoupling: {
        level: getExternalCouplingLevel(
          externalCouplingReads.length +
            externalCouplingCalls.length +
            getList(entry.externalCoupling?.constants).length
        ),
        reads: externalCouplingReads,
        calls: sortLabels(externalCouplingCalls),
        constants: sortLabels(entry.externalCoupling?.constants)
      }
    };
  });

  return functions.map((entry) => ({
    ...entry,
    calledBy: Array.from(calledByMap.get(entry.name) || []).sort((left, right) =>
      String(left).localeCompare(String(right))
    )
  }));
}

export function inspectSourceText(code) {
  const parsed = parseSourceFile(code);
  const functions = collectFunctions(parsed.ast, code);
  const sourceHealth = analyzeSourceHealth(code, functions);

  return {
    parserMode: parsed.parserMode,
    warnings: uniqueStrings([...parsed.warnings, ...getList(sourceHealth.warnings)]),
    sourceHealth,
    functionsCount: functions.length,
    functions
  };
}

export function createInspectPostHandler(_config = {}) {
  return async function POST(request) {
    try {
      const body = await request.json().catch(() => ({}));
      const script = String(body?.script || "").trim();

      if (!script) {
        return Response.json(
          { status: "error", error: "Campo 'script' ausente." },
          { status: 400 }
        );
      }

      const filePath = resolveFile(script);
      const code = await fs.readFile(filePath, "utf8");
      let parsed;

      try {
        parsed = parseSourceFile(code);
      } catch (error) {
        return Response.json(
          {
            status: "error",
            error: "Nao foi possivel parsear o arquivo com as opcoes suportadas.",
            parseError: String(error?.message || error)
          },
          { status: 400 }
        );
      }

      const functions = collectFunctions(parsed.ast, code);

      const sourceHealth = analyzeSourceHealth(code, functions);

      return Response.json({
        status: "ok",
        filePath,
        parserMode: parsed.parserMode,
        warnings: uniqueStrings([...parsed.warnings, ...getList(sourceHealth.warnings)]),
        sourceHealth,
        functionsCount: functions.length,
        functions
      });
    } catch (error) {
      return Response.json(
        {
          status: "error",
          error: error instanceof Error ? error.message : "Erro desconhecido."
        },
        { status: 500 }
      );
    }
  };
}
