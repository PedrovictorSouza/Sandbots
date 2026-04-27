import { promises as fs } from "node:fs";
import path from "node:path";
import {
  inspectSourceText
} from "./inspect-handler.js";
import {
  buildLocalExtractionPreview
} from "./extract-pure-block-handler.js";
import {
  applyArchitectureAnnotation
} from "./architecture-annotations.js";
import {
  REFACTOR_BATCH_META as SHARED_REFACTOR_BATCH_META,
  SAFE_BATCH_ORDER as SHARED_SAFE_BATCH_ORDER,
  buildRefactorPlan as buildRefactorPlanShared,
  buildStructuralDiagnosis as buildStructuralDiagnosisShared,
  compareFunctions as compareFunctionsShared,
  enrichFunctionEntry as enrichFunctionEntryShared,
  getBatchPriorityScore as getBatchPriorityScoreShared,
  getBatchStrategy as getBatchStrategyShared,
  getDominantStructuralProblem as getDominantStructuralProblemShared,
  getStructuralSignals as getStructuralSignalsShared,
  getSuggestedIntervention as getSuggestedInterventionShared
} from "../refactor/refactor-analysis.js";

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

const REFACTOR_BATCH_META = SHARED_REFACTOR_BATCH_META;

const SAFE_BATCH_ORDER = SHARED_SAFE_BATCH_ORDER;

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

function getRuntimeDependencies(entry) {
  if (entry?.runtimeDirect && Array.isArray(entry.runtimeDirect.signals)) {
    return sortLabels(entry.runtimeDirect.signals);
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

  return dependencies;
}

function getRuntimeDirect(entry) {
  const signals = getRuntimeDependencies(entry);

  return {
    level: String(entry?.runtimeDirect?.level || getRuntimeLevel(signals.length)),
    signals
  };
}

function getReferenceRoot(label) {
  const normalizedLabel = String(label || "")
    .replace(/\?\.\[/g, "[")
    .replace(/\?\./g, ".")
    .trim();
  const match = normalizedLabel.match(/^(this|[A-Za-z_$][A-Za-z0-9_$]*)/);

  return match?.[1] || "";
}

function getExternalCoupling(entry) {
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

function getExternalCouplingCount(entry) {
  const externalCoupling = getExternalCoupling(entry);

  return (
    getCount(externalCoupling.reads) +
    getCount(externalCoupling.calls) +
    getCount(externalCoupling.constants)
  );
}

function isHandlerFunction(entry) {
  return /^(handle[A-Z_]|on[A-Z_])/.test(String(entry?.name || "")) || /Handler$/.test(
    String(entry?.name || "")
  );
}

function isPureFunction(entry) {
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

function getFunctionCategory(entry) {
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

function getRiskScore(entry) {
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

function compareFunctions(left, right) {
  return compareFunctionsShared(left, right);
}

function isHighPriorityRefactorCandidate(entry) {
  const hiddenInputsCount = getCount(entry?.hiddenInputs);
  const externalReadsCount = getCount(entry?.externalReads);
  const runtimeDependenciesCount = getRuntimeDependencies(entry).length;
  const riskScore = getRiskScore(entry);

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

function getFunctionRole(entry) {
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

function getFunctionSourceSpan(entry) {
  const start = Number(entry?.start);
  const end = Number(entry?.end);

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return 0;
  }

  return end - start;
}

function getHiddenInputShapeAnalysis(entry) {
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

function getStructuralSignals(entry) {
  return getStructuralSignalsShared(entry);
}

function getDominantStructuralProblem(entry) {
  return getDominantStructuralProblemShared(entry);
}

function getSuggestedIntervention(entryOrProblem, maybeEntry) {
  return getSuggestedInterventionShared(entryOrProblem, maybeEntry);
}

function buildStructuralDiagnosis(entry) {
  return buildStructuralDiagnosisShared(entry);
}

function isActionableFunction(entry, strategy) {
  if (strategy?.key === "manual-supervision") {
    return true;
  }

  if (
    entry?.riskScore === 0 &&
    entry?.hiddenInputsCount === 0 &&
    entry?.externalReadsCount === 0 &&
    entry?.externalWritesCount === 0 &&
    entry?.runtimeDependenciesCount === 0 &&
    entry?.localCallsCount === 0 &&
    entry?.externalCallsCount === 0
  ) {
    return false;
  }

  if (
    entry?.role === "Utility" &&
    entry?.riskScore <= 4 &&
    getCount(entry?.calledBy) <= 1
  ) {
    return false;
  }

  if (getSuggestedIntervention(entry) === "Keep as is") {
    return false;
  }

  return true;
}

function enrichFunctionEntry(entry) {
  return enrichFunctionEntryShared(entry);
}

function getBatchPriorityScore(entry) {
  return getBatchPriorityScoreShared(entry);
}

function getBatchFamilyLabel(entry) {
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

function getManualSupervisionReasons(entry) {
  const labels = [
    entry?.name,
    ...getList(entry?.runtimeDependencies),
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

function getBatchStrategy(entry) {
  return getBatchStrategyShared(entry);
}

function buildRefactorPlan(functionEntries, filePath) {
  return buildRefactorPlanShared(functionEntries, filePath);
}

function buildPlanFromSource({ sourceText, sourceFilePath }) {
  const inspection = inspectSourceText(sourceText);
  const enrichedFunctions = getList(inspection.functions)
    .map(enrichFunctionEntry)
    .sort(compareFunctions);
  const basePlan = buildRefactorPlan(enrichedFunctions, sourceFilePath);
  const executionPolicy = inspection?.sourceHealth?.requiresManualStop
    ? {
        canExecuteSafeBatches: false,
        stopReason: inspection.sourceHealth.stopReason || "source-compacted",
        reason:
          "Arquivo com compactacao estrutural. Normalize a formatacao antes de aplicar lotes seguros."
      }
    : {
        canExecuteSafeBatches: true,
        stopReason: "",
        reason: ""
      };

  return {
    inspection,
    enrichedFunctions,
    plan: {
      ...basePlan,
      warnings: uniqueStrings([
        ...getList(basePlan?.warnings),
        ...getList(inspection?.warnings)
      ]),
      sourceHealth: inspection?.sourceHealth || null,
      executionPolicy
    }
  };
}

function buildMetricsFromPlan(plan) {
  return {
    totalFunctions: Number(plan?.totalFunctions || 0),
    eligibleFunctions: getCount(plan?.eligibleFunctions),
    blockedFunctions: getCount(plan?.blockedFunctions),
    batchCount: getCount(plan?.batches)
  };
}

function normalizeExecutionOptions(body = {}) {
  const maxIterations = Number.parseInt(String(body?.maxIterations || "10"), 10);
  const maxFunctions = Number.parseInt(String(body?.maxFunctions || "10"), 10);

  return {
    applySafeBatchesOnly: body?.applySafeBatchesOnly !== false,
    maxIterations: Number.isFinite(maxIterations)
      ? Math.min(Math.max(maxIterations, 1), 12)
      : 10,
    maxFunctions: Number.isFinite(maxFunctions)
      ? Math.min(Math.max(maxFunctions, 1), 50)
      : 10,
    stopOnConflict: body?.stopOnConflict !== false,
    requireReviewForManual: body?.requireReviewForManual !== false
  };
}

function getReviewPlan(plan) {
  const blockedBatch = getList(plan?.batches).filter(
    (batch) => batch.key === "manual-supervision"
  );

  return {
    ...plan,
    batches: blockedBatch
  };
}

function serializeExecutionError(functionName, error) {
  const reason = error instanceof Error ? error.message : String(error || "Erro desconhecido.");
  return `${functionName}: ${reason}`;
}

function uniqueStrings(items) {
  return Array.from(new Set(getList(items).filter(Boolean)));
}

async function executeSafeRefactorLoop({
  sourceText,
  sourceFilePath,
  options
}) {
  const initialPlanState = buildPlanFromSource({
    sourceText,
    sourceFilePath
  });
  const executionPolicy = initialPlanState.plan?.executionPolicy;

  if (executionPolicy?.canExecuteSafeBatches === false) {
    return {
      changed: false,
      nextSource: sourceText,
      planBefore: initialPlanState.plan,
      planAfter: initialPlanState.plan,
      report: {
        sourceFilePath,
        iterationsRun: 0,
        stoppedReason: executionPolicy.stopReason || "source-compacted",
        guardMessage: executionPolicy.reason || "",
        appliedBatches: [],
        changedFunctions: [],
        inspectedFunctions: 0,
        maxFunctions: options.maxFunctions,
        blockedFunctions: getList(initialPlanState.plan.blockedFunctions).map((entry) => entry.name),
        conflicts: [],
        appliedSteps: [],
        skippedFunctions: [],
        metricsBefore: buildMetricsFromPlan(initialPlanState.plan),
        metricsAfter: buildMetricsFromPlan(initialPlanState.plan)
      }
    };
  }

  let currentSource = sourceText;
  let iterationsRun = 0;
  let stoppedReason = "no-safe-steps";
  const appliedSteps = [];
  const skippedFunctions = [];
  const conflicts = [];
  const changedFunctionNames = new Set();
  const appliedBatches = new Set();
  let inspectedFunctionsCount = 0;
  let budgetReached = false;

  for (let iteration = 1; iteration <= options.maxIterations; iteration += 1) {
    iterationsRun = iteration;

    const currentPlanState = buildPlanFromSource({
      sourceText: currentSource,
      sourceFilePath
    });
    const batchMap = new Map(
      getList(currentPlanState.plan.batches).map((batch) => [batch.key, batch])
    );
    const iterationChanges = [];

    for (const batchKey of SAFE_BATCH_ORDER) {
      if (budgetReached) {
        break;
      }

      const batch = batchMap.get(batchKey);

      if (!batch) {
        continue;
      }

      for (const plannedEntry of getList(batch.functions)) {
        if (inspectedFunctionsCount >= options.maxFunctions) {
          budgetReached = true;
          stoppedReason = "max-functions";
          break;
        }

        inspectedFunctionsCount += 1;

        try {
          const previewPayload = buildLocalExtractionPreview({
            sourceText: currentSource,
            sourceFilePath,
            functionName: plannedEntry.name,
            includeExecutionArtifacts: true
          });
          const preview = previewPayload.preview;

          if (!preview?.helperSource || !preview?.updatedFunctionSource) {
            skippedFunctions.push({
              iteration,
              batchKey,
              functionName: plannedEntry.name,
              reason: preview?.summary || "Nenhum passo seguro encontrado."
            });
            continue;
          }

          if (previewPayload.nextSource === currentSource) {
            skippedFunctions.push({
              iteration,
              batchKey,
              functionName: plannedEntry.name,
              reason: "Sem alteracao material apos aplicar a proposta."
            });
            continue;
          }

          currentSource = previewPayload.nextSource;
          changedFunctionNames.add(plannedEntry.name);
          appliedBatches.add(batchKey);

          const step = {
            iteration,
            batchKey,
            batchLabel: batch.label,
            functionName: plannedEntry.name,
            mode: preview.mode,
            modeLabel: preview.modeLabel,
            helperName: previewPayload.helperName,
            summary: preview.summary || "",
            actionLabel: plannedEntry.actionLabel
          };

          iterationChanges.push(step);
          appliedSteps.push(step);
        } catch (error) {
          conflicts.push(serializeExecutionError(plannedEntry.name, error));

          if (options.stopOnConflict) {
            stoppedReason = "conflict";
            const finalPlanState = buildPlanFromSource({
              sourceText: currentSource,
              sourceFilePath
            });

            return {
              changed: currentSource !== sourceText,
              nextSource: currentSource,
              planBefore: initialPlanState.plan,
              planAfter: finalPlanState.plan,
              report: {
                sourceFilePath,
                iterationsRun,
                stoppedReason,
                appliedBatches: Array.from(appliedBatches),
                changedFunctions: Array.from(changedFunctionNames),
                inspectedFunctions: inspectedFunctionsCount,
                maxFunctions: options.maxFunctions,
                blockedFunctions: getList(finalPlanState.plan.blockedFunctions).map(
                  (entry) => entry.name
                ),
                conflicts,
                appliedSteps,
                skippedFunctions,
                metricsBefore: buildMetricsFromPlan(initialPlanState.plan),
                metricsAfter: buildMetricsFromPlan(finalPlanState.plan)
              }
            };
          }
        }
      }
    }

    if (budgetReached) {
      break;
    }

    if (!iterationChanges.length) {
      stoppedReason = iteration === 1 ? "no-safe-steps" : "stabilized";
      break;
    }

    if (iteration === options.maxIterations) {
      stoppedReason = "max-iterations";
    }
  }

  const finalPlanState = buildPlanFromSource({
    sourceText: currentSource,
    sourceFilePath
  });

  return {
    changed: currentSource !== sourceText,
    nextSource: currentSource,
    planBefore: initialPlanState.plan,
    planAfter: finalPlanState.plan,
    report: {
      sourceFilePath,
      iterationsRun,
      stoppedReason,
      appliedBatches: Array.from(appliedBatches),
      changedFunctions: Array.from(changedFunctionNames),
      inspectedFunctions: inspectedFunctionsCount,
      maxFunctions: options.maxFunctions,
      blockedFunctions: getList(finalPlanState.plan.blockedFunctions).map(
        (entry) => entry.name
      ),
      conflicts,
      appliedSteps,
      skippedFunctions,
      metricsBefore: buildMetricsFromPlan(initialPlanState.plan),
      metricsAfter: buildMetricsFromPlan(finalPlanState.plan)
    }
  };
}

export function createRefactorFunctionsPostHandler(config = {}) {
  const normalizedConfig = normalizeRefactorConfig(config);

  return async function POST(request) {
    try {
      const body = await request.json().catch(() => ({}));
      const action = String(body?.action || "plan").trim().toLowerCase();
      const script = String(body?.script || "").trim();

      if (!script) {
        return Response.json(
          { status: "error", error: "Campo 'script' ausente." },
          { status: 400 }
        );
      }

      const sourceFilePath = resolveScriptPath(script, normalizedConfig);
      ensureScriptAccess(sourceFilePath, normalizedConfig);
      const sourceText = await fs.readFile(sourceFilePath, "utf8");

      if (action === "plan") {
        const planState = buildPlanFromSource({
          sourceText,
          sourceFilePath
        });

        return Response.json({
          ok: true,
          action,
          plan: planState.plan
        });
      }

      if (action === "review-blocked") {
        const planState = buildPlanFromSource({
          sourceText,
          sourceFilePath
        });

        return Response.json({
          ok: true,
          action,
          plan: getReviewPlan(planState.plan)
        });
      }

      if (action === "execute-safe") {
        const options = normalizeExecutionOptions(body);
        const executionResult = await executeSafeRefactorLoop({
          sourceText,
          sourceFilePath,
          options
        });

        if (executionResult.changed) {
          await fs.writeFile(sourceFilePath, executionResult.nextSource, "utf8");
        }

        return Response.json({
          ok: true,
          action,
          changed: executionResult.changed,
          plan: executionResult.planAfter,
          report: executionResult.report
        });
      }

      if (action === "insert-annotation") {
        const functionName = String(body?.functionName || "").trim();
        const annotationText = String(body?.annotationText || "");

        if (!functionName) {
          return Response.json(
            { status: "error", error: "Campo 'functionName' ausente." },
            { status: 400 }
          );
        }

        if (!annotationText.trim()) {
          return Response.json(
            { status: "error", error: "Architecture annotation vazia." },
            { status: 400 }
          );
        }

        const insertionResult = applyArchitectureAnnotation({
          sourceText,
          functionName,
          annotationText
        });

        await fs.writeFile(sourceFilePath, insertionResult.nextSource, "utf8");

        const planState = buildPlanFromSource({
          sourceText: insertionResult.nextSource,
          sourceFilePath
        });

        return Response.json({
          ok: true,
          action,
          functionName,
          sourceFilePath,
          translatedText: insertionResult.translatedText,
          translatedLines: insertionResult.translatedLines,
          commentBlock: insertionResult.commentBlock,
          plan: planState.plan
        });
      }

      return Response.json(
        {
          status: "error",
          error: `Acao invalida: ${action}.`
        },
        { status: 400 }
      );
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
