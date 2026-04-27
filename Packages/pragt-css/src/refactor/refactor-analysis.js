import { detectPatterns, getDominantPattern } from "./patterns/pattern-registry.js";

const PURE_SAFE_GLOBAL_ROOTS = new Set([
  "Array",
  "Boolean",
  "JSON",
  "Math",
  "Number",
  "Object",
  "RegExp",
  "String"
]);

export const REFACTOR_BATCH_META = {
  "auto-safe": {
    label: "Auto-safe",
    modeLabel: "Pure extraction",
    description: "Funcoes pequenas e seguras para automacao por bloco puro.",
    tone: {
      border: "1px solid rgba(22, 101, 52, 0.18)",
      background: "rgba(220, 252, 231, 0.9)",
      color: "#166534"
    }
  },
  "extract-first": {
    label: "Extract-first",
    modeLabel: "Pure extraction",
    description: "Funcoes com um corte local ainda seguro antes de mudar dependencias ou bordas.",
    tone: {
      border: "1px solid rgba(180, 83, 9, 0.18)",
      background: "rgba(255, 237, 213, 0.9)",
      color: "#9a3412"
    }
  },
  "dependency-first": {
    label: "Dependency-injection-surfacing",
    modeLabel: "Dependency-injection surfacing",
    description: "Funcoes com carga alta de dependencias externas e reads implicitos relevantes.",
    tone: {
      border: "1px solid rgba(30, 64, 175, 0.18)",
      background: "rgba(219, 234, 254, 0.9)",
      color: "#1d4ed8"
    }
  },
  "shape-first": {
    label: "Conditional-normalization",
    modeLabel: "Input normalization (descriptor extraction)",
    description:
      "Funcoes pequenas com Shape-based conditional logic e inferencia implicita a partir da estrutura do objeto de entrada.",
    tone: {
      border: "1px solid rgba(8, 145, 178, 0.18)",
      background: "rgba(207, 250, 254, 0.92)",
      color: "#0e7490"
    }
  },
  "manual-supervision": {
    label: "Manual-supervision",
    modeLabel: "Manual review",
    description: "Fluxos sensiveis com undo, storage, reload ou runtime mais delicado.",
    tone: {
      border: "1px solid rgba(185, 28, 28, 0.18)",
      background: "rgba(254, 226, 226, 0.9)",
      color: "#991b1b"
    }
  }
};

export const SAFE_BATCH_ORDER = ["auto-safe", "shape-first", "dependency-first", "extract-first"];

const PLAN_BATCH_ORDER = [
  "auto-safe",
  "shape-first",
  "dependency-first",
  "extract-first",
  "manual-supervision"
];

function getList(items) {
  return Array.isArray(items) ? items : [];
}

function getCount(items) {
  return getList(items).length;
}

function sortLabels(items) {
  return Array.from(new Set(getList(items))).sort((left, right) =>
    String(left).localeCompare(String(right))
  );
}

function isConstantLike(name) {
  return /^[A-Z][A-Z0-9_]*$/.test(String(name || ""));
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

export function getRuntimeDependencies(entry) {
  if (entry?.runtimeDirect && Array.isArray(entry.runtimeDirect.signals)) {
    return sortLabels(entry.runtimeDirect.signals);
  }

  if (Array.isArray(entry?.runtimeDependencies)) {
    return sortLabels(entry.runtimeDependencies);
  }

  const dependencies = [];
  const labels = [
    ...getList(entry?.externalReads),
    ...getList(entry?.externalWrites),
    ...getList(entry?.calls),
    ...getList(entry?.hiddenInputs)
  ].join(" ");

  if (entry?.usesWindow) {
    dependencies.push("window");
  }

  if (entry?.usesDocument) {
    dependencies.push("document");
  }

  if (/localStorage/i.test(labels)) {
    dependencies.push("localStorage");
  }

  if (/sessionStorage/i.test(labels)) {
    dependencies.push("sessionStorage");
  }

  if (
    entry?.usesStorage &&
    !dependencies.includes("localStorage") &&
    !dependencies.includes("sessionStorage")
  ) {
    dependencies.push("storage");
  }

  if (entry?.usesProcessEnv) {
    dependencies.push("process.env");
  }

  return sortLabels(dependencies);
}

export function getRuntimeDirect(entry) {
  const signals = getRuntimeDependencies(entry);

  return {
    level: String(entry?.runtimeDirect?.level || getRuntimeLevel(signals.length)),
    signals
  };
}

export function getReferenceRoot(label) {
  const normalizedLabel = String(label || "")
    .replace(/\?\.\[/g, "[")
    .replace(/\?\./g, ".")
    .trim();
  const match = normalizedLabel.match(/^(this|[A-Za-z_$][A-Za-z0-9_$]*)/);

  return match?.[1] || "";
}

export function getExternalCoupling(entry) {
  if (entry?.externalCoupling) {
    const reads = sortLabels(entry.externalCoupling.reads);
    const calls = sortLabels(entry.externalCoupling.calls);
    const constants = sortLabels(entry.externalCoupling.constants);

    return {
      level:
        entry.externalCoupling.level ||
        getExternalCouplingLevel(reads.length + calls.length + constants.length),
      reads,
      calls,
      constants
    };
  }

  const rootCandidates = [
    ...getList(entry?.externalReads),
    ...getList(entry?.externalWrites),
    ...getList(entry?.hiddenInputs)
  ]
    .map((label) => getReferenceRoot(label))
    .filter((label) => label && label !== entry?.name && !PURE_SAFE_GLOBAL_ROOTS.has(label));

  const calls = getList(entry?.externalCalls).filter((label) => {
    const root = getReferenceRoot(label);

    return root && root !== entry?.name && !PURE_SAFE_GLOBAL_ROOTS.has(root);
  });

  const constants = sortLabels(rootCandidates.filter((label) => isConstantLike(label)));
  const reads = sortLabels(rootCandidates.filter((label) => !isConstantLike(label)));

  return {
    level: getExternalCouplingLevel(reads.length + calls.length + constants.length),
    reads,
    calls: sortLabels(calls),
    constants
  };
}

export function getExternalCouplingCount(entry) {
  const externalCoupling = getExternalCoupling(entry);

  return (
    getCount(externalCoupling.reads) +
    getCount(externalCoupling.calls) +
    getCount(externalCoupling.constants)
  );
}

export function isHandlerFunction(entry) {
  return /^(handle[A-Z_]|on[A-Z_])/.test(String(entry?.name || "")) || /Handler$/.test(
    String(entry?.name || "")
  );
}

export function isPureFunction(entry) {
  const externalReadsCount = getCount(entry?.externalReads);
  const externalWritesCount = getCount(entry?.externalWrites);
  const hiddenInputsCount = getCount(entry?.hiddenInputs);
  const runtimeDependencies = getRuntimeDependencies(entry);
  const params = new Set(getList(entry?.params));
  const locals = new Set(getList(entry?.localIdentifiers));
  const calls = getList(entry?.calls);

  if (
    externalReadsCount > 0 ||
    externalWritesCount > 0 ||
    hiddenInputsCount > 0 ||
    runtimeDependencies.length > 0
  ) {
    return false;
  }

  return calls.every((callLabel) => {
    const root = getReferenceRoot(callLabel);

    if (!root || root === "this") {
      return false;
    }

    return params.has(root) || locals.has(root) || PURE_SAFE_GLOBAL_ROOTS.has(root);
  });
}

export function getFunctionCategory(entry) {
  if (isPureFunction(entry)) {
    return "puras";
  }

  if (isHandlerFunction(entry)) {
    return "handlers";
  }

  if (getRuntimeDependencies(entry).length > 0) {
    return "runtime";
  }

  return "orquestracao";
}

export function getRiskScore(entry) {
  const hiddenInputsCount = getCount(entry?.hiddenInputs);
  const externalReadsCount = getCount(entry?.externalReads);
  const externalWritesCount = getCount(entry?.externalWrites);
  const callsCount = getCount(entry?.calls);
  const runtimeDependenciesCount = getRuntimeDependencies(entry).length;

  if (isPureFunction(entry)) {
    return 0;
  }

  return (
    hiddenInputsCount * 6 +
    externalReadsCount * 4 +
    externalWritesCount * 7 +
    runtimeDependenciesCount * 5 +
    Math.min(callsCount, 5) +
    (isHandlerFunction(entry) ? 2 : 0)
  );
}

export function compareFunctions(left, right) {
  if (right.riskScore !== left.riskScore) {
    return right.riskScore - left.riskScore;
  }

  if (right.hiddenInputsCount !== left.hiddenInputsCount) {
    return right.hiddenInputsCount - left.hiddenInputsCount;
  }

  if (right.externalReadsCount !== left.externalReadsCount) {
    return right.externalReadsCount - left.externalReadsCount;
  }

  if (right.externalWritesCount !== left.externalWritesCount) {
    return right.externalWritesCount - left.externalWritesCount;
  }

  if (right.callsCount !== left.callsCount) {
    return right.callsCount - left.callsCount;
  }

  return String(left.name || "").localeCompare(String(right.name || ""));
}

export function isHighPriorityRefactorCandidate(entry) {
  const hiddenInputsCount = entry?.hiddenInputsCount ?? getCount(entry?.hiddenInputs);
  const externalReadsCount = entry?.externalReadsCount ?? getCount(entry?.externalReads);
  const runtimeDependenciesCount =
    entry?.runtimeDependenciesCount ?? getRuntimeDependencies(entry).length;
  const riskScore = entry?.riskScore ?? getRiskScore(entry);

  if (hiddenInputsCount >= 5 && runtimeDependenciesCount > 0) {
    return true;
  }

  if (hiddenInputsCount >= 4 && externalReadsCount >= 7) {
    return true;
  }

  if (runtimeDependenciesCount > 0 && riskScore >= 60) {
    return true;
  }

  return false;
}

export function getFunctionRole(entry) {
  const functionName = String(entry?.name || "");
  const normalizedName = functionName.toLowerCase();

  if (isHandlerFunction(entry)) {
    return "Action Handler";
  }

  if (/^(build|create|serialize)/.test(normalizedName)) {
    return "Builder";
  }

  if (/^(compute|compare|rank|max|min|split|consume)/.test(normalizedName)) {
    return "Algorithm";
  }

  if (/^(analyze|scan|infer)/.test(normalizedName)) {
    return "Analyzer";
  }

  if (
    entry?.localCallsCount >= 3 ||
    entry?.category === "orquestracao" ||
    entry?.externalCouplingCount >= 6 ||
    entry?.externalCoupling?.level === "high"
  ) {
    return "Orchestrator";
  }

  if (entry?.runtimeDependenciesCount > 0 && entry?.category === "runtime") {
    return "Runtime Helper";
  }

  if (
    /^(parse|clamp|escape|compact|normalize|format|extract|expand|resolve|collect|get|has|is|can|should)/.test(
      normalizedName
    )
  ) {
    return "Utility";
  }

  if (entry?.category === "puras") {
    return "Utility";
  }

  return "Module Function";
}

export function getFunctionSourceSpan(entry) {
  const start = Number(entry?.start);
  const end = Number(entry?.end);

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return 0;
  }

  return end - start;
}

export function getHiddenInputShapeAnalysis(entry) {
  const rootCounts = new Map();

  getList(entry?.hiddenInputs).forEach((inputLabel) => {
    const normalizedLabel = String(inputLabel || "")
      .replace(/\?\.\[/g, "[")
      .replace(/\?\./g, ".")
      .trim();
    const root = getReferenceRoot(normalizedLabel);

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
    distinctRootsCount: rootCounts.size,
    propertyAccessCount: Array.from(rootCounts.values()).reduce((sum, count) => sum + count, 0)
  };
}

export function getManualSupervisionReasons(entry) {
  const labels = [
    entry?.name,
    ...getList(entry?.runtimeDependencies || getRuntimeDependencies(entry)),
    ...getList(entry?.externalCalls),
    ...getList(entry?.hiddenInputs),
    ...getList(entry?.externalReads)
  ]
    .join(" ")
    .toLowerCase();
  const reasons = [];

  if (/undo/.test(labels)) {
    reasons.push("undo");
  }

  if (/localstorage|sessionstorage|storage/.test(labels)) {
    reasons.push("storage");
  }

  if (/reload|beforeunload/.test(labels)) {
    reasons.push("reload");
  }

  if (/detached|window\.open|popup/.test(labels)) {
    reasons.push("detached-window");
  }

  return reasons;
}

function deriveStructuralBase(entry) {
  const hiddenInputsCount = entry?.hiddenInputsCount ?? getCount(entry?.hiddenInputs);
  const externalReadsCount = entry?.externalReadsCount ?? getCount(entry?.externalReads);
  const externalWritesCount = entry?.externalWritesCount ?? getCount(entry?.externalWrites);
  const callsCount = entry?.callsCount ?? getCount(entry?.calls);
  const localCallsCount = entry?.localCallsCount ?? getCount(entry?.localCalls);
  const externalCallsCount = entry?.externalCallsCount ?? getCount(entry?.externalCalls);
  const runtimeDirect = entry?.runtimeDirect?.signals ? entry.runtimeDirect : getRuntimeDirect(entry);
  const runtimeDependencies = Array.isArray(entry?.runtimeDependencies)
    ? sortLabels(entry.runtimeDependencies)
    : runtimeDirect.signals;
  const runtimeDependenciesCount =
    entry?.runtimeDependenciesCount ?? getCount(runtimeDependencies);
  const externalCoupling = entry?.externalCoupling ? getExternalCoupling(entry) : getExternalCoupling(entry);
  const externalCouplingCount =
    entry?.externalCouplingCount ??
    getCount(externalCoupling.reads) +
      getCount(externalCoupling.calls) +
      getCount(externalCoupling.constants);
  const category = entry?.category || getFunctionCategory({ ...entry, runtimeDirect, runtimeDependencies });
  const role =
    entry?.role ||
    getFunctionRole({
      ...entry,
      localCallsCount,
      externalCallsCount,
      runtimeDirect,
      runtimeDependenciesCount,
      externalCoupling,
      externalCouplingCount,
      category
    });
  const riskScore = entry?.riskScore ?? getRiskScore({ ...entry, runtimeDirect, runtimeDependencies });
  const functionSourceSpan = getFunctionSourceSpan(entry);
  const hiddenInputShape = entry?.hiddenInputShape || getHiddenInputShapeAnalysis(entry);
  const manualSupervisionReasons = Array.isArray(entry?.manualSupervisionReasons)
    ? entry.manualSupervisionReasons
    : getManualSupervisionReasons({ ...entry, runtimeDependencies });

  return {
    hiddenInputsCount,
    externalReadsCount,
    externalWritesCount,
    callsCount,
    localCallsCount,
    externalCallsCount,
    runtimeDirect,
    runtimeDependencies,
    runtimeDependenciesCount,
    externalCoupling,
    externalCouplingCount,
    category,
    role,
    riskScore,
    functionSourceSpan,
    hiddenInputShape,
    manualSupervisionReasons,
    manualSupervisionReasonsCount: manualSupervisionReasons.length
  };
}

export function enrichFunctionEntry(entry) {
  const derived = deriveStructuralBase(entry);

  return {
    ...entry,
    ...derived,
    isHighPriorityRefactor:
      entry?.isHighPriorityRefactor ?? isHighPriorityRefactorCandidate({ ...entry, ...derived })
  };
}

export function getStructuralSignals(entry) {
  const derived = deriveStructuralBase(entry);

  return {
    ...derived,
    architectureAnnotation: entry?.architectureAnnotation || null,
    architectureAnnotationDirectives: entry?.architectureAnnotation?.directives || {},
    architectureAnnotationLinesCount: getCount(entry?.architectureAnnotation?.lines),
    sameParamMemberAccess: derived.hiddenInputShape.dominantCount,
    conditionalMemberAccess: derived.hiddenInputShape.propertyAccessCount
  };
}

export function runPatternDetection(entry) {
  return detectPatterns(getStructuralSignals(entry));
}

export function getDominantStructuralPattern(entry) {
  return getDominantPattern(getStructuralSignals(entry));
}

export function getDominantStructuralProblem(entry) {
  const dominantPattern = getDominantStructuralPattern(entry);

  return {
    key: dominantPattern?.problemKey || "low-structural-pressure",
    label: dominantPattern?.problemName || "Low structural pressure",
    reason: dominantPattern?.reason || "superficie estrutural enxuta para o tamanho atual",
    patternId: dominantPattern?.id || "low-structural-pressure",
    pipeline: dominantPattern?.pipeline || "low-structural-pressure",
    interventionLabel: dominantPattern?.interventionLabel || "Keep as is"
  };
}

export function getSuggestedIntervention(entryOrProblem, maybeEntry) {
  if (
    entryOrProblem &&
    typeof entryOrProblem === "object" &&
    typeof entryOrProblem.interventionLabel === "string"
  ) {
    return entryOrProblem.interventionLabel;
  }

  if (
    entryOrProblem &&
    typeof entryOrProblem === "object" &&
    typeof entryOrProblem.patternId === "string" &&
    maybeEntry
  ) {
    return getDominantStructuralPattern(maybeEntry)?.interventionLabel || "Review";
  }

  return getDominantStructuralPattern(entryOrProblem)?.interventionLabel || "Review";
}

export function buildStructuralDiagnosis(entry) {
  const reasons = [];
  const signals = getStructuralSignals(entry);
  const dominantPattern = getDominantPattern(signals);
  const dominantProblem = getDominantStructuralProblem(signals);
  const suggestedIntervention = dominantPattern?.interventionLabel || "Review";

  function pushReason(reason) {
    if (reason && !reasons.includes(reason)) {
      reasons.push(reason);
    }
  }

  pushReason(dominantPattern?.reason);

  if (signals.hiddenInputsCount >= 5) {
    pushReason(`hidden inputs altos (${signals.hiddenInputsCount})`);
  } else if (signals.hiddenInputsCount >= 3) {
    pushReason(`hidden inputs relevantes (${signals.hiddenInputsCount})`);
  }

  if (signals.externalReadsCount >= 7) {
    pushReason(`leituras externas altas (${signals.externalReadsCount})`);
  } else if (signals.externalReadsCount >= 4) {
    pushReason(`leituras externas moderadas (${signals.externalReadsCount})`);
  }

  if (signals.runtimeDependenciesCount > 0) {
    pushReason(
      `runtime direct ${signals.runtimeDirect.level} (${signals.runtimeDependencies.join(", ")})`
    );
  }

  if (signals.externalCouplingCount > 0) {
    pushReason(
      `external coupling ${signals.externalCoupling.level} (${signals.externalCoupling.reads.length} reads, ${signals.externalCoupling.calls.length} calls, ${signals.externalCoupling.constants.length} constants)`
    );
  }

  if (signals.externalWritesCount > 0) {
    pushReason(`efeitos externos presentes (${signals.externalWritesCount})`);
  }

  if (signals.localCallsCount > 0 && signals.externalCallsCount > 0) {
    pushReason("mistura chamadas locais e externas");
  }

  if (signals.localCallsCount >= 5) {
    pushReason(`coordena varias funcoes locais (${signals.localCallsCount})`);
  }

  if (signals.externalCallsCount >= 4) {
    pushReason(`encosta em varias chamadas externas (${signals.externalCallsCount})`);
  }

  if (getCount(entry?.calledBy) === 0 && entry?.category === "handlers") {
    pushReason("entry point local sem reuso interno");
  }

  if (!reasons.length) {
    pushReason("superficie estrutural enxuta para o tamanho atual");
  }

  return {
    role: signals.role,
    dominantPatternId: dominantPattern?.id || "low-structural-pressure",
    dominantProblem: dominantProblem.label,
    dominantProblemKey: dominantProblem.key,
    suggestedIntervention,
    preferredPipeline: dominantPattern?.pipeline || "low-structural-pressure",
    priorityLabel:
      entry?.isHighPriorityRefactor ? "Alta" : signals.riskScore >= 25 ? "Media" : "Baixa",
    reasons
  };
}

export function getBatchPriorityScore(entry) {
  const signals = getStructuralSignals(entry);

  return (
    signals.hiddenInputsCount * 4 +
    signals.externalReadsCount * 2 +
    signals.localCallsCount * 2 +
    signals.runtimeDependenciesCount * 5 +
    signals.externalCallsCount
  );
}

export function getBatchFamilyLabel(entry) {
  const functionName = String(entry?.name || "");

  if (/^handleApply[A-Z].*ToCode$/.test(functionName)) {
    return "apply-to-code handlers";
  }

  if (/^handlePreview[A-Z]/.test(functionName)) {
    return "preview handlers";
  }

  if (/^handle[A-Z].*ToCode$/.test(functionName)) {
    return "to-code handlers";
  }

  if (/^(build|create|serialize)/.test(functionName)) {
    return "builders";
  }

  if (/^(analyze|scan|infer)/.test(functionName)) {
    return "analysis helpers";
  }

  if (/^(parse|normalize|format|clamp|escape|compact|extract|resolve)/.test(functionName)) {
    return "normalizers and formatters";
  }

  if (/^(get|has|is|can|should)/.test(functionName)) {
    return "utilities";
  }

  return `${String(entry?.role || "module").toLowerCase()} cluster`;
}

export function getBatchStrategy(entry) {
  const signals = getStructuralSignals(entry);
  const dominantPattern = getDominantPattern(signals);
  const batchKey =
    dominantPattern?.executionBatch && REFACTOR_BATCH_META[dominantPattern.executionBatch]
      ? dominantPattern.executionBatch
      : "extract-first";
  const batchMeta = REFACTOR_BATCH_META[batchKey] || REFACTOR_BATCH_META["extract-first"];

  if (batchKey === "manual-supervision") {
    return {
      key: batchKey,
      modeLabel: batchMeta.modeLabel,
      actionLabel:
        dominantPattern?.actionLabel || "Planejar apenas e revisar manualmente",
      rationale: dominantPattern?.rationale || dominantPattern?.reason || batchMeta.description,
      pipeline: dominantPattern?.pipeline || "manual-supervision",
      dominantPatternId: dominantPattern?.id || "manual-supervision"
    };
  }

  if (batchKey === "auto-safe") {
    return {
      key: batchKey,
      modeLabel: batchMeta.modeLabel,
      actionLabel:
        dominantPattern?.actionLabel || "Pode entrar em lote com revisao leve",
      rationale: dominantPattern?.rationale || dominantPattern?.reason || batchMeta.description,
      pipeline: dominantPattern?.pipeline || "auto-safe",
      dominantPatternId: dominantPattern?.id || "auto-safe"
    };
  }

  if (batchKey === "shape-first") {
    return {
      key: batchKey,
      modeLabel: batchMeta.modeLabel,
      actionLabel:
        dominantPattern?.actionLabel || "Normalize input before the main logic",
      rationale:
        dominantPattern?.rationale ||
        dominantPattern?.reason ||
        "the function infers cases from the structure of the same input object",
      pipeline: dominantPattern?.pipeline || "input-normalization",
      dominantPatternId: dominantPattern?.id || "shape-first"
    };
  }

  if (batchKey === "dependency-first") {
    return {
      key: batchKey,
      modeLabel: batchMeta.modeLabel,
      actionLabel:
        dominantPattern?.actionLabel || "Surface dependencies before extraction",
      rationale:
        dominantPattern?.rationale ||
        dominantPattern?.reason ||
        "hidden e reads altos antes da primeira extracao",
      pipeline: dominantPattern?.pipeline || "dependency-injection-surfacing",
      dominantPatternId: dominantPattern?.id || "dependency-first"
    };
  }

  return {
    key: "extract-first",
    modeLabel: batchMeta.modeLabel,
    actionLabel: "Extrair primeiro bloco puro seguro",
    rationale:
      dominantPattern?.rationale || dominantPattern?.reason || "a funcao ainda parece ter ilha pura util",
    pipeline: dominantPattern?.pipeline || "pure-extraction",
    dominantPatternId: dominantPattern?.id || "pure-extraction"
  };
}

export function isActionableFunction(entry, strategy) {
  const signals = getStructuralSignals(entry);

  if (strategy?.key === "manual-supervision") {
    return true;
  }

  if (
    signals.riskScore === 0 &&
    signals.hiddenInputsCount === 0 &&
    signals.externalReadsCount === 0 &&
    signals.externalWritesCount === 0 &&
    signals.runtimeDependenciesCount === 0 &&
    signals.localCallsCount === 0 &&
    signals.externalCallsCount === 0
  ) {
    return false;
  }

  if (signals.role === "Utility" && signals.riskScore <= 4 && getCount(entry?.calledBy) <= 1) {
    return false;
  }

  if (
    getSuggestedIntervention(entry) === "Keep as is" &&
    (strategy?.key === "auto-safe" || signals.role === "Utility")
  ) {
    return false;
  }

  return true;
}

export function buildRefactorPlan(functionEntries, filePath) {
  const allPlannedFunctions = getList(functionEntries)
    .map(enrichFunctionEntry)
    .map((entry) => {
      const strategy = getBatchStrategy(entry);
      const priorityScore = getBatchPriorityScore(entry);
      const diagnosis = buildStructuralDiagnosis(entry);

      return {
        ...entry,
        batchKey: strategy.key,
        batchLabel: REFACTOR_BATCH_META[strategy.key]?.label || strategy.key,
        modeLabel: strategy.modeLabel,
        actionLabel: strategy.actionLabel,
        rationale: strategy.rationale,
        preferredPipeline: strategy.pipeline,
        dominantPatternId: strategy.dominantPatternId,
        priorityScore,
        familyLabel: getBatchFamilyLabel(entry),
        diagnosis,
        actionable: isActionableFunction(entry, strategy)
      };
    })
    .sort((left, right) => {
      if (right.priorityScore !== left.priorityScore) {
        return right.priorityScore - left.priorityScore;
      }

      return compareFunctions(left, right);
    });
  const plannedFunctions = allPlannedFunctions.filter((entry) => entry.actionable);
  const eligibleFunctions = plannedFunctions.filter(
    (entry) => entry.batchKey !== "manual-supervision"
  );
  const blockedFunctions = plannedFunctions.filter(
    (entry) => entry.batchKey === "manual-supervision"
  );
  const batches = PLAN_BATCH_ORDER
    .map((batchKey) => {
      const functions = plannedFunctions.filter((entry) => entry.batchKey === batchKey);

      if (!functions.length) {
        return null;
      }

      const families = Array.from(
        functions.reduce((familyMap, entry) => {
          const currentFamily = familyMap.get(entry.familyLabel) || [];
          currentFamily.push(entry.name);
          familyMap.set(entry.familyLabel, currentFamily);
          return familyMap;
        }, new Map()).entries()
      )
        .map(([label, functionNames]) => ({
          label,
          count: functionNames.length,
          functionNames
        }))
        .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));

      return {
        key: batchKey,
        label: REFACTOR_BATCH_META[batchKey].label,
        modeLabel: REFACTOR_BATCH_META[batchKey].modeLabel,
        description: REFACTOR_BATCH_META[batchKey].description,
        functions,
        count: functions.length,
        families
      };
    })
    .filter(Boolean);

  return {
    filePath,
    generatedAt: new Date().toISOString(),
    totalFunctions: allPlannedFunctions.length,
    eligibleFunctions,
    blockedFunctions,
    batches
  };
}

function mergeNoCandidateSignals(functionAnalysis, functionEntry) {
  return {
    ...functionAnalysis,
    name: functionAnalysis?.name || functionEntry?.name,
    start: functionEntry?.start,
    end: functionEntry?.end,
    role: functionEntry?.role || functionAnalysis?.role,
    riskScore: functionEntry?.riskScore || functionAnalysis?.riskScore,
    category: functionEntry?.category || functionAnalysis?.category,
    calledBy: functionEntry?.calledBy || functionAnalysis?.calledBy
  };
}

export function buildNoCandidateClassification(
  functionAnalysis,
  functionEntry,
  remainingMixedZones
) {
  const signals = getStructuralSignals(mergeNoCandidateSignals(functionAnalysis, functionEntry));
  const dominantPattern = getDominantPattern(signals);
  const interventionLabel = dominantPattern?.interventionLabel || "";
  const dominantProblem = dominantPattern?.problemName || "";
  const rootLabel = signals.hiddenInputShape.dominantRoot || "objeto de entrada";

  if (dominantPattern?.id === "shape-first") {
    return {
      mode: "input-normalization",
      dominantProblem,
      suggestedIntervention: interventionLabel,
      message:
        "Nenhum bloco extraivel encontrado. O proximo passo seguro aqui e Input normalization (descriptor extraction).",
      summary:
        `Nenhum bloco extraivel encontrado. A funcao apresenta Shape-based conditional logic e parece inferir casos a partir da estrutura interna de ${rootLabel}. ` +
        `Sugestao: ${interventionLabel}.`,
      safeNextStep: interventionLabel,
      remainingMixedZones
    };
  }

  if (
    dominantPattern?.id === "dependency-first" ||
    dominantPattern?.id === "dependency-surfacing"
  ) {
    return {
      mode: "dependency-injection-surfacing",
      dominantProblem,
      suggestedIntervention: interventionLabel,
      message:
        "Nenhum bloco extraivel encontrado. O proximo passo seguro aqui e Dependency-injection surfacing.",
      summary:
        `Nenhum bloco extraivel encontrado. A funcao ainda depende de ${signals.hiddenInputsCount} hidden input(s) e ${signals.externalReadsCount} leitura(s) externa(s). ` +
        `Sugestao: ${interventionLabel}.`,
      safeNextStep: interventionLabel,
      remainingMixedZones
    };
  }

  if (dominantPattern?.id === "effect-layer-extraction") {
    return {
      mode: "side-effect-isolation",
      dominantProblem,
      suggestedIntervention: interventionLabel,
      message:
        "Nenhum bloco extraivel encontrado. O proximo passo seguro aqui e Side-effect isolation.",
      summary:
        `Nenhum bloco extraivel encontrado. A funcao ainda mistura logica local com ${signals.externalWritesCount} efeito(s) externo(s). ` +
        `Sugestao: ${interventionLabel}.`,
      safeNextStep: interventionLabel,
      remainingMixedZones
    };
  }

  if (
    dominantPattern?.id === "manual-supervision" ||
    dominantPattern?.id === "runtime-boundary-pressure"
  ) {
    return {
      mode: "manual-review",
      dominantProblem,
      suggestedIntervention: interventionLabel,
      message:
        "Nenhum bloco extraivel encontrado. O proximo passo seguro parece ser revisar a borda de runtime manualmente.",
      summary:
        "Nenhum bloco extraivel encontrado nas tres etapas locais. A funcao encosta numa borda de runtime mais sensivel e nao parece uma boa candidata para automacao direta agora.",
      safeNextStep: interventionLabel,
      remainingMixedZones
    };
  }

  return {
    mode: "manual-review",
    dominantProblem,
    suggestedIntervention: interventionLabel,
    message:
      "Nenhum bloco extraivel encontrado. O proximo passo seguro nao parece ser uma extracao automatica.",
    summary:
      "Nenhum bloco extraivel encontrado nas tres etapas locais. O proximo passo seguro nao parece ser pure extraction, dependency-injection surfacing nem side-effect isolation.",
    safeNextStep: interventionLabel === "Keep as is" ? "" : interventionLabel,
    remainingMixedZones
  };
}
