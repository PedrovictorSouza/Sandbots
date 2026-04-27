import { promises as fs } from "node:fs";
import path from "node:path";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";
import generateModule from "@babel/generator";
import { inspectSourceText } from "./inspect-handler.js";
import { buildNoCandidateClassification as buildNoCandidateClassificationShared } from "../refactor/refactor-analysis.js";

const traverse = traverseModule.default;
const generate = generateModule.default;

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

const SAFE_GLOBAL_ROOTS = new Set([
  "Array",
  "Boolean",
  "JSON",
  "Math",
  "Number",
  "Object",
  "RegExp",
  "String"
]);

const BLOCKED_RUNTIME_ROOTS = new Set([
  "Date",
  "document",
  "fetch",
  "globalThis",
  "history",
  "localStorage",
  "location",
  "navigator",
  "process",
  "sessionStorage",
  "window"
]);

const GENERIC_HELPER_SEED_NAMES = new Set([
  "config",
  "data",
  "label",
  "message",
  "options",
  "payload",
  "request",
  "response",
  "result",
  "snapshot",
  "text",
  "value"
]);

function getList(items) {
  return Array.isArray(items) ? items : [];
}

function getCount(items) {
  return getList(items).length;
}

function resolveConfiguredPath(projectRoot, filePath) {
  const normalized = String(filePath || "").trim();

  if (!normalized) {
    return "";
  }

  return path.isAbsolute(normalized)
    ? path.normalize(normalized)
    : path.normalize(path.join(projectRoot, normalized));
}

function normalizeRefactorConfig(config = {}) {
  const projectRoot = path.resolve(
    String(config?.refactor?.projectRoot || process.cwd())
  );
  const allowedFilePaths = Array.isArray(config?.refactor?.allowedFilePaths)
    ? config.refactor.allowedFilePaths
        .map((filePath) => resolveConfiguredPath(projectRoot, filePath))
        .filter(Boolean)
    : [];

  return {
    projectRoot,
    allowedFilePathSet: new Set(allowedFilePaths)
  };
}

function isFileWithinProjectRoot(filePath, projectRoot) {
  const relativePath = path.relative(projectRoot, filePath);

  return (
    relativePath === "" ||
    (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))
  );
}

function resolveScriptPath(script, normalizedConfig) {
  const normalizedScript = String(script || "").trim();

  if (!normalizedScript) {
    return "";
  }

  return path.isAbsolute(normalizedScript)
    ? path.normalize(normalizedScript)
    : path.normalize(path.join(normalizedConfig.projectRoot, normalizedScript));
}

function ensureScriptAccess(filePath, normalizedConfig) {
  if (!filePath) {
    throw new Error("Arquivo de origem ausente.");
  }

  if (normalizedConfig.allowedFilePathSet.size > 0) {
    if (!normalizedConfig.allowedFilePathSet.has(filePath)) {
      throw new Error("Arquivo fora da lista permitida para refatoracao.");
    }

    return;
  }

  if (!isFileWithinProjectRoot(filePath, normalizedConfig.projectRoot)) {
    throw new Error("Arquivo fora da raiz permitida do projeto.");
  }
}

function parseSourceFile(sourceText) {
  try {
    return parse(sourceText, {
      sourceType: "module",
      plugins: DEFAULT_PARSER_PLUGINS_TS
    });
  } catch (_typescriptError) {
    return parse(sourceText, {
      sourceType: "module",
      plugins: DEFAULT_PARSER_PLUGINS_FLOW
    });
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

  return code.slice(node.start, node.end).trim() || fallback;
}

function getTrackedLabelRoot(label) {
  const normalizedLabel = String(label || "")
    .replace(/\?\.\[/g, "[")
    .replace(/\?\./g, ".")
    .replace(/\s+/g, "")
    .trim();
  const match = normalizedLabel.match(/^(this|[A-Za-z_$][A-Za-z0-9_$]*)/);

  return match?.[1] || "";
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

function isBindingLocalToFunction(binding, functionPath) {
  if (!binding) {
    return false;
  }

  if (binding.scope === functionPath.scope) {
    return true;
  }

  return binding.scope.getFunctionParent?.() === functionPath.scope;
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

function cloneAstNode(node) {
  return JSON.parse(JSON.stringify(node));
}

function toPascalCase(value) {
  return String(value || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function toCamelCase(value) {
  const pascalValue = toPascalCase(value);

  return pascalValue
    ? pascalValue.charAt(0).toLowerCase() + pascalValue.slice(1)
    : "";
}

function singularize(value) {
  const normalized = String(value || "").trim();

  if (/ies$/i.test(normalized)) {
    return normalized.replace(/ies$/i, "y");
  }

  if (/ses$/i.test(normalized)) {
    return normalized.replace(/es$/i, "");
  }

  if (/s$/i.test(normalized) && !/ss$/i.test(normalized)) {
    return normalized.slice(0, -1);
  }

  return normalized;
}

function normalizeFunctionCoreName(functionName) {
  const normalized = String(functionName || "").trim();
  const withoutLeadingVerb = normalized.replace(
    /^(handle|build|create|compute|format|get|infer|normalize|parse|resolve|scan|set|update)/,
    ""
  );
  const withoutSuffix = withoutLeadingVerb.replace(
    /(ToCode|FromCode|InCode|System|State|Value)$/i,
    ""
  );

  return withoutSuffix || normalized || "Extracted";
}

function collectNamedFunctionEntries(ast, sourceText) {
  const entries = new Map();

  function registerEntry(functionName, node, options = {}) {
    if (!functionName || !node || !Number.isInteger(node.start) || !Number.isInteger(node.end)) {
      return;
    }

    if (entries.has(functionName)) {
      throw new Error(`Ha mais de uma definicao para a funcao ${functionName}.`);
    }

    const startLine = node.loc?.start?.line || null;
    const endLine = node.loc?.end?.line || null;

    entries.set(functionName, {
      functionName,
      start: node.start,
      end: node.end,
      startLine,
      endLine,
      source: sourceText.slice(node.start, node.end),
      declarationShape: options.declarationShape || "function"
    });
  }

  traverse(ast, {
    FunctionDeclaration(functionPath) {
      registerEntry(functionPath.node.id?.name, functionPath.node, {
        declarationShape: "function-declaration"
      });
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

      const parentDeclaration = variablePath.parentPath?.node;
      const declarationNode =
        parentDeclaration?.type === "VariableDeclaration" &&
        parentDeclaration.declarations.length === 1
          ? parentDeclaration
          : variablePath.node;

      registerEntry(id.name, declarationNode, {
        declarationShape:
          declarationNode === variablePath.node
            ? "variable-declarator"
            : "variable-declaration"
      });
    }
  });

  return entries;
}

function findNamedFunctionPath(ast, functionName) {
  let targetPath = null;

  traverse(ast, {
    FunctionDeclaration(functionPath) {
      if (targetPath || functionPath.node.id?.name !== functionName) {
        return;
      }

      targetPath = functionPath;
      functionPath.stop();
    },
    VariableDeclarator(variablePath) {
      if (targetPath) {
        return;
      }

      const { id, init } = variablePath.node;

      if (
        id?.type !== "Identifier" ||
        id.name !== functionName ||
        !init ||
        (init.type !== "ArrowFunctionExpression" &&
          init.type !== "FunctionExpression")
      ) {
        return;
      }

      targetPath = variablePath.get("init");
      variablePath.stop();
    }
  });

  return targetPath;
}

function collectContainingScopeBindingNames(functionPath) {
  const bindingNames = new Set();
  const scopeBindings =
    functionPath.scope.parent?.bindings || functionPath.scope.bindings || {};

  Object.keys(scopeBindings).forEach((bindingName) => {
    bindingNames.add(bindingName);
  });

  return bindingNames;
}

function collectFunctionScopeBindingNames(functionPath) {
  const bindingNames = new Set();
  const scopeBindings = functionPath.scope.bindings || {};

  Object.keys(scopeBindings).forEach((bindingName) => {
    bindingNames.add(bindingName);
  });

  return bindingNames;
}

function uniqueArray(items) {
  return Array.from(new Set(items));
}

export function collectUsedIdentifierNames(ast) {
  const names = new Set();

  traverse(ast, {
    Identifier(identifierPath) {
      const identifierName = String(identifierPath.node?.name || "").trim();

      if (identifierName) {
        names.add(identifierName);
      }
    }
  });

  return names;
}

function buildIdentifierNameVariants(baseName, options = {}) {
  const normalizedBaseName =
    String(baseName || "").trim() || options.fallbackName || "extractedName";
  const variantCandidates = [normalizedBaseName];
  const pascalBaseName = toPascalCase(normalizedBaseName);
  const buildPrefixedName =
    pascalBaseName && !/^build[A-Z]/.test(normalizedBaseName)
      ? `build${pascalBaseName}`
      : "";

  if (buildPrefixedName && buildPrefixedName !== normalizedBaseName) {
    variantCandidates.push(buildPrefixedName);
  }

  if (options.kind === "binding") {
    variantCandidates.push(`${normalizedBaseName}Ctx`);
    variantCandidates.push(`${normalizedBaseName}Data`);
    variantCandidates.push(`${normalizedBaseName}2`);
  } else {
    variantCandidates.push(`${normalizedBaseName}Helper`);
    variantCandidates.push(`${normalizedBaseName}Data`);
    variantCandidates.push(`${normalizedBaseName}2`);
  }

  return uniqueArray(variantCandidates.filter(Boolean));
}

function resolveIdentifierNameFromSet(baseName, existingNames, options = {}) {
  const normalizedBaseName =
    String(baseName || "").trim() || options.fallbackName || "extractedName";
  const variantCandidates = buildIdentifierNameVariants(normalizedBaseName, options);

  for (const candidateName of variantCandidates) {
    if (!candidateName || existingNames.has(candidateName)) {
      continue;
    }

    existingNames.add(candidateName);
    return candidateName;
  }

  let suffix = 3;
  let candidateName = `${normalizedBaseName}${suffix}`;

  while (existingNames.has(candidateName)) {
    suffix += 1;
    candidateName = `${normalizedBaseName}${suffix}`;
  }

  existingNames.add(candidateName);
  return candidateName;
}

export function resolveIdentifierName(ast, baseName, options = {}) {
  const usedNames = collectUsedIdentifierNames(ast);

  return resolveIdentifierNameFromSet(baseName, usedNames, options);
}

function buildUniqueHelperName(baseName, existingNames) {
  return resolveIdentifierNameFromSet(baseName, existingNames, {
    kind: "helper",
    fallbackName: "buildExtractedBlock"
  });
}

function buildUniqueBindingName(baseName, existingNames) {
  return resolveIdentifierNameFromSet(baseName, existingNames, {
    kind: "binding",
    fallbackName: "extractedContext"
  });
}

function getPropertyKeyLabel(propertyNode) {
  if (!propertyNode || propertyNode.computed) {
    return "";
  }

  if (propertyNode.key?.type === "Identifier") {
    return propertyNode.key.name;
  }

  if (propertyNode.key?.type === "StringLiteral") {
    return propertyNode.key.value;
  }

  return "";
}

function getCandidateNameParts(expressionPath, functionName) {
  const kindPrefix = expressionPath.isTemplateLiteral() ? "format" : "build";
  const directParent = expressionPath.parentPath;
  const functionCore = normalizeFunctionCoreName(functionName);

  if (
    directParent?.isVariableDeclarator() &&
    directParent.node.id?.type === "Identifier" &&
    directParent.get("init") === expressionPath
  ) {
    const bindingName = directParent.node.id.name;
    const useFunctionContext = GENERIC_HELPER_SEED_NAMES.has(
      String(bindingName || "").trim().toLowerCase()
    );

    return {
      baseName: useFunctionContext
        ? `${kindPrefix}${toPascalCase(functionCore)}${toPascalCase(bindingName)}`
        : `${kindPrefix}${toPascalCase(bindingName)}`,
      sourceKind: "binding"
    };
  }

  if (
    directParent?.isObjectProperty() &&
    directParent.get("value") === expressionPath
  ) {
    const directPropertyLabel = getPropertyKeyLabel(directParent.node);

    if (directPropertyLabel) {
      return {
        baseName: `${kindPrefix}${toPascalCase(functionCore)}${toPascalCase(
          singularize(directPropertyLabel)
        )}`,
        sourceKind: "property"
      };
    }
  }

  const callPath = expressionPath.findParent(
    (candidatePath) =>
      (candidatePath.isCallExpression() || candidatePath.isOptionalCallExpression()) &&
      candidatePath.getFunctionParent() === expressionPath.getFunctionParent()
  );

  if (callPath) {
    const calleeNode = callPath.get("callee").node;

    if (calleeNode?.type === "Identifier") {
      const calleeName = calleeNode.name;

      if (/^set[A-Z]/.test(calleeName)) {
        return {
          baseName: `${kindPrefix}${toPascalCase(functionCore)}${calleeName.replace(
            /^set/,
            ""
          )}`,
          sourceKind: "call"
        };
      }

      if (/^(register|update|create|build|resolve)[A-Z]/.test(calleeName)) {
        return {
          baseName: `${kindPrefix}${toPascalCase(functionCore)}${toPascalCase(
            calleeName
          )}Payload`,
          sourceKind: "call"
        };
      }
    }
  }

  const propertyPath = expressionPath.findParent(
    (candidatePath) =>
      candidatePath.isObjectProperty() &&
      candidatePath.getFunctionParent() === expressionPath.getFunctionParent()
  );

  if (propertyPath) {
    const propertyLabel = getPropertyKeyLabel(propertyPath.node);

    if (propertyLabel) {
      const singularLabel = singularize(propertyLabel);

      return {
        baseName: `${kindPrefix}${toPascalCase(functionCore)}${toPascalCase(singularLabel)}`,
        sourceKind: "context-property"
      };
    }
  }

  const suffix = expressionPath.isTemplateLiteral() ? "Message" : "Block";

  return {
    baseName: `${kindPrefix}${toPascalCase(functionCore)}${suffix}`,
    sourceKind: "fallback"
  };
}

function inferCandidateBaseName(expressionPath, functionName) {
  return getCandidateNameParts(expressionPath, functionName).baseName;
}

function getExpressionStructuralMetrics(expressionPath) {
  const metrics = {
    objectPropertyCount: 0,
    objectSpreadCount: 0,
    arrayElementCount: 0,
    templateExpressionCount: 0,
    nestedStructureCount: 0,
    hasNestedConditional: false
  };

  if (expressionPath.isObjectExpression()) {
    expressionPath.node.properties.forEach((propertyNode) => {
      if (propertyNode.type === "ObjectProperty") {
        metrics.objectPropertyCount += 1;
      } else if (propertyNode.type === "SpreadElement") {
        metrics.objectSpreadCount += 1;
      }
    });
  }

  if (expressionPath.isArrayExpression()) {
    metrics.arrayElementCount = expressionPath.node.elements.filter(Boolean).length;
  }

  if (expressionPath.isTemplateLiteral()) {
    metrics.templateExpressionCount = expressionPath.node.expressions.length;
  }

  expressionPath.traverse({
    Function(innerPath) {
      innerPath.skip();
    },
    ObjectExpression(innerPath) {
      if (innerPath === expressionPath) {
        return;
      }

      metrics.nestedStructureCount += 1;
      innerPath.skip();
    },
    ArrayExpression(innerPath) {
      if (innerPath === expressionPath) {
        return;
      }

      metrics.nestedStructureCount += 1;
      innerPath.skip();
    },
    ConditionalExpression(innerPath) {
      metrics.nestedStructureCount += 1;
      metrics.hasNestedConditional = true;
      innerPath.skip();
    }
  });

  return metrics;
}

function getCandidateNamingQualityScore(helperName, sourceKind) {
  let score = 0;

  if (sourceKind === "binding") {
    score += 5;
  } else if (sourceKind === "property") {
    score += 4;
  } else if (sourceKind === "call") {
    score += 2;
  } else if (sourceKind === "context-property") {
    score += 1;
  } else {
    score -= 3;
  }

  if (/Block$/i.test(helperName)) {
    score -= 5;
  }

  if (/Message$/i.test(helperName)) {
    score -= 2;
  }

  if (/\d+$/.test(helperName)) {
    score -= 1;
  }

  return score;
}

function getCandidateImpactScore(expressionPath, analysis, metrics, contextRank) {
  let score = 0;

  if (expressionPath.isObjectExpression()) {
    score += 8;
    score += Math.min(metrics.objectPropertyCount * 2, 10);
    score += Math.min(metrics.objectSpreadCount * 2, 4);
  } else if (expressionPath.isArrayExpression()) {
    score += 6;
    score += Math.min(metrics.arrayElementCount * 2, 8);
  } else if (expressionPath.isTemplateLiteral()) {
    score += 1;
    score += Math.min(metrics.templateExpressionCount, 3);
  }

  score += Math.min(Math.max(analysis.lineSpan - 1, 0), 5);
  score += Math.min(analysis.inputsUsed.length, 4);
  score += Math.min(metrics.nestedStructureCount * 2, 6);

  if (contextRank <= 2) {
    score += 3;
  } else if (contextRank === 3) {
    score += 1;
  }

  if (metrics.hasNestedConditional) {
    score += 2;
  }

  if (analysis.safeCalls.length > 0) {
    score += 1;
  }

  if (expressionPath.isTemplateLiteral()) {
    score -= 7;
  }

  return score;
}

function shouldRejectLowValueCandidate(expressionPath, analysis, metrics, helperName, scoreMeta) {
  if (
    expressionPath.isTemplateLiteral() &&
    analysis.lineSpan === 1 &&
    metrics.templateExpressionCount <= 2 &&
    analysis.safeCalls.length === 0
  ) {
    return true;
  }

  if (
    expressionPath.isObjectExpression() &&
    metrics.objectPropertyCount <= 1 &&
    metrics.objectSpreadCount === 0 &&
    analysis.lineSpan === 1 &&
    analysis.safeCalls.length === 0
  ) {
    return true;
  }

  if (
    scoreMeta.impactScore < 8 ||
    scoreMeta.priorityScore < 6
  ) {
    return true;
  }

  if (
    /Block$/i.test(helperName) &&
    analysis.lineSpan <= 2 &&
    metrics.nestedStructureCount === 0
  ) {
    return true;
  }

  return false;
}

function isSafeGlobalCall(callLabel) {
  const rootName = getTrackedLabelRoot(callLabel);

  if (!rootName || !SAFE_GLOBAL_ROOTS.has(rootName)) {
    return false;
  }

  if (/^Math\.random$/i.test(callLabel) || /^Date\.now$/i.test(callLabel)) {
    return false;
  }

  return true;
}

function getMemberObjectSource(code, memberPath) {
  return getNodeSource(code, memberPath.get("object").node, "");
}

function isGuardReturnConsequent(consequentPath) {
  if (!consequentPath) {
    return false;
  }

  if (consequentPath.isReturnStatement()) {
    return true;
  }

  if (!consequentPath.isBlockStatement()) {
    return false;
  }

  const bodyPaths = consequentPath.get("body");

  return (
    bodyPaths.length === 1 &&
    bodyPaths[0].isReturnStatement()
  );
}

function getLeadingGuardStatementCount(functionPath) {
  const bodyPath = functionPath.get("body");

  if (!bodyPath?.isBlockStatement()) {
    return 0;
  }

  const bodyStatements = bodyPath.get("body");
  let guardCount = 0;

  for (const statementPath of bodyStatements) {
    if (
      statementPath.isIfStatement() &&
      !statementPath.node.alternate &&
      isGuardReturnConsequent(statementPath.get("consequent"))
    ) {
      guardCount += 1;
      continue;
    }

    break;
  }

  return guardCount;
}

function buildMemberExpressionFromPath(pathParts) {
  if (!Array.isArray(pathParts) || pathParts.length === 0) {
    return null;
  }

  return pathParts.slice(1).reduce(
    (currentNode, part) =>
      ({
        type: "MemberExpression",
        object: currentNode,
        property: {
          type: "Identifier",
          name: part
        },
        computed: false,
        optional: false
      }),
    {
      type: "Identifier",
      name: pathParts[0]
    }
  );
}

function extractMemberPathParts(node) {
  if (!node) {
    return null;
  }

  if (node.type === "Identifier") {
    return [node.name];
  }

  if (
    (node.type === "MemberExpression" || node.type === "OptionalMemberExpression") &&
    !node.computed &&
    node.property?.type === "Identifier"
  ) {
    const objectParts = extractMemberPathParts(node.object);

    if (!objectParts) {
      return null;
    }

    return [...objectParts, node.property.name];
  }

  return null;
}

function memberPathStartsWith(node, expectedParts) {
  const actualParts = extractMemberPathParts(node);

  if (!actualParts || actualParts.length < expectedParts.length) {
    return false;
  }

  return expectedParts.every((part, index) => actualParts[index] === part);
}

function createIdentifierMemberAccess(objectName, propertyName) {
  return {
    type: "MemberExpression",
    object: {
      type: "Identifier",
      name: objectName
    },
    property: {
      type: "Identifier",
      name: propertyName
    },
    computed: false,
    optional: false
  };
}

function cloneExpressionNode(node) {
  return cloneAstNode(node);
}

function analyzeExpressionCandidate(expressionPath, functionPath, code) {
  const inputRoots = new Map();
  const safeCalls = new Set();
  const blockedReasons = new Set();
  const source = getNodeSource(code, expressionPath.node, "");
  const startLine = expressionPath.node.loc?.start?.line || null;
  const endLine = expressionPath.node.loc?.end?.line || null;
  const metrics = getExpressionStructuralMetrics(expressionPath);

  function registerInput(rootName) {
    const normalizedRootName = String(rootName || "").trim();

    if (!normalizedRootName || SAFE_GLOBAL_ROOTS.has(normalizedRootName)) {
      return;
    }

    if (!inputRoots.has(normalizedRootName)) {
      inputRoots.set(normalizedRootName, inputRoots.size);
    }
  }

  expressionPath.traverse({
    Function(innerPath) {
      innerPath.skip();
    },
    ThisExpression() {
      blockedReasons.add("usa this");
    },
    AwaitExpression() {
      blockedReasons.add("usa await");
    },
    YieldExpression() {
      blockedReasons.add("usa yield");
    },
    AssignmentExpression() {
      blockedReasons.add("faz escrita");
    },
    UpdateExpression() {
      blockedReasons.add("faz escrita");
    },
    NewExpression() {
      blockedReasons.add("instancia objeto");
    },
    TaggedTemplateExpression() {
      blockedReasons.add("usa template tag");
    },
    JSXElement() {
      blockedReasons.add("gera JSX");
    },
    JSXFragment() {
      blockedReasons.add("gera JSX");
    },
    UnaryExpression(unaryPath) {
      if (unaryPath.node.operator === "delete") {
        blockedReasons.add("usa delete");
      }
    },
    CallExpression(callPath) {
      const callLabel = getNodeSource(code, callPath.get("callee").node, "unknown");

      if (!isSafeGlobalCall(callLabel)) {
        blockedReasons.add(`chamada nao deterministica: ${callLabel}`);
        return;
      }

      safeCalls.add(callLabel);
    },
    OptionalCallExpression(callPath) {
      const callLabel = getNodeSource(code, callPath.get("callee").node, "unknown");

      if (!isSafeGlobalCall(callLabel)) {
        blockedReasons.add(`chamada nao deterministica: ${callLabel}`);
        return;
      }

      safeCalls.add(callLabel);
    },
    MemberExpression(memberPath) {
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

      const rootReference = getRootReferenceInfo(memberPath.node);

      if (!rootReference) {
        return;
      }

      if (rootReference.kind === "this") {
        blockedReasons.add("usa this");
        return;
      }

      if (BLOCKED_RUNTIME_ROOTS.has(rootReference.name)) {
        blockedReasons.add(`runtime: ${rootReference.name}`);
        return;
      }

      registerInput(rootReference.name);
    },
    OptionalMemberExpression(memberPath) {
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

      const rootReference = getRootReferenceInfo(memberPath.node);

      if (!rootReference) {
        return;
      }

      if (rootReference.kind === "this") {
        blockedReasons.add("usa this");
        return;
      }

      if (BLOCKED_RUNTIME_ROOTS.has(rootReference.name)) {
        blockedReasons.add(`runtime: ${rootReference.name}`);
        return;
      }

      registerInput(rootReference.name);
    },
    ReferencedIdentifier(referencePath) {
      if (referencePath.getFunctionParent() !== functionPath) {
        return;
      }

      if (isInsideCallCallee(referencePath)) {
        return;
      }

      const identifierName = referencePath.node.name;

      if (BLOCKED_RUNTIME_ROOTS.has(identifierName)) {
        blockedReasons.add(`runtime: ${identifierName}`);
        return;
      }

      const binding = referencePath.scope.getBinding(identifierName);

      if (binding && isBindingLocalToFunction(binding, functionPath)) {
        registerInput(identifierName);
        return;
      }

      if (!SAFE_GLOBAL_ROOTS.has(identifierName)) {
        registerInput(identifierName);
      }
    }
  });

  if (blockedReasons.size > 0) {
    return {
      isSafe: false,
      blockedReasons: Array.from(blockedReasons)
    };
  }

  const inputsUsed = Array.from(inputRoots.keys());
  const lineSpan =
    startLine && endLine ? Math.max(1, endLine - startLine + 1) : 1;

  if (!inputsUsed.length) {
    return {
      isSafe: false,
      blockedReasons: ["bloco sem inputs dinamicos relevantes"]
    };
  }

  let riskScore =
    inputsUsed.length * 2 +
    safeCalls.size * 2 +
    (lineSpan >= 8 ? 2 : lineSpan >= 4 ? 1 : 0);

  if (expressionPath.isTemplateLiteral()) {
    riskScore += 1;
  }

  const risk =
    riskScore <= 4 ? "low" : riskScore <= 7 ? "medium" : "high";

  return {
    isSafe: true,
    source,
    start: expressionPath.node.start,
    end: expressionPath.node.end,
    startLine,
    endLine,
    lineSpan,
    inputsUsed,
    safeCalls: Array.from(safeCalls),
    metrics,
    risk,
    riskScore
  };
}

function buildCandidateReason(expressionPath, analysis, scoreMeta) {
  const { metrics, nameSourceKind } = scoreMeta;
  const baseReason = expressionPath.isTemplateLiteral()
    ? "formatacao pura sem side effects"
    : expressionPath.isArrayExpression()
      ? "builder puro de array"
      : "builder puro de objeto";
  const qualifiers = [];

  if (expressionPath.isObjectExpression() && metrics.objectPropertyCount > 0) {
    qualifiers.push(`${metrics.objectPropertyCount} campo(s)`);
  }

  if (expressionPath.isArrayExpression() && metrics.arrayElementCount > 0) {
    qualifiers.push(`${metrics.arrayElementCount} item(ns)`);
  }

  if (expressionPath.isTemplateLiteral() && metrics.templateExpressionCount > 0) {
    qualifiers.push(`${metrics.templateExpressionCount} interpolacao(oes)`);
  }

  if (metrics.nestedStructureCount > 0) {
    qualifiers.push("remove estrutura aninhada");
  }

  if (analysis.inputsUsed.length > 0) {
    qualifiers.push(`explicita ${analysis.inputsUsed.length} dependencia(s)`);
  }

  if (nameSourceKind === "binding" || nameSourceKind === "property") {
    qualifiers.push("nome semantico claro");
  } else if (nameSourceKind === "call") {
    qualifiers.push("encaixa no fluxo do handler");
  }

  return [baseReason, ...qualifiers].join(", ");
}

function getCandidateContextRank(expressionPath) {
  const directParent = expressionPath.parentPath;

  if (
    directParent?.isVariableDeclarator() &&
    directParent.get("init") === expressionPath
  ) {
    return 1;
  }

  if (
    (directParent?.isCallExpression() || directParent?.isOptionalCallExpression()) &&
    expressionPath.listKey === "arguments"
  ) {
    return 1;
  }

  if (directParent?.isReturnStatement() && directParent.get("argument") === expressionPath) {
    return 2;
  }

  if (directParent?.isArrayExpression() && expressionPath.listKey === "elements") {
    return 3;
  }

  if (directParent?.isObjectProperty() && directParent.get("value") === expressionPath) {
    return 4;
  }

  return 5;
}

function compareCandidates(left, right) {
  const typeWeight = {
    ObjectExpression: 1,
    ArrayExpression: 2,
    TemplateLiteral: 3
  };

  if (left.priorityScore !== right.priorityScore) {
    return right.priorityScore - left.priorityScore;
  }

  if (left.impactScore !== right.impactScore) {
    return right.impactScore - left.impactScore;
  }

  if (left.namingQualityScore !== right.namingQualityScore) {
    return right.namingQualityScore - left.namingQualityScore;
  }

  if (left.riskScore !== right.riskScore) {
    return left.riskScore - right.riskScore;
  }

  if ((left.contextRank || 99) !== (right.contextRank || 99)) {
    return (left.contextRank || 99) - (right.contextRank || 99);
  }

  if ((typeWeight[left.nodeType] || 99) !== (typeWeight[right.nodeType] || 99)) {
    return (typeWeight[left.nodeType] || 99) - (typeWeight[right.nodeType] || 99);
  }

  if (left.lineSpan !== right.lineSpan) {
    return right.lineSpan - left.lineSpan;
  }

  if (left.inputsUsed.length !== right.inputsUsed.length) {
    return right.inputsUsed.length - left.inputsUsed.length;
  }

  return left.start - right.start;
}

function collectSafeExtractionCandidates(functionPath, code, functionName, existingNames) {
  const candidates = [];

  function maybeRegisterCandidate(expressionPath) {
    if (expressionPath.getFunctionParent() !== functionPath) {
      return;
    }

    const analysis = analyzeExpressionCandidate(expressionPath, functionPath, code);
    const contextRank = getCandidateContextRank(expressionPath);

    if (!analysis.isSafe) {
      return;
    }

    if (expressionPath.isTemplateLiteral() && analysis.inputsUsed.length <= 1) {
      return;
    }

    if (analysis.inputsUsed.length === 1 && contextRank >= 4) {
      return;
    }

    const nameParts = getCandidateNameParts(expressionPath, functionName);
    const helperName = buildUniqueHelperName(nameParts.baseName, existingNames);
    const namingQualityScore = getCandidateNamingQualityScore(
      helperName,
      nameParts.sourceKind
    );
    const impactScore = getCandidateImpactScore(
      expressionPath,
      analysis,
      analysis.metrics,
      contextRank
    );
    const priorityScore = impactScore + namingQualityScore - analysis.riskScore;

    if (
      shouldRejectLowValueCandidate(
        expressionPath,
        analysis,
        analysis.metrics,
        helperName,
        { impactScore, namingQualityScore, priorityScore }
      )
    ) {
      return;
    }

    candidates.push({
      id: `${analysis.start}-${analysis.end}`,
      name: helperName,
      helperName,
      nodeType: expressionPath.node.type,
      contextRank,
      nameSourceKind: nameParts.sourceKind,
      namingQualityScore,
      impactScore,
      priorityScore,
      reason: buildCandidateReason(expressionPath, analysis, {
        metrics: analysis.metrics,
        nameSourceKind: nameParts.sourceKind,
        namingQualityScore,
        impactScore,
        priorityScore
      }),
      ...analysis
    });
  }

  functionPath.traverse({
    Function(innerPath) {
      innerPath.skip();
    },
    ObjectExpression(expressionPath) {
      maybeRegisterCandidate(expressionPath);
    },
    ArrayExpression(expressionPath) {
      maybeRegisterCandidate(expressionPath);
    },
    TemplateLiteral(expressionPath) {
      maybeRegisterCandidate(expressionPath);
    }
  });

  return candidates.sort(compareCandidates).slice(0, 3);
}

function statementContainsMixedSignal(statementPath, functionPath, code) {
  let isMixed = false;

  statementPath.traverse({
    Function(innerPath) {
      innerPath.skip();
    },
    TryStatement(innerPath) {
      if (innerPath === statementPath) {
        isMixed = true;
        innerPath.stop();
      }
    },
    IfStatement(innerPath) {
      if (innerPath === statementPath) {
        isMixed = true;
        innerPath.stop();
      }
    },
    SwitchStatement(innerPath) {
      if (innerPath === statementPath) {
        isMixed = true;
        innerPath.stop();
      }
    },
    ForStatement() {
      isMixed = true;
    },
    ForInStatement() {
      isMixed = true;
    },
    ForOfStatement() {
      isMixed = true;
    },
    WhileStatement() {
      isMixed = true;
    },
    DoWhileStatement() {
      isMixed = true;
    },
    AwaitExpression() {
      isMixed = true;
    },
    ThrowStatement() {
      isMixed = true;
    },
    NewExpression() {
      isMixed = true;
    },
    AssignmentExpression() {
      isMixed = true;
    },
    UpdateExpression() {
      isMixed = true;
    },
    CallExpression(callPath) {
      const callLabel = getNodeSource(code, callPath.get("callee").node, "unknown");

      if (!isSafeGlobalCall(callLabel)) {
        isMixed = true;
      }
    },
    OptionalCallExpression(callPath) {
      const callLabel = getNodeSource(code, callPath.get("callee").node, "unknown");

      if (!isSafeGlobalCall(callLabel)) {
        isMixed = true;
      }
    },
    MemberExpression(memberPath) {
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

      const rootReference = getRootReferenceInfo(memberPath.node);

      if (!rootReference) {
        return;
      }

      if (rootReference.kind === "this" || BLOCKED_RUNTIME_ROOTS.has(rootReference.name)) {
        isMixed = true;
      }
    },
    OptionalMemberExpression(memberPath) {
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

      const rootReference = getRootReferenceInfo(memberPath.node);

      if (!rootReference) {
        return;
      }

      if (rootReference.kind === "this" || BLOCKED_RUNTIME_ROOTS.has(rootReference.name)) {
        isMixed = true;
      }
    },
    ReferencedIdentifier(referencePath) {
      if (referencePath.getFunctionParent() !== functionPath) {
        return;
      }

      if (isInsideCallCallee(referencePath)) {
        return;
      }

      const identifierName = referencePath.node.name;

      if (BLOCKED_RUNTIME_ROOTS.has(identifierName)) {
        isMixed = true;
      }
    }
  });

  return isMixed;
}

function countRemainingMixedZones(functionPath, code) {
  const bodyPath = functionPath.get("body");

  if (!bodyPath?.isBlockStatement()) {
    return 0;
  }

  return bodyPath
    .get("body")
    .filter((statementPath) => statementContainsMixedSignal(statementPath, functionPath, code))
    .length;
}

function parseSingleStatementNode(source, errorLabel) {
  const ast = parseSourceFile(source);
  const statements = ast.program.body.filter((statement) => statement.type !== "EmptyStatement");

  if (statements.length !== 1) {
    throw new Error(`${errorLabel} deve conter exatamente uma declaracao.`);
  }

  return statements[0];
}

function parseFunctionBodyStatementNode(source, errorLabel) {
  const ast = parseSourceFile(`function __pragt_temp__() {\n${source}\n}`);
  const functionDeclaration = ast.program.body.find(
    (statement) => statement.type === "FunctionDeclaration"
  );
  const statements = getList(functionDeclaration?.body?.body).filter(
    (statement) => statement.type !== "EmptyStatement"
  );

  if (statements.length !== 1) {
    throw new Error(`${errorLabel} deve conter exatamente uma declaracao no corpo.`);
  }

  return statements[0];
}

function parseHelperNode(helperSource) {
  const helperNode = parseSingleStatementNode(helperSource, "O helper extraido");

  if (helperNode.type !== "FunctionDeclaration" || !helperNode.id?.name) {
    throw new Error("O helper extraido precisa ser uma function declaration nomeada.");
  }

  return helperNode;
}

function getReplacementFunctionName(node) {
  if (node?.type === "FunctionDeclaration") {
    return node.id?.name || "";
  }

  if (
    node?.type === "VariableDeclaration" &&
    node.declarations.length === 1 &&
    node.declarations[0]?.id?.type === "Identifier"
  ) {
    return node.declarations[0].id.name;
  }

  return "";
}

function parseUpdatedFunctionNode(functionName, replacementSource) {
  const replacementNode = parseSingleStatementNode(
    replacementSource,
    `A funcao atualizada ${functionName}`
  );
  const replacementName = getReplacementFunctionName(replacementNode);

  if (!replacementName || replacementName !== functionName) {
    throw new Error(
      `A funcao atualizada precisa manter o nome original ${functionName}.`
    );
  }

  return replacementNode;
}

function parseExpressionNode(expressionSource) {
  const ast = parseSourceFile(`(${expressionSource});`);
  const expressionStatement = ast.program.body[0];

  if (expressionStatement?.type !== "ExpressionStatement") {
    throw new Error("Nao foi possivel parsear a chamada do helper extraido.");
  }

  return expressionStatement.expression;
}

function printStableSource(ast, sourceText = "") {
  return generate(
    ast,
    {
      comments: true,
      compact: false,
      concise: false
    },
    sourceText
  ).code;
}

function replaceCandidateExpression({
  ast,
  functionName,
  candidate,
  replacementExpression
}) {
  let replaced = false;

  traverse(ast, {
    FunctionDeclaration(functionPath) {
      if (functionPath.node.id?.name !== functionName || replaced) {
        return;
      }

      functionPath.traverse({
        Function(innerPath) {
          innerPath.skip();
        },
        enter(innerPath) {
          if (
            !replaced &&
            Number.isInteger(innerPath.node?.start) &&
            Number.isInteger(innerPath.node?.end) &&
            innerPath.node.start === candidate.start &&
            innerPath.node.end === candidate.end &&
            innerPath.isExpression()
          ) {
            innerPath.replaceWith(cloneAstNode(replacementExpression));
            replaced = true;
            innerPath.skip();
          }
        }
      });

      if (replaced) {
        functionPath.stop();
      }
    },
    VariableDeclarator(variablePath) {
      if (replaced) {
        return;
      }

      const { id, init } = variablePath.node;

      if (
        id?.type !== "Identifier" ||
        id.name !== functionName ||
        !init ||
        (init.type !== "ArrowFunctionExpression" &&
          init.type !== "FunctionExpression")
      ) {
        return;
      }

      variablePath.get("init").traverse({
        Function(innerPath) {
          innerPath.skip();
        },
        enter(innerPath) {
          if (
            !replaced &&
            Number.isInteger(innerPath.node?.start) &&
            Number.isInteger(innerPath.node?.end) &&
            innerPath.node.start === candidate.start &&
            innerPath.node.end === candidate.end &&
            innerPath.isExpression()
          ) {
            innerPath.replaceWith(cloneAstNode(replacementExpression));
            replaced = true;
            innerPath.skip();
          }
        }
      });

      if (replaced) {
        variablePath.stop();
      }
    }
  });

  if (!replaced) {
    throw new Error("Nao foi possivel localizar o candidato selecionado na funcao.");
  }
}

function buildHelperSource(candidate) {
  const params = candidate.inputsUsed.join(", ");

  return `function ${candidate.helperName}(${params}) {\n  return ${candidate.source};\n}`;
}

function buildUpdatedFunctionSource({
  sourceText,
  functionName,
  candidate,
  callSource
}) {
  const tempAst = parseSourceFile(sourceText);
  const replacementExpression = parseExpressionNode(callSource);

  replaceCandidateExpression({
    ast: tempAst,
    functionName,
    candidate,
    replacementExpression
  });

  const nextSource = printStableSource(tempAst, sourceText);
  const nextEntries = collectNamedFunctionEntries(parseSourceFile(nextSource), nextSource);
  const updatedFunctionEntry = nextEntries.get(functionName);

  if (!updatedFunctionEntry?.source) {
    throw new Error(`A funcao ${functionName} nao foi encontrada apos a substituicao.`);
  }

  return updatedFunctionEntry.source;
}

function buildUpdatedFunctionSourceWithTransform({
  sourceText,
  functionName,
  transform
}) {
  const tempAst = parseSourceFile(sourceText);
  const functionPath = findNamedFunctionPath(tempAst, functionName);

  if (!functionPath) {
    throw new Error(`Nao foi possivel localizar a AST da funcao ${functionName}.`);
  }

  transform(functionPath);

  const nextSource = printStableSource(tempAst, sourceText);
  const nextEntries = collectNamedFunctionEntries(parseSourceFile(nextSource), nextSource);
  const updatedFunctionEntry = nextEntries.get(functionName);

  if (!updatedFunctionEntry?.source) {
    throw new Error(`A funcao ${functionName} nao foi encontrada apos a transformacao.`);
  }

  return updatedFunctionEntry.source;
}

function getModeMeta(mode) {
  if (mode === "input-normalization") {
    return {
      label: "Input normalization (descriptor extraction)",
      summaryVerb: "introduced an intermediate representation"
    };
  }

  if (mode === "manual-review") {
    return {
      label: "Manual review",
      summaryVerb: "pede revisao manual"
    };
  }

  if (mode === "dependency-injection-surfacing") {
    return {
      label: "Dependency-injection surfacing",
      summaryVerb: "surfaced explicit dependencies"
    };
  }

  if (mode === "side-effect-isolation") {
    return {
      label: "Side-effect isolation",
      summaryVerb: "isolated side effects"
    };
  }

  return {
    label: "Pure extraction",
    summaryVerb: "extraiu bloco puro"
  };
}

function getFunctionSourceSpan(entry) {
  const start = Number(entry?.start);
  const end = Number(entry?.end);

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return 0;
  }

  return end - start;
}

function getHiddenInputShapeStats(functionAnalysis) {
  const rootCounts = new Map();

  getList(functionAnalysis?.hiddenInputs).forEach((inputLabel) => {
    const normalizedLabel = String(inputLabel || "")
      .replace(/\?\.\[/g, "[")
      .replace(/\?\./g, ".")
      .trim();
    const root = getTrackedLabelRoot(normalizedLabel);

    if (!root) {
      return;
    }

    const isPropertyAccess =
      normalizedLabel.startsWith(`${root}.`) || normalizedLabel.startsWith(`${root}[`);

    if (!isPropertyAccess) {
      return;
    }

    rootCounts.set(root, (rootCounts.get(root) || 0) + 1);
  });

  let dominantRoot = "";
  let dominantCount = 0;

  rootCounts.forEach((count, root) => {
    if (count > dominantCount) {
      dominantRoot = root;
      dominantCount = count;
    }
  });

  return {
    dominantRoot,
    dominantCount,
    distinctRootsCount: rootCounts.size
  };
}

function buildNoCandidateClassification(functionAnalysis, functionEntry, remainingMixedZones) {
  return buildNoCandidateClassificationShared(
    functionAnalysis,
    functionEntry,
    remainingMixedZones
  );
}

function buildPreviewPayload({
  sourceFilePath,
  functionName,
  functionEntry,
  mode,
  candidates,
  selectedCandidate,
  helperSource,
  updatedFunctionSource,
  summary,
  progress,
  beforeSource,
  afterSource,
  diff
}) {
  const resolvedBeforeSource =
    typeof beforeSource === "string" ? beforeSource : functionEntry.source;
  const resolvedAfterSource =
    typeof afterSource === "string"
      ? afterSource
      : typeof updatedFunctionSource === "string"
        ? updatedFunctionSource
        : functionEntry.source;
  const resolvedDiff =
    typeof diff === "string"
      ? diff
      : typeof updatedFunctionSource === "string"
        ? buildPreviewDiff(resolvedBeforeSource, resolvedAfterSource)
        : "";

  return {
    ok: true,
    sourceFilePath,
    functionName,
    preview: {
      mode,
      modeLabel: getModeMeta(mode).label,
      candidates: candidates.map((candidate) => ({
        id: candidate.id,
        name: candidate.name,
        risk: candidate.risk,
        startLine: candidate.startLine,
        endLine: candidate.endLine,
        inputsUsed: candidate.inputsUsed,
        reason: candidate.reason
      })),
      selectedCandidateId: selectedCandidate?.id || "",
      helperName: selectedCandidate?.helperName || "",
      helperSource,
      updatedFunctionSource,
      summary,
      message: "",
      dominantProblem: "",
      suggestedIntervention: "",
      progress,
      beforeSource: resolvedBeforeSource,
      afterSource: resolvedAfterSource,
      diff: resolvedDiff
    }
  };
}

function buildNoCandidatePreview({
  sourceFilePath,
  functionName,
  functionEntry,
  remainingMixedZones,
  functionAnalysis
}) {
  const classification = buildNoCandidateClassification(
    functionAnalysis,
    functionEntry,
    remainingMixedZones
  );

  return {
    ok: true,
    sourceFilePath,
    functionName,
    preview: {
      mode: classification.mode,
      modeLabel: getModeMeta(classification.mode).label,
      candidates: [],
      selectedCandidateId: "",
      helperName: "",
      helperSource: "",
      updatedFunctionSource: "",
      summary: classification.summary,
      message: classification.message,
      dominantProblem: classification.dominantProblem,
      suggestedIntervention: classification.suggestedIntervention,
      progress: {
        remainingMixedZones: classification.remainingMixedZones,
        safeNextExtraction: classification.safeNextStep,
        safeCandidateCount: 0
      },
      beforeSource: functionEntry.source,
      afterSource: functionEntry.source,
      diff: ""
    }
  };
}

function normalizeDescriptorDomainCoreName(functionName, rootParamName) {
  const rootCore = toPascalCase(singularize(rootParamName || "")) || "Input";
  let functionCore = normalizeFunctionCoreName(functionName).replace(
    /(Copy|Label|Labels|Text|String|Message|Summary|View|State|Data|Payload)$/i,
    ""
  );

  if (!functionCore) {
    functionCore = rootCore;
  }

  if (!functionCore.toLowerCase().includes(rootCore.toLowerCase())) {
    functionCore = `${rootCore}${functionCore}`;
  }

  return functionCore || rootCore;
}

function buildUniquePlainName(baseName, usedNames) {
  const normalizedBaseName = String(baseName || "").trim() || "value";
  let candidateName = normalizedBaseName;
  let suffix = 2;

  while (usedNames.has(candidateName)) {
    candidateName = `${normalizedBaseName}${suffix}`;
    suffix += 1;
  }

  usedNames.add(candidateName);
  return candidateName;
}

function normalizeDescriptorKindLabel(value, fallback = "default") {
  const normalized = String(value || fallback || "default")
    .replace(/Id$/i, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return normalized || fallback || "default";
}

function reserveDescriptorKindLabel(baseLabel, usedLabels) {
  const normalizedBaseLabel = normalizeDescriptorKindLabel(baseLabel, "branch");

  if (!usedLabels.has(normalizedBaseLabel)) {
    usedLabels.add(normalizedBaseLabel);
    return normalizedBaseLabel;
  }

  let suffix = 2;
  let candidateLabel = `${normalizedBaseLabel}-${suffix}`;

  while (usedLabels.has(candidateLabel)) {
    suffix += 1;
    candidateLabel = `${normalizedBaseLabel}-${suffix}`;
  }

  usedLabels.add(candidateLabel);
  return candidateLabel;
}

function buildNodeTraverseAst(node) {
  const clonedNode = cloneAstNode(node);
  const statementLikeNode =
    clonedNode?.type === "ExpressionStatement" ||
    clonedNode?.type === "VariableDeclaration" ||
    clonedNode?.type === "FunctionDeclaration" ||
    /Statement$/.test(String(clonedNode?.type || ""));

  return {
    type: "File",
    program: {
      type: "Program",
      sourceType: "module",
      directives: [],
      body: [
        statementLikeNode
          ? clonedNode
          : {
              type: "ExpressionStatement",
              expression: clonedNode
            }
      ]
    }
  };
}

function isIdentifierInMemberObjectPosition(identifierPath) {
  const parentPath = identifierPath.parentPath;

  return (
    (parentPath?.isMemberExpression() || parentPath?.isOptionalMemberExpression()) &&
    identifierPath.key === "object"
  );
}

function collectRootParamUsageAnalysis(node, rootParamName) {
  const usageMap = new Map();
  let hasDirectRootIdentifier = false;
  let hasUnsupportedRootUsage = false;
  const wrapperAst = buildNodeTraverseAst(node);

  function registerMemberUsage(memberPath) {
    const parentPath = memberPath.parentPath;

    if (
      (parentPath?.isMemberExpression() || parentPath?.isOptionalMemberExpression()) &&
      memberPath.key === "object"
    ) {
      return;
    }

    const pathParts = extractMemberPathParts(memberPath.node);

    if (!pathParts) {
      const rootInfo = getRootReferenceInfo(memberPath.node);

      if (rootInfo?.name === rootParamName) {
        hasUnsupportedRootUsage = true;
      }

      return;
    }

    if (pathParts[0] !== rootParamName) {
      return;
    }

    const pathKey = pathParts.join(".");

    if (!usageMap.has(pathKey)) {
      usageMap.set(pathKey, {
        key: pathKey,
        pathParts,
        topLevelProperty: pathParts[1] || "",
        source: generate(memberPath.node, { comments: false }).code
      });
    }
  }

  traverse(wrapperAst, {
    Function(innerPath) {
      innerPath.skip();
    },
    MemberExpression(memberPath) {
      registerMemberUsage(memberPath);
    },
    OptionalMemberExpression(memberPath) {
      registerMemberUsage(memberPath);
    },
    ReferencedIdentifier(identifierPath) {
      if (identifierPath.node.name !== rootParamName) {
        return;
      }

      if (isIdentifierInMemberObjectPosition(identifierPath)) {
        return;
      }

      hasDirectRootIdentifier = true;
    }
  });

  return {
    memberUsages: Array.from(usageMap.values()),
    hasDirectRootIdentifier,
    hasUnsupportedRootUsage
  };
}

function analyzeShapeTestExpression(testSource, rootParamName) {
  const expressionAst = parseSourceFile(`(${testSource});`);
  const blockedReasons = new Set();
  const usageSet = new Map();

  function registerTestUsage(memberPath) {
    const parentPath = memberPath.parentPath;

    if (
      (parentPath?.isMemberExpression() || parentPath?.isOptionalMemberExpression()) &&
      memberPath.key === "object"
    ) {
      return;
    }

    const pathParts = extractMemberPathParts(memberPath.node);

    if (!pathParts) {
      const rootInfo = getRootReferenceInfo(memberPath.node);

      if (rootInfo?.name === rootParamName) {
        blockedReasons.add("computed-shape-access");
      } else if (rootInfo?.name && !SAFE_GLOBAL_ROOTS.has(rootInfo.name)) {
        blockedReasons.add(`external-root:${rootInfo.name}`);
      }

      return;
    }

    const rootName = pathParts[0];

    if (rootName !== rootParamName) {
      if (!SAFE_GLOBAL_ROOTS.has(rootName)) {
        blockedReasons.add(`external-root:${rootName}`);
      }
      return;
    }

    const pathKey = pathParts.join(".");

    if (!usageSet.has(pathKey)) {
      usageSet.set(pathKey, {
        key: pathKey,
        pathParts,
        topLevelProperty: pathParts[1] || "",
        source: generate(memberPath.node, { comments: false }).code
      });
    }
  }

  traverse(expressionAst, {
    Function(innerPath) {
      blockedReasons.add("nested-function");
      innerPath.skip();
    },
    ThisExpression() {
      blockedReasons.add("this");
    },
    AwaitExpression() {
      blockedReasons.add("await");
    },
    YieldExpression() {
      blockedReasons.add("yield");
    },
    AssignmentExpression() {
      blockedReasons.add("assignment");
    },
    UpdateExpression() {
      blockedReasons.add("update");
    },
    NewExpression() {
      blockedReasons.add("new");
    },
    TaggedTemplateExpression() {
      blockedReasons.add("tagged-template");
    },
    JSXElement() {
      blockedReasons.add("jsx");
    },
    JSXFragment() {
      blockedReasons.add("jsx");
    },
    CallExpression() {
      blockedReasons.add("call");
    },
    OptionalCallExpression() {
      blockedReasons.add("call");
    },
    MemberExpression(memberPath) {
      registerTestUsage(memberPath);
    },
    OptionalMemberExpression(memberPath) {
      registerTestUsage(memberPath);
    },
    ReferencedIdentifier(identifierPath) {
      const identifierName = identifierPath.node.name;

      if (identifierName === rootParamName) {
        return;
      }

      if (SAFE_GLOBAL_ROOTS.has(identifierName) || identifierName === "undefined") {
        return;
      }

      blockedReasons.add(`identifier:${identifierName}`);
    }
  });

  const memberUsages = Array.from(usageSet.values());
  const topLevelProperties = uniqueArray(
    memberUsages.map((usage) => usage.topLevelProperty).filter(Boolean)
  );

  return {
    isValid: blockedReasons.size === 0 && topLevelProperties.length > 0,
    blockedReasons: Array.from(blockedReasons),
    memberUsages,
    topLevelProperties,
    primaryProperty: topLevelProperties[0] || ""
  };
}

function buildDescriptorPayloadAccessNode(descriptorParamName, alias = "") {
  const payloadNode = createIdentifierMemberAccess(descriptorParamName, "payload");

  if (!alias) {
    return payloadNode;
  }

  return {
    type: "MemberExpression",
    object: payloadNode,
    property: {
      type: "Identifier",
      name: alias
    },
    computed: false,
    optional: false
  };
}

function rewriteExpressionForDescriptor({
  expressionSource,
  rootParamName,
  descriptorParamName,
  replacements
}) {
  const replacementMap = new Map(
    getList(replacements).map((replacement) => [
      String(replacement?.pathKey || "").trim(),
      replacement
    ])
  );
  const expressionAst = parseSourceFile(`(${expressionSource});`);
  let hasUnsupportedReference = false;

  function replaceRootMember(memberPath) {
    const parentPath = memberPath.parentPath;

    if (
      (parentPath?.isMemberExpression() || parentPath?.isOptionalMemberExpression()) &&
      memberPath.key === "object"
    ) {
      return;
    }

    const pathParts = extractMemberPathParts(memberPath.node);

    if (!pathParts) {
      const rootInfo = getRootReferenceInfo(memberPath.node);

      if (rootInfo?.name === rootParamName) {
        hasUnsupportedReference = true;
        memberPath.stop();
      }

      return;
    }

    if (pathParts[0] !== rootParamName) {
      return;
    }

    const replacement = replacementMap.get(pathParts.join("."));

    if (!replacement) {
      hasUnsupportedReference = true;
      memberPath.stop();
      return;
    }

    memberPath.replaceWith(
      cloneAstNode(
        buildDescriptorPayloadAccessNode(descriptorParamName, replacement.alias || "")
      )
    );
    memberPath.skip();
  }

  traverse(expressionAst, {
    Function(innerPath) {
      innerPath.skip();
    },
    MemberExpression(memberPath) {
      replaceRootMember(memberPath);
    },
    OptionalMemberExpression(memberPath) {
      replaceRootMember(memberPath);
    },
    ReferencedIdentifier(identifierPath) {
      if (identifierPath.node.name !== rootParamName) {
        return;
      }

      if (isIdentifierInMemberObjectPosition(identifierPath)) {
        return;
      }

      hasUnsupportedReference = true;
      identifierPath.stop();
    }
  });

  if (hasUnsupportedReference) {
    return "";
  }

  const expressionStatement = expressionAst.program.body[0];

  if (expressionStatement?.type !== "ExpressionStatement") {
    return "";
  }

  return generate(expressionStatement.expression, { comments: false }).code;
}

function buildDescriptorPayloadPlan({
  expressionSource,
  rootParamName,
  descriptorParamName
}) {
  const usageAnalysis = collectRootParamUsageAnalysis(
    parseExpressionNode(expressionSource),
    rootParamName
  );

  if (usageAnalysis.hasDirectRootIdentifier || usageAnalysis.hasUnsupportedRootUsage) {
    return null;
  }

  const memberUsages = usageAnalysis.memberUsages;

  if (!memberUsages.length) {
    return {
      memberUsages,
      primaryProperty: "",
      payloadMode: "none",
      payloadSource: "null",
      rewrittenReturnSource: expressionSource
    };
  }

  if (memberUsages.length === 1) {
    const [singleUsage] = memberUsages;
    const rewrittenReturnSource = rewriteExpressionForDescriptor({
      expressionSource,
      rootParamName,
      descriptorParamName,
      replacements: [
        {
          pathKey: singleUsage.key,
          alias: ""
        }
      ]
    });

    if (!rewrittenReturnSource) {
      return null;
    }

    return {
      memberUsages,
      primaryProperty: singleUsage.topLevelProperty || "",
      payloadMode: "scalar",
      payloadSource: singleUsage.source,
      rewrittenReturnSource
    };
  }

  const usedAliases = new Set();
  const replacements = memberUsages.map((usage) => ({
    ...usage,
    alias: buildUniquePlainName(
      toCamelCase(usage.pathParts.slice(1).join("-")) || "value",
      usedAliases
    )
  }));
  const rewrittenReturnSource = rewriteExpressionForDescriptor({
    expressionSource,
    rootParamName,
    descriptorParamName,
    replacements
  });

  if (!rewrittenReturnSource) {
    return null;
  }

  return {
    memberUsages,
    primaryProperty: replacements[0]?.topLevelProperty || "",
    payloadMode: "object",
    payloadSource: `{ ${replacements
      .map((replacement) => `${replacement.alias}: ${replacement.source}`)
      .join(", ")} }`,
    rewrittenReturnSource
  };
}

function getReturnArgumentNodeFromConsequentPath(consequentPath) {
  if (!consequentPath) {
    return null;
  }

  if (consequentPath.isReturnStatement()) {
    return consequentPath.node.argument || null;
  }

  if (!consequentPath.isBlockStatement()) {
    return null;
  }

  const bodyStatements = consequentPath.get("body");

  if (bodyStatements.length !== 1 || !bodyStatements[0].isReturnStatement()) {
    return null;
  }

  return bodyStatements[0].node.argument || null;
}

function getFunctionParameterIdentifiers(functionPath) {
  return getList(functionPath?.node?.params)
    .map((paramNode, index) =>
      paramNode?.type === "Identifier"
        ? {
            name: paramNode.name,
            index
          }
        : null
    )
    .filter(Boolean);
}

function statementUsesRootParam(statementPath, rootParamName) {
  let usesRootParam = false;

  statementPath.traverse({
    Function(innerPath) {
      innerPath.skip();
    },
    MemberExpression(memberPath) {
      if (
        (memberPath.parentPath?.isMemberExpression() ||
          memberPath.parentPath?.isOptionalMemberExpression()) &&
        memberPath.key === "object"
      ) {
        return;
      }

      const pathParts = extractMemberPathParts(memberPath.node);

      if (pathParts?.[0] === rootParamName) {
        usesRootParam = true;
        memberPath.stop();
      }
    },
    OptionalMemberExpression(memberPath) {
      if (
        (memberPath.parentPath?.isMemberExpression() ||
          memberPath.parentPath?.isOptionalMemberExpression()) &&
        memberPath.key === "object"
      ) {
        return;
      }

      const pathParts = extractMemberPathParts(memberPath.node);

      if (pathParts?.[0] === rootParamName) {
        usesRootParam = true;
        memberPath.stop();
      }
    },
    ReferencedIdentifier(identifierPath) {
      if (identifierPath.node.name !== rootParamName) {
        return;
      }

      if (isIdentifierInMemberObjectPosition(identifierPath)) {
        return;
      }

      usesRootParam = true;
      identifierPath.stop();
    }
  });

  return usesRootParam;
}

function functionHasRecursiveSelfCall(functionPath, functionName) {
  let hasRecursiveCall = false;

  functionPath.traverse({
    Function(innerPath) {
      if (innerPath !== functionPath) {
        innerPath.skip();
      }
    },
    CallExpression(callPath) {
      if (callPath.get("callee").isIdentifier({ name: functionName })) {
        hasRecursiveCall = true;
        callPath.stop();
      }
    },
    OptionalCallExpression(callPath) {
      if (callPath.get("callee").isIdentifier({ name: functionName })) {
        hasRecursiveCall = true;
        callPath.stop();
      }
    }
  });

  return hasRecursiveCall;
}

function isFunctionPathExported(functionPath) {
  let currentPath = functionPath.parentPath;

  while (currentPath) {
    if (currentPath.isExportNamedDeclaration?.() || currentPath.isExportDefaultDeclaration?.()) {
      return true;
    }

    if (currentPath.isProgram?.() || currentPath.isFunction?.()) {
      return false;
    }

    currentPath = currentPath.parentPath;
  }

  return false;
}

function buildShapeGuardBranch({
  ifPath,
  code,
  rootParamName,
  descriptorParamName,
  usedKinds
}) {
  if (ifPath.node.alternate) {
    return null;
  }

  const returnArgumentNode = getReturnArgumentNodeFromConsequentPath(ifPath.get("consequent"));

  if (!returnArgumentNode) {
    return null;
  }

  const testSource = getNodeSource(code, ifPath.node.test, "");
  const testAnalysis = analyzeShapeTestExpression(testSource, rootParamName);

  if (!testAnalysis.isValid) {
    return null;
  }

  const returnSource = getNodeSource(code, returnArgumentNode, "");

  if (!returnSource) {
    return null;
  }

  const payloadPlan = buildDescriptorPayloadPlan({
    expressionSource: returnSource,
    rootParamName,
    descriptorParamName
  });

  if (!payloadPlan) {
    return null;
  }

  const kind = reserveDescriptorKindLabel(
    testAnalysis.primaryProperty || payloadPlan.primaryProperty || "branch",
    usedKinds
  );

  return {
    isDefault: false,
    kind,
    testSource,
    topLevelProperties: testAnalysis.topLevelProperties,
    payloadSource: payloadPlan.payloadSource,
    rewrittenReturnSource: payloadPlan.rewrittenReturnSource,
    memberUsages: payloadPlan.memberUsages
  };
}

function buildShapeFinalBranches({
  returnPath,
  code,
  rootParamName,
  descriptorParamName,
  usedKinds
}) {
  const returnArgumentNode = returnPath.node.argument;

  if (!returnArgumentNode) {
    return null;
  }

  if (returnArgumentNode.type === "ConditionalExpression") {
    const testSource = getNodeSource(code, returnArgumentNode.test, "");
    const testAnalysis = analyzeShapeTestExpression(testSource, rootParamName);

    if (!testAnalysis.isValid) {
      return null;
    }

    const consequentSource = getNodeSource(code, returnArgumentNode.consequent, "");
    const alternateSource = getNodeSource(code, returnArgumentNode.alternate, "");

    if (!consequentSource || !alternateSource) {
      return null;
    }

    const consequentPayloadPlan = buildDescriptorPayloadPlan({
      expressionSource: consequentSource,
      rootParamName,
      descriptorParamName
    });
    const alternatePayloadPlan = buildDescriptorPayloadPlan({
      expressionSource: alternateSource,
      rootParamName,
      descriptorParamName
    });

    if (!consequentPayloadPlan || !alternatePayloadPlan) {
      return null;
    }

    return [
      {
        isDefault: false,
        kind: reserveDescriptorKindLabel(
          testAnalysis.primaryProperty || consequentPayloadPlan.primaryProperty || "branch",
          usedKinds
        ),
        testSource,
        topLevelProperties: testAnalysis.topLevelProperties,
        payloadSource: consequentPayloadPlan.payloadSource,
        rewrittenReturnSource: consequentPayloadPlan.rewrittenReturnSource,
        memberUsages: consequentPayloadPlan.memberUsages
      },
      {
        isDefault: true,
        kind: reserveDescriptorKindLabel("default", usedKinds),
        testSource: "",
        topLevelProperties: [],
        payloadSource: alternatePayloadPlan.payloadSource,
        rewrittenReturnSource: alternatePayloadPlan.rewrittenReturnSource,
        memberUsages: alternatePayloadPlan.memberUsages
      }
    ];
  }

  const returnSource = getNodeSource(code, returnArgumentNode, "");

  if (!returnSource) {
    return null;
  }

  const payloadPlan = buildDescriptorPayloadPlan({
    expressionSource: returnSource,
    rootParamName,
    descriptorParamName
  });

  if (!payloadPlan) {
    return null;
  }

  return [
    {
      isDefault: true,
      kind: reserveDescriptorKindLabel("default", usedKinds),
      testSource: "",
      topLevelProperties: [],
      payloadSource: payloadPlan.payloadSource,
      rewrittenReturnSource: payloadPlan.rewrittenReturnSource,
      memberUsages: payloadPlan.memberUsages
    }
  ];
}

function buildShapeSurfacingHelperSource(proposal) {
  const nonDefaultBranches = proposal.branches.filter((branch) => !branch.isDefault);
  const defaultBranch = proposal.branches.find((branch) => branch.isDefault);
  const lines = [`function ${proposal.helperName}(${proposal.rootParamName}) {`];

  nonDefaultBranches.forEach((branch, index) => {
    lines.push(`  if (${branch.testSource}) {`);
    lines.push(
      `    return { kind: "${branch.kind}", payload: ${branch.payloadSource} };`
    );
    lines.push("  }");

    if (index < nonDefaultBranches.length - 1 || defaultBranch) {
      lines.push("");
    }
  });

  lines.push(
    `  return { kind: "${defaultBranch?.kind || "default"}", payload: ${
      defaultBranch?.payloadSource || "null"
    } };`
  );
  lines.push("}");

  return lines.join("\n");
}

function buildShapeSurfacingSwitchStatementSource(proposal) {
  const nonDefaultBranches = proposal.branches.filter((branch) => !branch.isDefault);
  const defaultBranch = proposal.branches.find((branch) => branch.isDefault);
  const lines = [`switch (${proposal.descriptorParamName}.kind) {`];

  nonDefaultBranches.forEach((branch) => {
    lines.push(`  case "${branch.kind}":`);
    lines.push(`    return ${branch.rewrittenReturnSource};`);
    lines.push("");
  });

  lines.push("  default:");
  lines.push(`    return ${defaultBranch?.rewrittenReturnSource || "null"};`);
  lines.push("}");

  return lines.join("\n");
}

function buildShapeSurfacingUpdatedFunctionSource({
  sourceText,
  functionName,
  proposal
}) {
  const switchStatementNode = parseFunctionBodyStatementNode(
    buildShapeSurfacingSwitchStatementSource(proposal),
    `O switch da intermediate representation para ${functionName}`
  );

  return buildUpdatedFunctionSourceWithTransform({
    sourceText,
    functionName,
    transform(functionPath) {
      const nextParams = getList(functionPath.node.params).map((paramNode) =>
        cloneAstNode(paramNode)
      );
      const rootParamNode = nextParams[proposal.rootParamIndex];

      if (!rootParamNode || rootParamNode.type !== "Identifier") {
        throw new Error(`A funcao ${functionName} precisa receber um parametro simples.`);
      }

      rootParamNode.name = proposal.descriptorParamName;
      functionPath.node.params = nextParams;

      const bodyPath = functionPath.get("body");

      if (!bodyPath?.isBlockStatement()) {
        throw new Error(`A funcao ${functionName} precisa ter corpo em bloco.`);
      }

      const preservedStatements = getList(bodyPath.node.body)
        .slice(0, proposal.prefixCount)
        .map((statementNode) => cloneAstNode(statementNode));

      bodyPath.node.body = [...preservedStatements, cloneAstNode(switchStatementNode)];
    }
  });
}

function findNamedFunctionBindingPath(ast, functionName) {
  let bindingPath = null;

  traverse(ast, {
    FunctionDeclaration(functionPath) {
      if (bindingPath || functionPath.node.id?.name !== functionName) {
        return;
      }

      bindingPath = functionPath;
      functionPath.stop();
    },
    VariableDeclarator(variablePath) {
      if (bindingPath) {
        return;
      }

      const { id, init } = variablePath.node;

      if (
        id?.type !== "Identifier" ||
        id.name !== functionName ||
        !init ||
        (init.type !== "ArrowFunctionExpression" &&
          init.type !== "FunctionExpression")
      ) {
        return;
      }

      bindingPath = variablePath;
      variablePath.stop();
    }
  });

  return bindingPath;
}

function rewriteShapeSurfacingCallSites({
  ast,
  functionName,
  helperName,
  rootParamIndex,
  targetBindingPath
}) {
  if (!targetBindingPath) {
    throw new Error(`Nao foi possivel localizar o binding de ${functionName}.`);
  }

  const targetBindingNode = targetBindingPath.node;
  let rewrittenCallSites = 0;
  let unsafeCallSiteFound = false;

  function rewriteCall(callPath) {
    const calleePath = callPath.get("callee");

    if (!calleePath.isIdentifier({ name: functionName })) {
      return;
    }

    const binding = callPath.scope.getBinding(functionName);

    if (!binding || binding.path.node !== targetBindingNode) {
      return;
    }

    const argumentPaths = callPath.get("arguments");
    const targetArgumentPath = argumentPaths[rootParamIndex];

    if (!targetArgumentPath || targetArgumentPath.isSpreadElement()) {
      unsafeCallSiteFound = true;
      callPath.stop();
      return;
    }

    const targetArgumentNode = targetArgumentPath.node;

    if (
      (targetArgumentNode?.type === "CallExpression" ||
        targetArgumentNode?.type === "OptionalCallExpression") &&
      targetArgumentNode.callee?.type === "Identifier" &&
      targetArgumentNode.callee.name === helperName
    ) {
      return;
    }

    const argumentSource =
      getNodeSource("", targetArgumentNode, "") ||
      generate(targetArgumentNode, { comments: false }).code;

    if (!argumentSource) {
      unsafeCallSiteFound = true;
      callPath.stop();
      return;
    }

    targetArgumentPath.replaceWith(parseExpressionNode(`${helperName}(${argumentSource})`));
    rewrittenCallSites += 1;
  }

  traverse(ast, {
    CallExpression(callPath) {
      rewriteCall(callPath);
    },
    OptionalCallExpression(callPath) {
      rewriteCall(callPath);
    }
  });

  if (unsafeCallSiteFound) {
    throw new Error(
      `Nao foi possivel atualizar todas as chamadas de ${functionName} de forma segura.`
    );
  }

  return rewrittenCallSites;
}

function collectShapeSurfacingCandidate({
  functionPath,
  functionName,
  functionEntry,
  functionAnalysis,
  helperExistingNames,
  bindingExistingNames,
  code,
  remainingMixedZones
}) {
  const classification = buildNoCandidateClassification(
    functionAnalysis,
    functionEntry,
    remainingMixedZones
  );
  const roleLabel = String(functionAnalysis?.role || functionEntry?.role || "").trim();
  const normalizedFunctionName = String(functionName || "").trim();
  const normalizedRole = roleLabel.toLowerCase();
  const isBuilderOrFormatterLike =
    normalizedRole === "builder" ||
    normalizedRole === "formatter" ||
    /^(build|create|serialize|format)/i.test(normalizedFunctionName);
  const runtimeSignals = getList(functionAnalysis?.runtimeDirect?.signals);
  const externalWritesCount = getCount(functionAnalysis?.externalWrites);
  const externalCouplingLevel = String(functionAnalysis?.externalCoupling?.level || "none");
  const hiddenInputShape = getHiddenInputShapeStats(functionAnalysis);
  const paramIdentifiers = getFunctionParameterIdentifiers(functionPath);
  const rootParam = paramIdentifiers.find(
    (paramIdentifier) => paramIdentifier.name === hiddenInputShape.dominantRoot
  );

  if (classification.mode !== "input-normalization") {
    return null;
  }

  if (!isBuilderOrFormatterLike) {
    return null;
  }

  if (runtimeSignals.length > 0 || externalWritesCount > 0) {
    return null;
  }

  if (externalCouplingLevel !== "none" && externalCouplingLevel !== "low") {
    return null;
  }

  if (!rootParam || hiddenInputShape.dominantCount < 2) {
    return null;
  }

  if (
    /descriptor/i.test(rootParam.name) ||
    /descriptor/i.test(functionName) ||
    functionHasRecursiveSelfCall(functionPath, functionName) ||
    isFunctionPathExported(functionPath)
  ) {
    return null;
  }

  const descriptorCoreName = normalizeDescriptorDomainCoreName(functionName, rootParam.name);
  const helperName = buildUniqueHelperName(
    `get${descriptorCoreName}Descriptor`,
    helperExistingNames
  );
  const descriptorParamName = buildUniqueBindingName(
    `${toCamelCase(descriptorCoreName)}Descriptor`,
    bindingExistingNames
  );
  const bodyPath = functionPath.get("body");

  if (!bodyPath?.isBlockStatement()) {
    return null;
  }

  const bodyStatements = bodyPath.get("body");
  const branches = [];
  const usedKinds = new Set();
  let prefixCount = 0;
  let finalReturnSeen = false;

  for (let statementIndex = 0; statementIndex < bodyStatements.length; statementIndex += 1) {
    const statementPath = bodyStatements[statementIndex];

    if (statementPath.isIfStatement()) {
      const branch = buildShapeGuardBranch({
        ifPath: statementPath,
        code,
        rootParamName: rootParam.name,
        descriptorParamName,
        usedKinds
      });

      if (branch) {
        branches.push(branch);
        continue;
      }

      if (branches.length === 0 && !statementUsesRootParam(statementPath, rootParam.name)) {
        prefixCount += 1;
        continue;
      }

      return null;
    }

    if (statementPath.isReturnStatement()) {
      if (statementIndex !== bodyStatements.length - 1) {
        return null;
      }

      const finalBranches = buildShapeFinalBranches({
        returnPath: statementPath,
        code,
        rootParamName: rootParam.name,
        descriptorParamName,
        usedKinds
      });

      if (!finalBranches?.length) {
        return null;
      }

      branches.push(...finalBranches);
      finalReturnSeen = true;
      break;
    }

    if (branches.length === 0 && !statementUsesRootParam(statementPath, rootParam.name)) {
      prefixCount += 1;
      continue;
    }

    return null;
  }

  if (!finalReturnSeen || branches.length < 2 || !branches.some((branch) => branch.isDefault)) {
    return null;
  }

  const distinctShapeProperties = uniqueArray(
    branches
      .filter((branch) => !branch.isDefault)
      .flatMap((branch) => branch.topLevelProperties)
      .filter(Boolean)
  );

  if (distinctShapeProperties.length < 2) {
    return null;
  }

  const helperSource = buildShapeSurfacingHelperSource({
    helperName,
    rootParamName: rootParam.name,
    branches
  });
  const updatedFunctionSource = buildShapeSurfacingUpdatedFunctionSource({
    sourceText: code,
    functionName,
    proposal: {
      helperName,
      descriptorParamName,
      rootParamIndex: rootParam.index,
      prefixCount,
      branches
    }
  });

  return {
    id: `input-normalization:${functionName}`,
    name: helperName,
    helperName,
    helperSource,
    updatedFunctionSource,
    rootParamName: rootParam.name,
    rootParamIndex: rootParam.index,
    descriptorParamName,
    prefixCount,
    branches,
    shapeProperties: distinctShapeProperties,
    risk: distinctShapeProperties.length >= 3 ? "medium" : "low",
    startLine: functionPath.node.loc?.start?.line || functionEntry?.startLine || null,
    endLine: functionPath.node.loc?.end?.line || functionEntry?.endLine || null,
    inputsUsed: distinctShapeProperties.map((propertyLabel) => `${rootParam.name}.${propertyLabel}`),
    reason:
      `introduz intermediate representation para ${rootParam.name} e remove leituras inline de ${distinctShapeProperties.join(
        ", "
      )}`
  };
}

function collectDependencySurfacingCandidate(
  functionPath,
  code,
  functionName,
  helperExistingNames,
  bindingExistingNames
) {
  const bodyPath = functionPath.get("body");

  if (!bodyPath?.isBlockStatement()) {
    return null;
  }

  const bodyStatements = bodyPath.get("body");
  const insertionIndex = Math.min(
    getLeadingGuardStatementCount(functionPath),
    bodyStatements.length
  );
  const targetStatements = bodyStatements.slice(insertionIndex);

  if (!targetStatements.length) {
    return null;
  }

  const rootInputs = new Map();
  const runtimeAliases = new Map();
  let rewriteCount = 0;

  function registerRootInput(identifierName) {
    const normalizedName = String(identifierName || "").trim();

    if (!normalizedName || SAFE_GLOBAL_ROOTS.has(normalizedName)) {
      return;
    }

    if (!rootInputs.has(normalizedName)) {
      rootInputs.set(normalizedName, normalizedName);
    }
  }

  function registerRuntimeAlias(aliasName, sourceExpression, objectParts) {
    if (!runtimeAliases.has(aliasName)) {
      runtimeAliases.set(aliasName, {
        aliasName,
        sourceExpression,
        objectParts
      });
    }
  }

  targetStatements.forEach((statementPath) => {
    statementPath.traverse({
      Function(innerPath) {
        innerPath.skip();
      },
      MemberExpression(memberPath) {
        if (isInsideCallCallee(memberPath) || isWriteTargetPath(memberPath)) {
          return;
        }

        if (memberPath.parentPath?.isMemberExpression() && memberPath.key === "object") {
          return;
        }

        if (memberPath.parentPath?.isOptionalMemberExpression() && memberPath.key === "object") {
          return;
        }

        if (memberPath.node.start != null && memberPath.node.start < statementPath.node.start) {
          return;
        }

        if (memberPathStartsWith(memberPath.node, ["window", "location"])) {
          registerRuntimeAlias("location", "window.location", ["window", "location"]);
          rewriteCount += 1;
          return;
        }

        const rootReference = getRootReferenceInfo(memberPath.node);

        if (!rootReference || rootReference.kind !== "identifier") {
          return;
        }

        const identifierName = rootReference.name;
        const binding = memberPath.scope.getBinding(identifierName);

        if (binding && isBindingLocalToFunction(binding, functionPath)) {
          return;
        }

        if (BLOCKED_RUNTIME_ROOTS.has(identifierName)) {
          return;
        }

        registerRootInput(identifierName);
        rewriteCount += 1;
      },
      OptionalMemberExpression(memberPath) {
        if (isInsideCallCallee(memberPath) || isWriteTargetPath(memberPath)) {
          return;
        }

        if (memberPath.parentPath?.isMemberExpression() && memberPath.key === "object") {
          return;
        }

        if (memberPath.parentPath?.isOptionalMemberExpression() && memberPath.key === "object") {
          return;
        }

        if (memberPathStartsWith(memberPath.node, ["window", "location"])) {
          registerRuntimeAlias("location", "window.location", ["window", "location"]);
          rewriteCount += 1;
          return;
        }

        const rootReference = getRootReferenceInfo(memberPath.node);

        if (!rootReference || rootReference.kind !== "identifier") {
          return;
        }

        const identifierName = rootReference.name;
        const binding = memberPath.scope.getBinding(identifierName);

        if (binding && isBindingLocalToFunction(binding, functionPath)) {
          return;
        }

        if (BLOCKED_RUNTIME_ROOTS.has(identifierName)) {
          return;
        }

        registerRootInput(identifierName);
        rewriteCount += 1;
      },
      ReferencedIdentifier(referencePath) {
        if (referencePath.getFunctionParent() !== functionPath) {
          return;
        }

        if (isInsideCallCallee(referencePath)) {
          return;
        }

        const identifierName = referencePath.node.name;
        const binding = referencePath.scope.getBinding(identifierName);

        if (binding && isBindingLocalToFunction(binding, functionPath)) {
          return;
        }

        if (
          SAFE_GLOBAL_ROOTS.has(identifierName) ||
          BLOCKED_RUNTIME_ROOTS.has(identifierName)
        ) {
          return;
        }

        registerRootInput(identifierName);
        rewriteCount += 1;
      }
    });
  });

  const contextEntries = [
    ...Array.from(rootInputs.keys()).map((key) => ({
      key,
      sourceExpression: key
    })),
    ...Array.from(runtimeAliases.values()).map((entry) => ({
      key: entry.aliasName,
      sourceExpression: entry.sourceExpression,
      objectParts: entry.objectParts
    }))
  ];

  if (contextEntries.length < 3 || rewriteCount < 3) {
    return null;
  }

  const functionCore = normalizeFunctionCoreName(functionName);
  const helperName = buildUniqueHelperName(
    `build${toPascalCase(functionCore)}Context`,
    helperExistingNames
  );
  bindingExistingNames.add(helperName);
  const contextName = buildUniqueBindingName(
    `${toCamelCase(functionCore)}Context`,
    bindingExistingNames
  );
  const helperParams = contextEntries.map((entry) => entry.key);
  const helperArgs = contextEntries.map((entry) => entry.sourceExpression);
  const helperSource = [
    `function ${helperName}(${helperParams.join(", ")}) {`,
    "  return {",
    ...contextEntries.map((entry) => `    ${entry.key},`),
    "  };",
    "}"
  ].join("\n");
  const declarationSource = `const ${contextName} = ${helperName}(${helperArgs.join(", ")});`;
  const startLine = targetStatements[0]?.node.loc?.start?.line || null;
  const endLine = targetStatements[targetStatements.length - 1]?.node.loc?.end?.line || null;

  return {
    id: `dependency-${functionName}`,
    name: helperName,
    helperName,
    helperSource,
    contextName,
    insertionIndex,
    rootInputs: Array.from(rootInputs.keys()),
    runtimeAliases: Array.from(runtimeAliases.values()),
    inputsUsed: helperArgs,
    startLine,
    endLine,
    lineSpan:
      startLine && endLine ? Math.max(1, endLine - startLine + 1) : targetStatements.length,
    risk: "low",
    reason: `explicita ${contextEntries.length} dependencia(s) e prepara a proxima rodada de extracao`,
    declarationSource
  };
}

function buildDependencySurfacingUpdatedFunctionSource({
  sourceText,
  functionName,
  candidate
}) {
  return buildUpdatedFunctionSourceWithTransform({
    sourceText,
    functionName,
    transform(functionPath) {
      const bodyPath = functionPath.get("body");

      if (!bodyPath?.isBlockStatement()) {
        return;
      }

      const bodyStatements = bodyPath.get("body");
      const declarationNode = parseSingleStatementNode(
        candidate.declarationSource,
        "A declaracao de contexto"
      );
      const targetStatements = bodyStatements.slice(candidate.insertionIndex);

      if (targetStatements[0]) {
        targetStatements[0].insertBefore(cloneAstNode(declarationNode));
      } else {
        bodyPath.pushContainer("body", cloneAstNode(declarationNode));
      }

      targetStatements.forEach((statementPath) => {
        statementPath.traverse({
          Function(innerPath) {
            innerPath.skip();
          },
          MemberExpression(memberPath) {
            if (isInsideCallCallee(memberPath) || isWriteTargetPath(memberPath)) {
              return;
            }

            if (memberPath.parentPath?.isMemberExpression() && memberPath.key === "object") {
              return;
            }

            if (
              memberPath.parentPath?.isOptionalMemberExpression() &&
              memberPath.key === "object"
            ) {
              return;
            }

            const runtimeAlias = candidate.runtimeAliases.find((entry) =>
              memberPathStartsWith(memberPath.node, entry.objectParts)
            );

            if (runtimeAlias) {
              const nextParts = extractMemberPathParts(memberPath.node) || [];
              const suffixParts = nextParts.slice(runtimeAlias.objectParts.length);
              const replacementObject = createIdentifierMemberAccess(
                candidate.contextName,
                runtimeAlias.aliasName
              );
              let replacementNode = replacementObject;

              suffixParts.forEach((part) => {
                replacementNode = {
                  type: "MemberExpression",
                  object: replacementNode,
                  property: {
                    type: "Identifier",
                    name: part
                  },
                  computed: false,
                  optional: false
                };
              });

              memberPath.replaceWith(replacementNode);
              memberPath.skip();
            }
          },
          ReferencedIdentifier(referencePath) {
            if (referencePath.getFunctionParent() !== functionPath) {
              return;
            }

            if (isInsideCallCallee(referencePath)) {
              return;
            }

            if (!candidate.rootInputs.includes(referencePath.node.name)) {
              return;
            }

            const binding = referencePath.scope.getBinding(referencePath.node.name);

            if (binding && isBindingLocalToFunction(binding, functionPath)) {
              return;
            }

            referencePath.replaceWith(
              createIdentifierMemberAccess(candidate.contextName, referencePath.node.name)
            );
            referencePath.skip();
          }
        });
      });
    }
  });
}

function collectEffectLayerCandidate(functionPath, code, functionName, existingNames) {
  const bodyPath = functionPath.get("body");

  if (!bodyPath?.isBlockStatement()) {
    return null;
  }

  const topLevelStatements = bodyPath.get("body");
  const tryStatementPath = topLevelStatements.find((statementPath) => statementPath.isTryStatement());

  if (!tryStatementPath) {
    return null;
  }

  const tryBodyStatements = tryStatementPath.get("block").get("body");

  for (let index = 0; index <= tryBodyStatements.length - 3; index += 1) {
    const responseStatement = tryBodyStatements[index];
    const payloadStatement = tryBodyStatements[index + 1];
    const statusStatement = tryBodyStatements[index + 2];

    if (
      !responseStatement.isVariableDeclaration() ||
      responseStatement.node.declarations.length !== 1
    ) {
      continue;
    }

    const responseDeclarator = responseStatement.node.declarations[0];
    const responseName =
      responseDeclarator.id?.type === "Identifier" ? responseDeclarator.id.name : "";

    if (
      !responseName ||
      responseDeclarator.init?.type !== "AwaitExpression" ||
      responseDeclarator.init.argument?.type !== "CallExpression" ||
      getNodeSource(code, responseDeclarator.init.argument.callee, "") !== "fetch"
    ) {
      continue;
    }

    if (
      !payloadStatement.isVariableDeclaration() ||
      payloadStatement.node.declarations.length !== 1
    ) {
      continue;
    }

    const payloadDeclarator = payloadStatement.node.declarations[0];
    const payloadName =
      payloadDeclarator.id?.type === "Identifier" ? payloadDeclarator.id.name : "";

    if (
      !payloadName ||
      payloadDeclarator.init?.type !== "AwaitExpression" ||
      getNodeSource(code, payloadDeclarator.init.argument, "") !== `${responseName}.json()`
    ) {
      continue;
    }

    if (!statusStatement.isIfStatement()) {
      continue;
    }

    const testSource = getNodeSource(code, statusStatement.node.test, "");
    const consequentSource = getNodeSource(code, statusStatement.node.consequent, "");

    if (
      !testSource.includes(`!${responseName}.ok`) ||
      !consequentSource.includes("throw")
    ) {
      continue;
    }

    const statementPaths = [responseStatement, payloadStatement, statusStatement];
    const rootInputs = new Map();
    const runtimeAliases = new Map();

    statementPaths.forEach((statementPath) => {
      statementPath.traverse({
        Function(innerPath) {
          innerPath.skip();
        },
        MemberExpression(memberPath) {
          if (memberPath.parentPath?.isMemberExpression() && memberPath.key === "object") {
            return;
          }

          if (
            memberPath.parentPath?.isOptionalMemberExpression() &&
            memberPath.key === "object"
          ) {
            return;
          }

          if (memberPathStartsWith(memberPath.node, ["window", "location"])) {
            runtimeAliases.set("location", {
              aliasName: "location",
              sourceExpression: "window.location",
              objectParts: ["window", "location"]
            });
            return;
          }

          const rootReference = getRootReferenceInfo(memberPath.node);

          if (!rootReference || rootReference.kind !== "identifier") {
            return;
          }

          if (rootReference.name === responseName || rootReference.name === payloadName) {
            return;
          }

          const binding = memberPath.scope.getBinding(rootReference.name);

          if (binding && isBindingLocalToFunction(binding, functionPath)) {
            return;
          }

          if (
            SAFE_GLOBAL_ROOTS.has(rootReference.name) ||
            BLOCKED_RUNTIME_ROOTS.has(rootReference.name)
          ) {
            return;
          }

          rootInputs.set(rootReference.name, rootReference.name);
        },
        ReferencedIdentifier(referencePath) {
          if (referencePath.getFunctionParent() !== functionPath) {
            return;
          }

          if (isInsideCallCallee(referencePath)) {
            return;
          }

          const identifierName = referencePath.node.name;

          if (identifierName === responseName || identifierName === payloadName) {
            return;
          }

          const binding = referencePath.scope.getBinding(identifierName);

          if (binding && isBindingLocalToFunction(binding, functionPath)) {
            return;
          }

          if (
            SAFE_GLOBAL_ROOTS.has(identifierName) ||
            BLOCKED_RUNTIME_ROOTS.has(identifierName)
          ) {
            return;
          }

          rootInputs.set(identifierName, identifierName);
        }
      });
    });

    const inputsUsed = [
      ...Array.from(rootInputs.keys()),
      ...Array.from(runtimeAliases.values()).map((entry) => entry.sourceExpression)
    ];

    if (!inputsUsed.length) {
      return null;
    }

    const functionCore = normalizeFunctionCoreName(functionName);
    const helperName = buildUniqueHelperName(
      `perform${toPascalCase(functionCore)}Request`,
      existingNames
    );
    const helperParams = [
      ...Array.from(rootInputs.keys()),
      ...Array.from(runtimeAliases.values()).map((entry) => entry.aliasName)
    ];
    const helperLines = statementPaths.map((statementPath) =>
      getNodeSource(code, statementPath.node, "")
    );
    const helperBodySource = helperLines
      .join("\n")
      .replaceAll("window.location", "location");
    const helperSource = [
      `async function ${helperName}(${helperParams.join(", ")}) {`,
      ...helperBodySource.split("\n").map((line) => `  ${line}`),
      `  return ${payloadName};`,
      "}"
    ].join("\n");
    const replacementStatementSource = `const ${payloadName} = await ${helperName}(${inputsUsed.join(", ")});`;

    return {
      id: `effect-${functionName}`,
      name: helperName,
      helperName,
      helperSource,
      inputsUsed,
      risk: "medium",
      reason: "isola a sequencia de fetch/parse/erro em uma camada de efeito dedicada",
      startLine: responseStatement.node.loc?.start?.line || null,
      endLine: statusStatement.node.loc?.end?.line || null,
      lineSpan:
        responseStatement.node.loc?.start?.line && statusStatement.node.loc?.end?.line
          ? Math.max(
              1,
              statusStatement.node.loc.end.line - responseStatement.node.loc.start.line + 1
            )
          : 3,
      tryStatementStart: tryStatementPath.node.start,
      targetStarts: statementPaths.map((statementPath) => statementPath.node.start),
      replacementStatementSource
    };
  }

  return null;
}

function buildEffectLayerUpdatedFunctionSource({
  sourceText,
  functionName,
  candidate
}) {
  return buildUpdatedFunctionSourceWithTransform({
    sourceText,
    functionName,
    transform(functionPath) {
      let replaced = false;

      functionPath.traverse({
        Function(innerPath) {
          innerPath.skip();
        },
        TryStatement(tryPath) {
          if (replaced || tryPath.node.start !== candidate.tryStatementStart) {
            return;
          }

          const bodyStatements = tryPath.get("block").get("body");
          const startIndex = bodyStatements.findIndex(
            (statementPath) => statementPath.node.start === candidate.targetStarts[0]
          );

          if (startIndex === -1) {
            return;
          }

          const replacementNode = parseSingleStatementNode(
            candidate.replacementStatementSource,
            "O statement de camada de efeito"
          );

          for (let index = candidate.targetStarts.length - 1; index >= 1; index -= 1) {
            const statementPath = bodyStatements.find(
              (bodyStatementPath) => bodyStatementPath.node.start === candidate.targetStarts[index]
            );

            if (statementPath) {
              statementPath.remove();
            }
          }

          const firstStatementPath = bodyStatements.find(
            (bodyStatementPath) => bodyStatementPath.node.start === candidate.targetStarts[0]
          );

          if (firstStatementPath) {
            firstStatementPath.replaceWith(cloneAstNode(replacementNode));
            replaced = true;
            firstStatementPath.skip();
          }
        }
      });

      if (!replaced) {
        throw new Error(`Nao foi possivel aplicar a extracao de efeito em ${functionName}.`);
      }
    }
  });
}

function applyExtractionPreviewToAst({
  ast,
  functionName,
  functionEntriesByName,
  helperNode,
  updatedFunctionNode
}) {
  let replaced = false;

  traverse(ast, {
    FunctionDeclaration(functionPath) {
      if (functionPath.node.id?.name !== functionName || replaced) {
        return;
      }

      const originalEntry = functionEntriesByName.get(functionName);

      if (originalEntry?.declarationShape !== "function-declaration") {
        return;
      }

      if (updatedFunctionNode.type !== "FunctionDeclaration") {
        throw new Error(
          `A funcao ${functionName} precisa continuar como function declaration.`
        );
      }

      functionPath.replaceWithMultiple([
        cloneAstNode(helperNode),
        cloneAstNode(updatedFunctionNode)
      ]);
      replaced = true;
      functionPath.skip();
    },
    VariableDeclaration(variableDeclarationPath) {
      if (replaced || variableDeclarationPath.node.declarations.length !== 1) {
        return;
      }

      const declarator = variableDeclarationPath.node.declarations[0];
      const declaratorName =
        declarator?.id?.type === "Identifier" ? declarator.id.name : "";

      if (declaratorName !== functionName) {
        return;
      }

      const originalEntry = functionEntriesByName.get(functionName);

      if (originalEntry?.declarationShape !== "variable-declaration") {
        return;
      }

      if (updatedFunctionNode.type !== "VariableDeclaration") {
        throw new Error(
          `A funcao ${functionName} precisa continuar como variavel com funcao.`
        );
      }

      variableDeclarationPath.replaceWithMultiple([
        cloneAstNode(helperNode),
        cloneAstNode(updatedFunctionNode)
      ]);
      replaced = true;
      variableDeclarationPath.skip();
    },
    VariableDeclarator(variableDeclaratorPath) {
      if (replaced) {
        return;
      }

      const declaratorName =
        variableDeclaratorPath.node.id?.type === "Identifier"
          ? variableDeclaratorPath.node.id.name
          : "";

      if (declaratorName !== functionName) {
        return;
      }

      const originalEntry = functionEntriesByName.get(functionName);

      if (originalEntry?.declarationShape !== "variable-declarator") {
        return;
      }

      if (
        updatedFunctionNode.type !== "VariableDeclaration" ||
        updatedFunctionNode.declarations.length !== 1
      ) {
        throw new Error(
          `A funcao ${functionName} precisa continuar compativel com a declaracao original.`
        );
      }

      variableDeclaratorPath.parentPath.insertBefore(cloneAstNode(helperNode));
      variableDeclaratorPath.replaceWith(
        cloneAstNode(updatedFunctionNode.declarations[0])
      );
      replaced = true;
      variableDeclaratorPath.skip();
    }
  });

  if (!replaced) {
    throw new Error(`Nao foi possivel aplicar a extracao em ${functionName}.`);
  }
}

function validateUpdatedSource({
  sourceText,
  functionName,
  helperName
}) {
  const ast = parseSourceFile(sourceText);
  const nextEntries = collectNamedFunctionEntries(ast, sourceText);

  if (!nextEntries.has(functionName)) {
    throw new Error(`A funcao ${functionName} desapareceu apos a extracao.`);
  }

  if (!nextEntries.has(helperName)) {
    throw new Error(`O helper ${helperName} nao foi encontrado apos a extracao.`);
  }
}

function buildPreviewDiff(beforeSource, afterSource) {
  return [
    "--- before",
    "+++ after",
    ...String(beforeSource || "")
      .split("\n")
      .map((line) => `- ${line}`),
    ...String(afterSource || "")
      .split("\n")
      .map((line) => `+ ${line}`)
  ].join("\n");
}

export function buildLocalExtractionPreview({
  sourceText,
  sourceFilePath,
  functionName,
  includeExecutionArtifacts = false
}) {
  const ast = parseSourceFile(sourceText);
  const functionEntriesByName = collectNamedFunctionEntries(ast, sourceText);
  const functionEntry = functionEntriesByName.get(functionName);
  const inspection = inspectSourceText(sourceText);
  const functionAnalysis =
    getList(inspection?.functions).find((entry) => entry?.name === functionName) || null;

  if (!functionEntry) {
    throw new Error(`Funcao nao encontrada no arquivo: ${functionName}.`);
  }

  const functionPath = findNamedFunctionPath(ast, functionName);

  if (!functionPath) {
    throw new Error(`Nao foi possivel localizar a AST da funcao ${functionName}.`);
  }

  const containingScopeNames = collectContainingScopeBindingNames(functionPath);
  const functionScopeNames = collectFunctionScopeBindingNames(functionPath);
  const fileIdentifierNames = collectUsedIdentifierNames(ast);
  const globalFunctionNames = new Set(Array.from(functionEntriesByName.keys()));
  const helperExistingNames = new Set([
    ...Array.from(fileIdentifierNames),
    ...Array.from(containingScopeNames),
    ...Array.from(globalFunctionNames)
  ]);
  const bindingExistingNames = new Set([
    ...Array.from(fileIdentifierNames),
    ...Array.from(functionScopeNames),
    ...Array.from(helperExistingNames)
  ]);
  const pureCandidates = collectSafeExtractionCandidates(
    functionPath,
    sourceText,
    functionName,
    helperExistingNames
  );
  const remainingMixedZones = countRemainingMixedZones(functionPath, sourceText);

  if (pureCandidates.length) {
    const selectedCandidate = pureCandidates[0];
    const helperSource = buildHelperSource(selectedCandidate);
    const callSource = `${selectedCandidate.helperName}(${selectedCandidate.inputsUsed.join(", ")})`;
    const updatedFunctionSource = buildUpdatedFunctionSource({
      sourceText,
      functionName,
      candidate: selectedCandidate,
      callSource
    });
    const helperNode = parseHelperNode(helperSource);
    const updatedFunctionNode = parseUpdatedFunctionNode(
      functionName,
      updatedFunctionSource
    );
    const previewAst = parseSourceFile(sourceText);

    applyExtractionPreviewToAst({
      ast: previewAst,
      functionName,
      functionEntriesByName,
      helperNode,
      updatedFunctionNode
    });

    const nextSource = printStableSource(previewAst, sourceText);

    validateUpdatedSource({
      sourceText: nextSource,
      functionName,
      helperName: helperNode.id.name
    });

    const previewPayload = buildPreviewPayload({
      sourceFilePath,
      functionName,
      functionEntry,
      mode: "pure-extraction",
      candidates: pureCandidates,
      selectedCandidate,
      helperSource,
      updatedFunctionSource,
      summary: `Modo ${getModeMeta("pure-extraction").label}: ${pureCandidates.length} bloco(s) puro(s) seguro(s). Melhor candidato: ${selectedCandidate.helperName}.`,
      progress: {
        remainingMixedZones,
        safeNextExtraction: selectedCandidate.helperName,
        safeCandidateCount: pureCandidates.length
      }
    });

    if (includeExecutionArtifacts) {
      return {
        ...previewPayload,
        nextSource,
        helperName: helperNode.id.name
      };
    }

    return previewPayload;
  }

  const dependencyCandidate = collectDependencySurfacingCandidate(
    functionPath,
    sourceText,
    functionName,
    helperExistingNames,
    bindingExistingNames
  );

  if (dependencyCandidate) {
    const helperSource = dependencyCandidate.helperSource;
    const updatedFunctionSource = buildDependencySurfacingUpdatedFunctionSource({
      sourceText,
      functionName,
      candidate: dependencyCandidate
    });
    const helperNode = parseHelperNode(helperSource);
    const updatedFunctionNode = parseUpdatedFunctionNode(
      functionName,
      updatedFunctionSource
    );
    const previewAst = parseSourceFile(sourceText);

    applyExtractionPreviewToAst({
      ast: previewAst,
      functionName,
      functionEntriesByName,
      helperNode,
      updatedFunctionNode
    });

    const nextSource = printStableSource(previewAst, sourceText);

    validateUpdatedSource({
      sourceText: nextSource,
      functionName,
      helperName: helperNode.id.name
    });

    const previewPayload = buildPreviewPayload({
      sourceFilePath,
      functionName,
      functionEntry,
      mode: "dependency-injection-surfacing",
      candidates: [dependencyCandidate],
      selectedCandidate: dependencyCandidate,
      helperSource,
      updatedFunctionSource,
      summary: `Modo ${getModeMeta("dependency-injection-surfacing").label}: dependencias externas foram agrupadas para reduzir hidden inputs e preparar a proxima extracao.`,
      progress: {
        remainingMixedZones,
        safeNextExtraction: dependencyCandidate.helperName,
        safeCandidateCount: 1
      }
    });

    if (includeExecutionArtifacts) {
      return {
        ...previewPayload,
        nextSource,
        helperName: helperNode.id.name
      };
    }

    return previewPayload;
  }

  const effectCandidate = collectEffectLayerCandidate(
    functionPath,
    sourceText,
    functionName,
    helperExistingNames
  );

  if (effectCandidate) {
    const helperSource = effectCandidate.helperSource;
    const updatedFunctionSource = buildEffectLayerUpdatedFunctionSource({
      sourceText,
      functionName,
      candidate: effectCandidate
    });
    const helperNode = parseHelperNode(helperSource);
    const updatedFunctionNode = parseUpdatedFunctionNode(
      functionName,
      updatedFunctionSource
    );
    const previewAst = parseSourceFile(sourceText);

    applyExtractionPreviewToAst({
      ast: previewAst,
      functionName,
      functionEntriesByName,
      helperNode,
      updatedFunctionNode
    });

    const nextSource = printStableSource(previewAst, sourceText);

    validateUpdatedSource({
      sourceText: nextSource,
      functionName,
      helperName: helperNode.id.name
    });

    const previewPayload = buildPreviewPayload({
      sourceFilePath,
      functionName,
      functionEntry,
      mode: "side-effect-isolation",
      candidates: [effectCandidate],
      selectedCandidate: effectCandidate,
      helperSource,
      updatedFunctionSource,
      summary: `Modo ${getModeMeta("side-effect-isolation").label}: a sequencia de efeito foi isolada para limpar o handler antes da proxima rodada.`,
      progress: {
        remainingMixedZones,
        safeNextExtraction: effectCandidate.helperName,
        safeCandidateCount: 1
      }
    });

    if (includeExecutionArtifacts) {
      return {
        ...previewPayload,
        nextSource,
        helperName: helperNode.id.name
      };
    }

    return previewPayload;
  }

  const shapeCandidate = collectShapeSurfacingCandidate({
    functionPath,
    functionName,
    functionEntry,
    functionAnalysis,
    helperExistingNames,
    bindingExistingNames,
    code: sourceText,
    remainingMixedZones
  });

  if (shapeCandidate) {
    const helperSource = shapeCandidate.helperSource;
    const updatedFunctionSource = shapeCandidate.updatedFunctionSource;
    const helperNode = parseHelperNode(helperSource);
    const updatedFunctionNode = parseUpdatedFunctionNode(
      functionName,
      updatedFunctionSource
    );
    const previewAst = parseSourceFile(sourceText);
    const targetBindingPath = findNamedFunctionBindingPath(previewAst, functionName);
    const rewrittenCallSites = rewriteShapeSurfacingCallSites({
      ast: previewAst,
      functionName,
      helperName: helperNode.id.name,
      rootParamIndex: shapeCandidate.rootParamIndex,
      targetBindingPath
    });

    applyExtractionPreviewToAst({
      ast: previewAst,
      functionName,
      functionEntriesByName,
      helperNode,
      updatedFunctionNode
    });

    const nextSource = printStableSource(previewAst, sourceText);

    validateUpdatedSource({
      sourceText: nextSource,
      functionName,
      helperName: helperNode.id.name
    });

    const previewPayload = buildPreviewPayload({
      sourceFilePath,
      functionName,
      functionEntry,
      mode: "input-normalization",
      candidates: [shapeCandidate],
      selectedCandidate: shapeCandidate,
      helperSource,
      updatedFunctionSource,
      summary:
        `Modo ${getModeMeta("input-normalization").label}: intermediate representation ${helperNode.id.name} introduzida para ${shapeCandidate.rootParamName} ` +
        `(${shapeCandidate.shapeProperties.join(", ")}). ${rewrittenCallSites} chamada(s) local(is) atualizada(s).`,
      progress: {
        remainingMixedZones,
        safeNextExtraction: helperNode.id.name,
        safeCandidateCount: 1
      }
    });

    if (includeExecutionArtifacts) {
      return {
        ...previewPayload,
        nextSource,
        helperName: helperNode.id.name
      };
    }

    return previewPayload;
  }

  const previewPayload = buildNoCandidatePreview({
    sourceFilePath,
    functionName,
    functionEntry,
    remainingMixedZones,
    functionAnalysis
  });

  if (includeExecutionArtifacts) {
    return {
      ...previewPayload,
      nextSource: sourceText,
      helperName: ""
    };
  }

  return previewPayload;
}

export function applyLocalExtractionProposal({
  sourceText,
  functionName,
  helperSource,
  updatedFunctionSource
}) {
  const ast = parseSourceFile(sourceText);
  const functionEntriesByName = collectNamedFunctionEntries(ast, sourceText);
  const helperNode = parseHelperNode(helperSource);
  const updatedFunctionNode = parseUpdatedFunctionNode(functionName, updatedFunctionSource);
  const nextAst = parseSourceFile(sourceText);

  applyExtractionPreviewToAst({
    ast: nextAst,
    functionName,
    functionEntriesByName,
    helperNode,
    updatedFunctionNode
  });

  const nextSource = printStableSource(nextAst, sourceText);

  validateUpdatedSource({
    sourceText: nextSource,
    functionName,
    helperName: helperNode.id.name
  });

  return {
    nextSource,
    helperName: helperNode.id.name
  };
}

export function createExtractPureBlockPostHandler(config = {}) {
  const normalizedConfig = normalizeRefactorConfig(config);

  return async function POST(request) {
    try {
      const body = await request.json().catch(() => ({}));
      const operation = String(body?.operation || "preview").trim().toLowerCase();
      const script = String(body?.script || "").trim();
      const functionName = String(body?.functionName || "").trim();

      if (!script) {
        return Response.json(
          { status: "error", error: "Campo 'script' ausente." },
          { status: 400 }
        );
      }

      if (!functionName) {
        return Response.json(
          { status: "error", error: "Campo 'functionName' ausente." },
          { status: 400 }
        );
      }

      const sourceFilePath = resolveScriptPath(script, normalizedConfig);
      ensureScriptAccess(sourceFilePath, normalizedConfig);
      const sourceText = await fs.readFile(sourceFilePath, "utf8");

      if (operation === "preview") {
        return Response.json(
          buildLocalExtractionPreview({
            sourceText,
            sourceFilePath,
            functionName
          })
        );
      }

      if (operation === "apply") {
        const proposal = body?.proposal || {};
        const proposalMode = String(proposal?.mode || "").trim().toLowerCase();
        const helperSource = String(proposal?.helperSource || "").trim();
        const updatedFunctionSource = String(proposal?.updatedFunctionSource || "").trim();

        if (proposalMode === "input-normalization") {
          const previewPayload = buildLocalExtractionPreview({
            sourceText,
            sourceFilePath,
            functionName,
            includeExecutionArtifacts: true
          });

          if (
            previewPayload?.preview?.mode !== "input-normalization" ||
            !previewPayload?.nextSource ||
            previewPayload.nextSource === sourceText
          ) {
            return Response.json(
              {
                status: "error",
                error: "Nao foi possivel regenerar o patch de input normalization."
              },
              { status: 400 }
            );
          }

          await fs.writeFile(sourceFilePath, previewPayload.nextSource, "utf8");

          return Response.json({
            ok: true,
            sourceFilePath,
            functionName,
            helperName: previewPayload.helperName || previewPayload.preview?.helperName || ""
          });
        }

        if (!helperSource || !updatedFunctionSource) {
          return Response.json(
            {
              status: "error",
              error: "Proposal incompleta para aplicacao."
            },
            { status: 400 }
          );
        }

        const applyResult = applyLocalExtractionProposal({
          sourceText,
          functionName,
          helperSource,
          updatedFunctionSource
        });

        await fs.writeFile(sourceFilePath, applyResult.nextSource, "utf8");

        return Response.json({
          ok: true,
          sourceFilePath,
          functionName,
          helperName: applyResult.helperName
        });
      }

      return Response.json(
        {
          status: "error",
          error: `Operacao invalida: ${operation}.`
        },
        { status: 400 }
      );
    } catch (error) {
      return Response.json(
        {
          status: "error",
          error: String(error?.message || error || "Erro ao extrair bloco puro.")
        },
        { status: 500 }
      );
    }
  };
}
