import React, { useMemo, useState } from "react";
import {
  REFACTOR_BATCH_META as SHARED_REFACTOR_BATCH_META,
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
import { getArchitectureAnnotationSummary } from "../refactor/architecture-annotations.js";

const DEFAULT_SCRIPT = "packages/pragt-css/src/react/PragtSpecificityTool.jsx";
const SUMMARY_COLUMNS = 7;
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
const CATEGORY_META = {
  runtime: {
    groupLabel: "Runtime",
    badgeLabel: "runtime",
    tone: {
      border: "1px solid rgba(185, 28, 28, 0.18)",
      background: "rgba(254, 226, 226, 0.92)",
      color: "#991b1b"
    },
    groupOrder: 4
  },
  handlers: {
    groupLabel: "Handlers",
    badgeLabel: "handler",
    tone: {
      border: "1px solid rgba(180, 83, 9, 0.18)",
      background: "rgba(255, 237, 213, 0.92)",
      color: "#9a3412"
    },
    groupOrder: 3
  },
  orquestracao: {
    groupLabel: "Orquestracao",
    badgeLabel: "orchestrator",
    tone: {
      border: "1px solid rgba(30, 64, 175, 0.18)",
      background: "rgba(219, 234, 254, 0.92)",
      color: "#1d4ed8"
    },
    groupOrder: 2
  },
  puras: {
    groupLabel: "Puras",
    badgeLabel: "pure",
    tone: {
      border: "1px solid rgba(22, 101, 52, 0.18)",
      background: "rgba(220, 252, 231, 0.92)",
      color: "#166534"
    },
    groupOrder: 1
  },
  prioritarias: {
    groupLabel: "Prioritarias",
    badgeLabel: "priority",
    tone: {
      border: "1px solid rgba(124, 45, 18, 0.18)",
      background: "rgba(254, 215, 170, 0.92)",
      color: "#7c2d12"
    },
    groupOrder: 5
  }
};

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

function getResponsePathname(response) {
  if (!response?.url) {
    return "endpoint desconhecido";
  }

  try {
    return new URL(response.url).pathname || response.url;
  } catch (_error) {
    return response.url;
  }
}

async function readJsonResponse(response) {
  const bodyText = await response.text();

  if (!bodyText.trim()) {
    throw new Error(`O servidor retornou uma resposta vazia em ${getResponsePathname(response)}.`);
  }

  try {
    return JSON.parse(bodyText);
  } catch (_error) {
    const contentType = String(response.headers.get("content-type") || "").toLowerCase();
    const responseKind = contentType.includes("text/html")
      ? "HTML inesperado"
      : "conteudo nao-JSON";

    throw new Error(
      `O servidor retornou ${responseKind} em ${getResponsePathname(response)}.`
    );
  }
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

function enrichFunctionEntry(entry) {
  return enrichFunctionEntryShared(entry);
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

const REFACTOR_BATCH_META = SHARED_REFACTOR_BATCH_META;

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

function getAutomaticModeLabel(entry, preview) {
  if (preview?.modeLabel) {
    return preview.modeLabel;
  }

  return getBatchStrategy(entry).modeLabel;
}

function renderDetailRow(label, items, styles, emptyLabel = "none") {
  const list = getList(items);
  const isEmpty = list.length === 0;

  return (
    <div
      style={{
        ...styles.detailRow,
        ...(isEmpty ? styles.detailRowEmpty : {})
      }}
    >
      <div style={styles.detailHeader}>
        <div style={styles.detailLabel}>{label}</div>
        <span style={styles.detailCount}>{list.length}</span>
      </div>
      <div style={styles.detailValue}>
        {list.length ? (
          <ul style={styles.detailList}>
            {list.map((item, index) => (
              <li key={`${label}-${item}-${index}`} style={styles.detailListItem}>
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <span style={styles.emptyChip}>{emptyLabel}</span>
        )}
      </div>
    </div>
  );
}

function getRowKey(entry) {
  return `${entry.name}-${entry.start ?? "na"}-${entry.end ?? "na"}`;
}

function getExtractionStateKey(entryOrName) {
  return typeof entryOrName === "string"
    ? String(entryOrName || "")
    : String(entryOrName?.name || "");
}

function getCandidateLineLabel(candidate) {
  const startLine = Number(candidate?.startLine || 0) || null;
  const endLine = Number(candidate?.endLine || 0) || null;

  if (startLine && endLine && startLine !== endLine) {
    return `${startLine}-${endLine}`;
  }

  if (startLine) {
    return String(startLine);
  }

  return "n/a";
}

function getCandidateRiskTone(risk) {
  const normalizedRisk = String(risk || "").trim().toLowerCase();

  if (normalizedRisk === "low" || normalizedRisk === "baixo") {
    return {
      border: "1px solid rgba(22, 101, 52, 0.16)",
      background: "rgba(220, 252, 231, 0.9)",
      color: "#166534",
      label: "baixo"
    };
  }

  if (normalizedRisk === "medium" || normalizedRisk === "med" || normalizedRisk === "medio") {
    return {
      border: "1px solid rgba(180, 83, 9, 0.16)",
      background: "rgba(255, 237, 213, 0.9)",
      color: "#9a3412",
      label: "medio"
    };
  }

  if (normalizedRisk === "high" || normalizedRisk === "alto") {
    return {
      border: "1px solid rgba(185, 28, 28, 0.16)",
      background: "rgba(254, 226, 226, 0.9)",
      color: "#991b1b",
      label: "alto"
    };
  }

  return {
    border: "1px solid rgba(17, 17, 17, 0.12)",
    background: "#f5f5f5",
    color: "#444",
    label: normalizedRisk || "review"
  };
}

function getProgressMetricValue(value, fallback = "n/a") {
  return Number.isFinite(value) ? value : fallback;
}

function getDefaultExtractState() {
  return {
    status: "idle",
    preview: null,
    message: "",
    error: "",
    originalComplexity: null,
    appliedCount: 0,
    latestComplexity: null,
    timeline: [],
    lastAppliedPatch: null,
    analysisVersion: 0
  };
}

function createTimelineEntry(label, tone = "neutral") {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label,
    tone
  };
}

function appendTimelineEntries(currentTimeline, nextEntries) {
  const safeCurrentTimeline = Array.isArray(currentTimeline) ? currentTimeline : [];
  const safeNextEntries = Array.isArray(nextEntries) ? nextEntries.filter(Boolean) : [];

  if (!safeNextEntries.length) {
    return safeCurrentTimeline;
  }

  const existingLabels = new Set(safeCurrentTimeline.map((entry) => entry?.label).filter(Boolean));
  const uniqueEntries = safeNextEntries.filter((entry) => {
    if (!entry?.label || existingLabels.has(entry.label)) {
      return false;
    }

    existingLabels.add(entry.label);
    return true;
  });

  return [...safeCurrentTimeline, ...uniqueEntries];
}

function buildExplicitDependencyTimelineLabel(inputsUsed) {
  const inputs = getList(inputsUsed);

  if (!inputs.length) {
    return "";
  }

  if (inputs.length === 1) {
    return `explicit dependency for ${inputs[0]}`;
  }

  return `explicit dependencies for ${inputs.join(", ")}`;
}

function buildRefactorTimelineEntries({
  helperName,
  inputsUsed,
  nextSafeExtraction,
  isStabilized
}) {
  const entries = [];

  if (helperName) {
    entries.push(createTimelineEntry(`extracted ${helperName}`, "success"));
  }

  const dependencyLabel = buildExplicitDependencyTimelineLabel(inputsUsed);

  if (dependencyLabel) {
    entries.push(createTimelineEntry(dependencyLabel, "info"));
  }

  if (nextSafeExtraction) {
    entries.push(createTimelineEntry(`next safe extraction: ${nextSafeExtraction}`, "neutral"));
  }

  if (isStabilized) {
    entries.push(createTimelineEntry("remaining core handler stabilized", "neutral"));
  }

  return entries;
}

function getTimelineEntryToneStyles(tone) {
  if (tone === "success") {
    return {
      border: "1px solid rgba(22, 101, 52, 0.18)",
      background: "rgba(220, 252, 231, 0.92)",
      color: "#166534"
    };
  }

  if (tone === "info") {
    return {
      border: "1px solid rgba(30, 64, 175, 0.18)",
      background: "rgba(219, 234, 254, 0.92)",
      color: "#1d4ed8"
    };
  }

  return {
    border: "1px solid rgba(17,17,17,0.08)",
    background: "#f5f5f5",
    color: "#333"
  };
}

function formatRuntimeSummary(entry) {
  if (!entry.runtimeDependenciesCount) {
    return <span style={{ ...stylesForRuntime.none }}>none</span>;
  }

  const visibleDependencies = entry.runtimeDirect.signals.slice(0, 2);
  const hiddenCount = entry.runtimeDirect.signals.length - visibleDependencies.length;

  return {
    visibleDependencies,
    hiddenCount
  };
}

const stylesForRuntime = {
  none: {
    color: "#767676",
    fontStyle: "italic",
    fontSize: 12
  }
};

export default function PragtInspector({ defaultScript = DEFAULT_SCRIPT }) {
  const [script, setScript] = useState(defaultScript);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [expandedRows, setExpandedRows] = useState({});
  const [extractStates, setExtractStates] = useState({});
  const [batchPlan, setBatchPlan] = useState(null);
  const [planView, setPlanView] = useState("all");
  const [refactorActionStatus, setRefactorActionStatus] = useState("idle");
  const [refactorActionError, setRefactorActionError] = useState("");
  const [executionReport, setExecutionReport] = useState(null);
  const [annotationStates, setAnnotationStates] = useState({});

  const styles = {
    container: {
      display: "grid",
      gap: 12,
      width: "100%",
      minWidth: 0,
      fontFamily: "system-ui, sans-serif",
      color: "#111"
    },
    inputRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
      alignItems: "center"
    },
    input: {
      flex: "1 1 320px",
      minWidth: 0,
      padding: "10px 12px",
      border: "2px solid #d4d4d8",
      borderRadius: 6,
      background: "#fff"
    },
    searchInput: {
      flex: "1 1 240px",
      minWidth: 0,
      padding: "10px 12px",
      border: "2px solid #d4d4d8",
      borderRadius: 6,
      background: "#fff"
    },
    button: {
      padding: "8px 12px",
      border: "2px solid #111",
      background: "#111",
      color: "#fff",
      fontWeight: 800,
      borderRadius: 6,
      cursor: "pointer"
    },
    summaryTitle: {
      margin: 0,
      fontSize: 18,
      fontWeight: 800,
      color: "#111"
    },
    groupsCard: {
      display: "grid",
      gap: 12,
      padding: 12,
      borderRadius: 8,
      border: "1px solid rgba(17,17,17,0.08)",
      background: "#fff",
      minWidth: 0
    },
    groupsHeader: {
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12
    },
    groupsHeaderMain: {
      display: "grid",
      gap: 10,
      flex: "1 1 320px",
      minWidth: 0
    },
    groupsHeaderSide: {
      display: "grid",
      gap: 8,
      flex: "1 1 260px",
      minWidth: 0,
      justifyItems: "end"
    },
    filterRow: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 8
    },
    filterButton: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 10px",
      borderRadius: 999,
      border: "1px solid rgba(17,17,17,0.12)",
      background: "#f5f5f5",
      color: "#444",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer"
    },
    activeFilterButton: {
      border: "1px solid #111",
      background: "#111",
      color: "#fff"
    },
    filterCount: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: 22,
      height: 22,
      padding: "0 6px",
      borderRadius: 999,
      background: "rgba(255,255,255,0.18)",
      color: "inherit",
      fontSize: 11,
      fontWeight: 800
    },
    inactiveFilterCount: {
      background: "rgba(17,17,17,0.08)"
    },
    tableHeader: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 8
    },
    tableHeaderMain: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 8,
      flex: "1 1 auto",
      minWidth: 0
    },
    tableTitle: {
      margin: 0,
      fontSize: 15,
      fontWeight: 800,
      color: "#111"
    },
    tableCount: {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 8px",
      borderRadius: 999,
      background: "#f4f4f5",
      color: "#444",
      fontSize: 12,
      fontWeight: 700
    },
    planButton: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "7px 10px",
      borderRadius: 999,
      border: "1px solid rgba(17,17,17,0.14)",
      background: "#f5f5f5",
      color: "#222",
      fontSize: 12,
      fontWeight: 800,
      cursor: "pointer"
    },
    buttonStack: {
      display: "grid",
      gap: 4,
      alignItems: "start"
    },
    actionButtonRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
      alignItems: "center"
    },
    buttonSubtext: {
      fontSize: 11,
      color: "#666",
      lineHeight: 1.35
    },
    planCard: {
      display: "grid",
      gap: 12,
      padding: 12,
      borderRadius: 10,
      border: "1px solid rgba(17,17,17,0.08)",
      background: "#fafafa"
    },
    planHeader: {
      display: "grid",
      gap: 4
    },
    planTitle: {
      margin: 0,
      fontSize: 14,
      fontWeight: 800,
      color: "#111"
    },
    planSubtitle: {
      fontSize: 13,
      color: "#666"
    },
    planSummaryGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
      gap: 10
    },
    planMetric: {
      display: "grid",
      gap: 4,
      padding: 10,
      borderRadius: 8,
      border: "1px solid rgba(17,17,17,0.08)",
      background: "#fff"
    },
    planMetricLabel: {
      fontSize: 11,
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: "0.03em",
      color: "#666"
    },
    planMetricValue: {
      fontSize: 18,
      fontWeight: 800,
      color: "#111",
      fontVariantNumeric: "tabular-nums"
    },
    batchList: {
      display: "grid",
      gap: 10
    },
    batchCard: {
      display: "grid",
      gap: 10,
      padding: 12,
      borderRadius: 10,
      border: "1px solid rgba(17,17,17,0.08)",
      background: "#fff"
    },
    batchHeader: {
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 10
    },
    batchHeaderMain: {
      display: "grid",
      gap: 6,
      minWidth: 0
    },
    batchTitleRow: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 8
    },
    batchTitle: {
      margin: 0,
      fontSize: 14,
      fontWeight: 800,
      color: "#111"
    },
    batchBadge: {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 8px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 800
    },
    batchDescription: {
      fontSize: 13,
      color: "#555"
    },
    batchMeta: {
      fontSize: 12,
      fontWeight: 700,
      color: "#666"
    },
    familyRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8
    },
    familyChip: {
      display: "inline-flex",
      alignItems: "center",
      padding: "5px 9px",
      borderRadius: 999,
      border: "1px solid rgba(17,17,17,0.08)",
      background: "#f5f5f5",
      color: "#444",
      fontSize: 12,
      fontWeight: 700
    },
    planFunctionList: {
      display: "grid",
      gap: 8
    },
    planFunctionRow: {
      display: "grid",
      gap: 6,
      padding: 10,
      borderRadius: 8,
      border: "1px solid rgba(17,17,17,0.08)",
      background: "#fcfcfc"
    },
    planFunctionHeader: {
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 8
    },
    planFunctionName: {
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      fontSize: 13,
      fontWeight: 800,
      color: "#111"
    },
    planFunctionMeta: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
      alignItems: "center"
    },
    planFunctionReason: {
      fontSize: 12,
      color: "#555",
      lineHeight: 1.45
    },
    planFunctionActions: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
      alignItems: "center"
    },
    reportCard: {
      display: "grid",
      gap: 12,
      padding: 12,
      borderRadius: 10,
      border: "1px solid rgba(17,17,17,0.08)",
      background: "#fafafa"
    },
    reportHeader: {
      display: "grid",
      gap: 4
    },
    reportTitle: {
      margin: 0,
      fontSize: 14,
      fontWeight: 800,
      color: "#111"
    },
    reportSubtitle: {
      fontSize: 13,
      color: "#666"
    },
    reportGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
      gap: 10
    },
    reportMetric: {
      display: "grid",
      gap: 4,
      padding: 10,
      borderRadius: 8,
      border: "1px solid rgba(17,17,17,0.08)",
      background: "#fff"
    },
    reportMetricLabel: {
      fontSize: 11,
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: "0.03em",
      color: "#666"
    },
    reportMetricValue: {
      fontSize: 17,
      fontWeight: 800,
      color: "#111",
      fontVariantNumeric: "tabular-nums"
    },
    reportSection: {
      display: "grid",
      gap: 8
    },
    reportList: {
      margin: 0,
      paddingLeft: 18,
      display: "grid",
      gap: 6
    },
    reportListItem: {
      fontSize: 12,
      color: "#222",
      overflowWrap: "anywhere"
    },
    smallButton: {
      padding: "6px 10px",
      borderRadius: 999,
      border: "1px solid rgba(17,17,17,0.12)",
      background: "#fff",
      color: "#222",
      fontSize: 12,
      fontWeight: 800,
      cursor: "pointer"
    },
    tableViewport: {
      minWidth: 0,
      maxHeight: "min(72vh, calc(100vh - 340px))",
      overflowY: "auto",
      overscrollBehavior: "contain",
      overflowX: "auto",
      border: "1px solid rgba(17,17,17,0.08)",
      borderRadius: 10,
      background: "#fff"
    },
    table: {
      width: "100%",
      minWidth: 760,
      borderCollapse: "separate",
      borderSpacing: 0
    },
    headCell: {
      position: "sticky",
      top: 0,
      zIndex: 1,
      padding: "10px 12px",
      textAlign: "left",
      borderBottom: "1px solid rgba(17,17,17,0.12)",
      background: "#f7f7f7",
      color: "#444",
      fontSize: 12,
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: "0.03em",
      whiteSpace: "nowrap"
    },
    row: {
      cursor: "pointer"
    },
    summaryCell: {
      padding: "10px 12px",
      borderBottom: "1px solid rgba(17,17,17,0.06)",
      verticalAlign: "middle",
      fontSize: 13,
      color: "#222",
      background: "#fff"
    },
    expandedSummaryCell: {
      background: "#fafafa"
    },
    nameCell: {
      minWidth: 260
    },
    nameButton: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      width: "100%",
      padding: 0,
      border: 0,
      background: "transparent",
      textAlign: "left",
      cursor: "pointer",
      color: "inherit",
      font: "inherit"
    },
    chevron: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 18,
      color: "#666",
      fontSize: 12,
      fontWeight: 800,
      flex: "0 0 auto"
    },
    functionName: {
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      fontSize: 14,
      fontWeight: 800,
      color: "#111",
      overflowWrap: "anywhere"
    },
    countCell: {
      textAlign: "center",
      fontVariantNumeric: "tabular-nums",
      fontWeight: 700,
      minWidth: 72
    },
    scoreCell: {
      textAlign: "center",
      fontVariantNumeric: "tabular-nums",
      fontWeight: 800,
      minWidth: 78
    },
    roleCell: {
      minWidth: 148
    },
    roleBadge: {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 8px",
      borderRadius: 999,
      background: "#f4f4f5",
      color: "#333",
      fontSize: 12,
      fontWeight: 800,
      whiteSpace: "nowrap"
    },
    callsCell: {
      textAlign: "center",
      fontVariantNumeric: "tabular-nums",
      fontWeight: 700,
      minWidth: 132,
      whiteSpace: "nowrap"
    },
    runtimeCell: {
      minWidth: 180
    },
    runtimeSummary: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
      alignItems: "center"
    },
    runtimeChip: {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 8px",
      borderRadius: 999,
      background: "#f4f4f5",
      color: "#333",
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      fontSize: 12,
      fontWeight: 700
    },
    runtimeOverflow: {
      color: "#666",
      fontSize: 12,
      fontWeight: 700
    },
    detailRowCell: {
      padding: 0,
      background: "#fafafa",
      borderBottom: "1px solid rgba(17,17,17,0.08)"
    },
    detailPanel: {
      display: "grid",
      gap: 10,
      padding: 12,
      gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
      alignItems: "start"
    },
    diagnosisCard: {
      display: "grid",
      gap: 8,
      padding: 10,
      borderRadius: 10,
      border: "1px solid rgba(17,17,17,0.08)",
      background: "#fff",
      alignSelf: "start"
    },
    diagnosisTitle: {
      margin: 0,
      fontSize: 13,
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: "0.03em",
      color: "#444"
    },
    diagnosisMeta: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
      gap: 8
    },
    diagnosisBody: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: 8,
      alignItems: "start"
    },
    diagnosisLine: {
      display: "grid",
      gap: 3,
      alignContent: "start",
      padding: "8px 10px",
      borderRadius: 8,
      border: "1px solid rgba(17,17,17,0.06)",
      background: "#fafafa",
      fontSize: 13,
      color: "#222"
    },
    diagnosisKey: {
      fontSize: 11,
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: "0.03em",
      color: "#666"
    },
    diagnosisValue: {
      fontWeight: 700,
      color: "#111"
    },
    detailGrid: {
      display: "grid",
      gap: 8,
      gridColumn: "1 / -1",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      alignItems: "start",
      gridAutoFlow: "row dense"
    },
    extractSection: {
      display: "grid",
      gap: 10,
      padding: 10,
      borderRadius: 10,
      border: "1px solid rgba(17,17,17,0.08)",
      background: "#fff",
      minWidth: 0
    },
    extractHeader: {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr) auto",
      alignItems: "flex-start",
      gap: 10
    },
    extractHeaderMain: {
      display: "grid",
      gap: 5,
      minWidth: 0
    },
    extractTitle: {
      margin: 0,
      fontSize: 13,
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: "0.03em",
      color: "#444"
    },
    extractCount: {
      fontSize: 12,
      fontWeight: 700,
      lineHeight: 1.35,
      color: "#222"
    },
    extractSummary: {
      fontSize: 12,
      lineHeight: 1.45,
      color: "#222"
    },
    extractInfoGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: 8,
      alignItems: "start",
      gridAutoFlow: "row dense"
    },
    progressCard: {
      display: "grid",
      gap: 8,
      padding: 10,
      borderRadius: 10,
      border: "1px solid rgba(17,17,17,0.08)",
      background: "#fafafa"
    },
    progressTitle: {
      margin: 0,
      fontSize: 13,
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: "0.03em",
      color: "#444"
    },
    progressGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
      gap: 8
    },
    progressMetric: {
      display: "grid",
      gap: 3,
      padding: "8px 10px",
      borderRadius: 8,
      border: "1px solid rgba(17,17,17,0.06)",
      background: "#fff"
    },
    progressMetricLabel: {
      fontSize: 11,
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: "0.03em",
      color: "#666"
    },
    progressMetricValue: {
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      fontSize: 13,
      fontWeight: 800,
      color: "#111",
      overflowWrap: "anywhere"
    },
    statusCard: {
      display: "grid",
      gap: 8,
      padding: 10,
      borderRadius: 10,
      border: "1px solid rgba(17,17,17,0.08)",
      background: "#fff",
      minWidth: 0
    },
    statusTitle: {
      margin: 0,
      fontSize: 13,
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: "0.03em",
      color: "#444"
    },
    statusGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(96px, 1fr))",
      gap: 8
    },
    statusMetric: {
      display: "grid",
      gap: 3,
      padding: "8px 10px",
      borderRadius: 8,
      border: "1px solid rgba(17,17,17,0.06)",
      background: "#fafafa"
    },
    statusMetricLabel: {
      fontSize: 11,
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: "0.03em",
      color: "#666"
    },
    statusMetricValue: {
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      fontSize: 13,
      fontWeight: 800,
      color: "#111",
      overflowWrap: "anywhere"
    },
    timelineCard: {
      display: "grid",
      gap: 8,
      padding: 10,
      borderRadius: 10,
      border: "1px solid rgba(17,17,17,0.08)",
      background: "#fff"
    },
    timelineTitle: {
      margin: 0,
      fontSize: 13,
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: "0.03em",
      color: "#444"
    },
    timelineList: {
      margin: 0,
      padding: 0,
      listStyle: "none",
      display: "flex",
      flexWrap: "wrap",
      gap: 6
    },
    timelineListItem: {
      listStyle: "none"
    },
    timelineChip: {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 8px",
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 700,
      overflowWrap: "anywhere"
    },
    extractActions: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 8,
      justifyContent: "flex-end",
      justifySelf: "end"
    },
    secondaryButton: {
      padding: "8px 12px",
      border: "1px solid rgba(17,17,17,0.14)",
      background: "#fff",
      color: "#111",
      fontWeight: 800,
      borderRadius: 6,
      cursor: "pointer"
    },
    subtleButton: {
      padding: "8px 12px",
      border: "1px solid rgba(17,17,17,0.1)",
      background: "#f5f5f5",
      color: "#444",
      fontWeight: 800,
      borderRadius: 6,
      cursor: "pointer"
    },
    buttonDisabled: {
      opacity: 0.55,
      cursor: "not-allowed"
    },
    extractCandidateGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: 8
    },
    extractCandidateCard: {
      display: "grid",
      gap: 6,
      padding: 10,
      borderRadius: 10,
      border: "1px solid rgba(17,17,17,0.08)",
      background: "#fafafa"
    },
    extractSelectedCandidateCard: {
      border: "1px solid rgba(17,17,17,0.18)",
      background: "#f5f5f5"
    },
    extractCandidateHeader: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 8
    },
    extractCandidateName: {
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      fontSize: 13,
      fontWeight: 800,
      color: "#111",
      overflowWrap: "anywhere"
    },
    extractChipRow: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 6
    },
    extractChip: {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 8px",
      borderRadius: 999,
      background: "#f4f4f5",
      color: "#333",
      fontSize: 12,
      fontWeight: 700
    },
    extractCandidateReason: {
      fontSize: 13,
      color: "#333"
    },
    extractDiff: {
      margin: 0,
      padding: 12,
      borderRadius: 8,
      border: "1px solid rgba(17,17,17,0.08)",
      background: "#111",
      color: "#f5f5f5",
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      fontSize: 12,
      lineHeight: 1.55,
      overflowX: "auto",
      overflowY: "auto",
      maxHeight: 220,
      whiteSpace: "pre"
    },
    extractPreviewGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: 10
    },
    extractPreviewPanel: {
      display: "grid",
      gap: 6,
      minWidth: 0
    },
    extractPreviewLabel: {
      fontSize: 11,
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: "0.03em",
      color: "#666"
    },
    annotationSection: {
      display: "grid",
      gap: 8,
      padding: 10,
      borderRadius: 10,
      border: "1px solid rgba(17,17,17,0.08)",
      background: "#fff",
      minWidth: 0,
      alignSelf: "start"
    },
    annotationHeader: {
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 10
    },
    annotationTitle: {
      margin: 0,
      fontSize: 13,
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: "0.03em",
      color: "#444"
    },
    annotationHint: {
      fontSize: 12,
      lineHeight: 1.45,
      color: "#666"
    },
    annotationTextarea: {
      width: "100%",
      minHeight: 96,
      resize: "vertical",
      padding: "10px 12px",
      borderRadius: 8,
      border: "1px solid rgba(17,17,17,0.12)",
      background: "#fafafa",
      color: "#111",
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      fontSize: 12,
      lineHeight: 1.5,
      boxSizing: "border-box"
    },
    detailRow: {
      display: "grid",
      gap: 8,
      minWidth: 0,
      alignContent: "start",
      alignSelf: "start",
      padding: "10px 12px",
      borderRadius: 8,
      border: "1px solid rgba(17,17,17,0.08)",
      background: "#fff"
    },
    detailRowEmpty: {
      background: "#fcfcfc"
    },
    detailHeader: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      minWidth: 0
    },
    detailLabel: {
      fontSize: 11,
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: "0.03em",
      color: "#666"
    },
    detailCount: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: 22,
      padding: "2px 7px",
      borderRadius: 999,
      border: "1px solid rgba(17,17,17,0.08)",
      background: "#f4f4f5",
      color: "#333",
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      fontSize: 11,
      fontWeight: 800,
      lineHeight: 1
    },
    detailValue: {
      minWidth: 0
    },
    detailList: {
      margin: 0,
      padding: 0,
      listStyle: "none",
      display: "flex",
      flexWrap: "wrap",
      gap: 6
    },
    detailListItem: {
      display: "inline-flex",
      alignItems: "center",
      maxWidth: "100%",
      padding: "4px 8px",
      borderRadius: 999,
      border: "1px solid rgba(17,17,17,0.06)",
      background: "#f4f4f5",
      color: "#222",
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      fontSize: 11,
      lineHeight: 1.3,
      overflowWrap: "anywhere"
    },
    emptyValue: {
      color: "#767676",
      fontStyle: "italic",
      fontSize: 13
    },
    emptyChip: {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 8px",
      borderRadius: 999,
      border: "1px solid rgba(17,17,17,0.06)",
      background: "#f7f7f7",
      color: "#767676",
      fontSize: 12,
      fontStyle: "italic"
    },
    hintCard: {
      display: "grid",
      alignContent: "start",
      padding: "10px 12px",
      borderRadius: 10,
      border: "1px solid rgba(17,17,17,0.08)",
      background: "#fafafa",
      fontSize: 12,
      lineHeight: 1.45,
      color: "#666",
      minWidth: 0
    },
    warningBox: {
      padding: "10px 12px",
      borderRadius: 8,
      border: "1px solid #f59e0b",
      background: "rgba(245, 158, 11, 0.08)",
      color: "#92400e",
      fontSize: 13
    },
    successBox: {
      padding: "10px 12px",
      borderRadius: 8,
      border: "1px solid rgba(22, 101, 52, 0.2)",
      background: "rgba(220, 252, 231, 0.92)",
      color: "#166534",
      fontSize: 13
    },
    errorBox: {
      padding: "10px 12px",
      borderRadius: 8,
      border: "1px solid #dc2626",
      background: "rgba(220, 38, 38, 0.08)",
      color: "#991b1b",
      fontSize: 13
    },
    hint: {
      fontSize: 13,
      color: "#666"
    }
  };

  const allFunctions = useMemo(() => {
    const functions = Array.isArray(result?.functions) ? result.functions : [];

    if (!functions.length) {
      return [];
    }

    return functions.map(enrichFunctionEntry).sort(compareFunctions);
  }, [result]);

  const searchedFunctions = useMemo(() => {
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    if (!allFunctions.length) {
      return [];
    }

    return allFunctions.filter(
      (entry) =>
        !normalizedSearchQuery ||
        String(entry.name || "").toLowerCase().includes(normalizedSearchQuery)
    );
  }, [allFunctions, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts = {
      runtime: 0,
      handlers: 0,
      orquestracao: 0,
      puras: 0,
      prioritarias: 0
    };

    searchedFunctions.forEach((entry) => {
      if (counts[entry.category] !== undefined) {
        counts[entry.category] += 1;
      }

      if (entry.isHighPriorityRefactor) {
        counts.prioritarias += 1;
      }
    });

    return counts;
  }, [searchedFunctions]);

  const visibleFunctions = useMemo(() => {
    if (activeCategory === "all") {
      return searchedFunctions;
    }

    if (activeCategory === "prioritarias") {
      return searchedFunctions.filter((entry) => entry.isHighPriorityRefactor);
    }

    return searchedFunctions.filter((entry) => entry.category === activeCategory);
  }, [activeCategory, searchedFunctions]);
  const visibleCategoryMeta =
    activeCategory === "all"
      ? null
      : CATEGORY_META[activeCategory] || CATEGORY_META.prioritarias;
  const filterOptions = [
    { key: "all", label: "Todas", count: searchedFunctions.length },
    { key: "handlers", label: CATEGORY_META.handlers.groupLabel, count: categoryCounts.handlers },
    { key: "runtime", label: CATEGORY_META.runtime.groupLabel, count: categoryCounts.runtime },
    {
      key: "orquestracao",
      label: CATEGORY_META.orquestracao.groupLabel,
      count: categoryCounts.orquestracao
    },
    { key: "puras", label: CATEGORY_META.puras.groupLabel, count: categoryCounts.puras },
    {
      key: "prioritarias",
      label: CATEGORY_META.prioritarias.groupLabel,
      count: categoryCounts.prioritarias
    }
  ];
  const visiblePlanBatches = useMemo(() => {
    const batches = getList(batchPlan?.batches);

    if (planView === "blocked") {
      return batches.filter((batch) => batch.key === "manual-supervision");
    }

    return batches;
  }, [batchPlan, planView]);

  function toggleRow(rowKey) {
    setExpandedRows((currentRows) => ({
      ...currentRows,
      [rowKey]: !currentRows[rowKey]
    }));
  }

  function updateExtractState(functionName, nextValue) {
    setExtractStates((currentStates) => {
      const currentState = currentStates[functionName] || getDefaultExtractState();
      const resolvedState =
        typeof nextValue === "function"
          ? nextValue(currentState)
          : { ...currentState, ...nextValue };

      return {
        ...currentStates,
        [functionName]: resolvedState
      };
    });
  }

  function clearExtractState(functionName) {
    setExtractStates((currentStates) => {
      const nextStates = { ...currentStates };
      delete nextStates[functionName];
      return nextStates;
    });
  }

  function getAnnotationState(functionName, fallbackText = "") {
    const currentState = annotationStates[functionName];

    if (currentState) {
      return currentState;
    }

    return {
      draft: fallbackText,
      status: "idle",
      message: "",
      error: ""
    };
  }

  function updateAnnotationState(functionName, nextValue) {
    setAnnotationStates((currentStates) => {
      const currentState = currentStates[functionName] || {
        draft: "",
        status: "idle",
        message: "",
        error: ""
      };
      const resolvedState =
        typeof nextValue === "function"
          ? nextValue(currentState)
          : { ...currentState, ...nextValue };

      return {
        ...currentStates,
        [functionName]: resolvedState
      };
    });
  }

  async function fetchExtractionPreviewPayload(functionName) {
    const response = await fetch("/api/pragt/extract-pure-block", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        operation: "preview",
        script,
        functionName
      })
    });
    const json = await readJsonResponse(response);

    if (!response.ok || json?.status === "error") {
      throw new Error(json?.error || "Nao foi possivel gerar a proposta de extracao.");
    }

    return json;
  }

  async function inspectScript(nextScript, options = {}) {
    const { resetView = false, expandedFunctionName = "" } = options;

    setLoading(true);
    setError("");

    if (resetView) {
      setResult(null);
      setExpandedRows({});
      setActiveCategory("all");
      setExtractStates({});
      setAnnotationStates({});
      setBatchPlan(null);
      setPlanView("all");
      setRefactorActionError("");
      setExecutionReport(null);
    }

    try {
      const response = await fetch("/api/pragt/inspect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ script: nextScript })
      });
      const json = await readJsonResponse(response);

      if (!response.ok || json?.status === "error") {
        setError(json?.error || "Nao foi possivel parsear o arquivo.");
        return null;
      }

      setResult(json);
      setBatchPlan(null);
      setPlanView("all");
      if (expandedFunctionName) {
        const nextExpandedEntry = getList(json?.functions).find(
          (entry) => entry?.name === expandedFunctionName
        );

        if (nextExpandedEntry) {
          setExpandedRows({
            [getRowKey(nextExpandedEntry)]: true
          });
        } else {
          setExpandedRows({});
        }
      }

      return json;
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Erro desconhecido.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function handleInspect() {
    await inspectScript(script, { resetView: true });
  }

  async function requestRefactorAction(action, extraBody = {}) {
    const response = await fetch("/api/pragt/refactor-functions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action,
        script,
        ...extraBody
      })
    });
    const json = await readJsonResponse(response);

    if (!response.ok || json?.status === "error") {
      throw new Error(json?.error || "Nao foi possivel executar a acao de refatoracao.");
    }

    return json;
  }

  async function handleGenerateBatchPlan() {
    setRefactorActionStatus("planning");
    setRefactorActionError("");

    try {
      const json = await requestRefactorAction("plan");
      setBatchPlan(json.plan || buildRefactorPlan(allFunctions, result?.filePath || result?.script || script));
      setPlanView("all");
      setExecutionReport(null);
    } catch (actionError) {
      setRefactorActionError(
        actionError instanceof Error
          ? actionError.message
          : "Nao foi possivel gerar o plano de refatoracao."
      );
    } finally {
      setRefactorActionStatus("idle");
    }
  }

  async function handleReviewBlocked() {
    setRefactorActionStatus("reviewing");
    setRefactorActionError("");

    try {
      const json = await requestRefactorAction("review-blocked");
      setBatchPlan(json.plan || null);
      setPlanView("blocked");
      setExecutionReport(null);
    } catch (actionError) {
      setRefactorActionError(
        actionError instanceof Error
          ? actionError.message
          : "Nao foi possivel carregar os bloqueios para revisao."
      );
    } finally {
      setRefactorActionStatus("idle");
    }
  }

  async function handleExecuteSafeRefactor() {
    setRefactorActionStatus("executing");
    setRefactorActionError("");

    try {
      const json = await requestRefactorAction("execute-safe", {
        maxIterations: 10,
        maxFunctions: 10,
        stopOnConflict: true,
        requireReviewForManual: true
      });

      if (json.changed) {
        await inspectScript(script, { resetView: false });
      }

      setBatchPlan(json.plan || null);
      setPlanView("all");
      setExecutionReport(json.report || null);
    } catch (actionError) {
      setRefactorActionError(
        actionError instanceof Error
          ? actionError.message
          : "Nao foi possivel executar a refatoracao segura."
      );
    } finally {
      setRefactorActionStatus("idle");
    }
  }

  async function handleInsertArchitectureAnnotation(entry) {
    const functionName = getExtractionStateKey(entry);
    const fallbackText = entry?.architectureAnnotation?.text || "";
    const currentState = getAnnotationState(functionName, fallbackText);
    const draft = String(currentState.draft || fallbackText || "");

    if (!draft.trim()) {
      updateAnnotationState(functionName, {
        draft,
        status: "error",
        message: "",
        error: "Architecture annotation vazia."
      });
      return;
    }

    updateAnnotationState(functionName, {
      draft,
      status: "saving",
      message: "",
      error: ""
    });

    try {
      const json = await requestRefactorAction("insert-annotation", {
        functionName: entry.name,
        annotationText: draft
      });

      await inspectScript(script, {
        resetView: false,
        expandedFunctionName: entry.name
      });

      updateAnnotationState(functionName, {
        draft: json?.translatedText || draft,
        status: "saved",
        message: "Annotation traduzida para ingles e inserida acima da funcao.",
        error: ""
      });
      setBatchPlan(json.plan || null);
      setPlanView("all");
    } catch (annotationError) {
      updateAnnotationState(functionName, {
        draft,
        status: "error",
        message: "",
        error:
          annotationError instanceof Error
            ? annotationError.message
            : "Nao foi possivel inserir a architecture annotation."
      });
    }
  }

  function handleFocusPlannedFunction(entry) {
    const rowKey = getRowKey(entry);

    setSearchQuery("");
    setActiveCategory("all");
    setExpandedRows({
      [rowKey]: true
    });
  }

  async function handlePreviewExtraction(entry) {
    const functionName = getExtractionStateKey(entry);

    updateExtractState(functionName, {
      status: "loading",
      preview: null,
      message: "",
      error: "",
      originalComplexity:
        extractStates[functionName]?.originalComplexity ?? entry.riskScore,
      appliedCount: extractStates[functionName]?.appliedCount || 0,
      lastAppliedPatch: extractStates[functionName]?.lastAppliedPatch || null,
      analysisVersion: extractStates[functionName]?.analysisVersion || 0
    });

    try {
      const json = await fetchExtractionPreviewPayload(entry.name);

      updateExtractState(functionName, {
        status: "ready",
        preview: json.preview || null,
        message:
          json?.preview?.candidates?.length > 0
            ? ""
            : json?.preview?.message ||
              json?.preview?.summary ||
              "Nenhum passo seguro encontrado no pipeline local.",
        error: "",
        originalComplexity:
          extractStates[functionName]?.originalComplexity ?? entry.riskScore,
        appliedCount: extractStates[functionName]?.appliedCount || 0,
        latestComplexity:
          extractStates[functionName]?.latestComplexity ?? entry.riskScore,
        timeline: extractStates[functionName]?.timeline || [],
        lastAppliedPatch: extractStates[functionName]?.lastAppliedPatch || null,
        analysisVersion: (extractStates[functionName]?.analysisVersion || 0) + 1
      });
    } catch (previewError) {
      updateExtractState(functionName, {
        status: "error",
        preview: null,
        message: "",
        error:
          previewError instanceof Error
            ? previewError.message
            : "Nao foi possivel gerar a proposta de extracao."
      });
    }
  }

  async function handleApplyExtraction(entry) {
    const functionName = getExtractionStateKey(entry);
    const preview = extractStates[functionName]?.preview;
    const selectedPreviewCandidate = getList(preview?.candidates).find(
      (candidate) => candidate?.id === preview?.selectedCandidateId
    ) || getList(preview?.candidates)[0];

    if (!preview) {
      return;
    }

    updateExtractState(functionName, (currentState) => ({
      ...currentState,
      status: "applying",
      message: "",
      error: ""
    }));

    try {
      const response = await fetch("/api/pragt/extract-pure-block", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          operation: "apply",
          script,
          functionName: entry.name,
          proposal: {
            mode: preview.mode,
            helperSource: preview.helperSource,
            updatedFunctionSource: preview.updatedFunctionSource
          }
        })
      });
      const json = await readJsonResponse(response);

      if (!response.ok || json?.status === "error") {
        throw new Error(json?.error || "Nao foi possivel aplicar a extracao.");
      }

      updateExtractState(functionName, (currentState) => ({
        ...currentState,
        status: "applied",
        preview: currentState.preview,
        message: "",
        error: ""
      }));

      const inspectionPayload = await inspectScript(script, {
        resetView: false,
        expandedFunctionName: entry.name
      });
      const nextEntry = getList(inspectionPayload?.functions)
        .map(enrichFunctionEntry)
        .find((candidateEntry) => candidateEntry?.name === entry.name);

      try {
        const nextPreviewPayload = await fetchExtractionPreviewPayload(entry.name);
        const nextProgress = nextPreviewPayload?.preview?.progress || {};
        const nextTimelineEntries = buildRefactorTimelineEntries({
          helperName: json?.helperName || preview.helperName,
          inputsUsed: selectedPreviewCandidate?.inputsUsed,
          nextSafeExtraction: nextProgress.safeNextExtraction,
          isStabilized: !nextProgress.safeNextExtraction
        });

        updateExtractState(functionName, (currentState) => ({
          ...currentState,
          status: "ready",
          preview: nextPreviewPayload.preview || null,
          message:
            nextPreviewPayload?.preview?.candidates?.length > 0
              ? ""
              : nextPreviewPayload?.preview?.message ||
                nextPreviewPayload?.preview?.summary ||
                "Nenhum bloco seguro encontrado pelas regras locais.",
          error: "",
          originalComplexity: currentState.originalComplexity ?? entry.riskScore,
          appliedCount: (currentState.appliedCount || 0) + 1,
          latestComplexity: nextEntry?.riskScore ?? currentState.latestComplexity,
          timeline: appendTimelineEntries(currentState.timeline, nextTimelineEntries),
          lastAppliedPatch: {
            helperName: json?.helperName || preview.helperName || "extraido",
            inputsUsed: selectedPreviewCandidate?.inputsUsed || [],
            source: preview?.mode || "last-applied",
            modeLabel: preview?.modeLabel || "Last applied",
            analysisVersion: (currentState.analysisVersion || 0) + 1
          },
          analysisVersion: (currentState.analysisVersion || 0) + 1
        }));
      } catch (previewError) {
        const nextTimelineEntries = buildRefactorTimelineEntries({
          helperName: json?.helperName || preview.helperName,
          inputsUsed: selectedPreviewCandidate?.inputsUsed,
          nextSafeExtraction: "",
          isStabilized: false
        });

        updateExtractState(functionName, (currentState) => ({
          ...currentState,
          status: "applied",
          preview: null,
          error:
            previewError instanceof Error
              ? previewError.message
              : "Nao foi possivel reanalisar a fila de extracao.",
          originalComplexity: currentState.originalComplexity ?? entry.riskScore,
          appliedCount: (currentState.appliedCount || 0) + 1,
          latestComplexity: nextEntry?.riskScore ?? currentState.latestComplexity,
          timeline: appendTimelineEntries(currentState.timeline, nextTimelineEntries),
          lastAppliedPatch: {
            helperName: json?.helperName || preview.helperName || "extraido",
            inputsUsed: selectedPreviewCandidate?.inputsUsed || [],
            source: preview?.mode || "last-applied",
            modeLabel: preview?.modeLabel || "Last applied",
            analysisVersion: (currentState.analysisVersion || 0) + 1
          },
          analysisVersion: (currentState.analysisVersion || 0) + 1
        }));
      }
    } catch (applyError) {
      updateExtractState(functionName, (currentState) => ({
        ...currentState,
        status: "error",
        error:
          applyError instanceof Error
            ? applyError.message
            : "Nao foi possivel aplicar a extracao."
      }));
    }
  }

  function handleRejectExtraction(entry) {
    const functionName = getExtractionStateKey(entry);

    updateExtractState(functionName, (currentState) => ({
      ...currentState,
      status: currentState.timeline?.length ? "ready" : "idle",
      preview: null,
      message: "",
      error: ""
    }));
  }

  return (
    <div style={styles.container}>
      <div style={styles.inputRow}>
        <input
          value={script}
          onChange={(event) => setScript(event.target.value)}
          style={styles.input}
        />
        <button
          type="button"
          onClick={handleInspect}
          disabled={loading}
          style={styles.button}
        >
          {loading ? "Parseando..." : "Inspecionar"}
        </button>
      </div>

      {error ? <div style={styles.errorBox}>{error}</div> : null}

      {result ? (
        <>
          <div style={styles.groupsCard}>
            {Array.isArray(result.warnings) && result.warnings.length > 0 ? (
              <div style={styles.warningBox}>{result.warnings.join(" ")}</div>
            ) : null}
            <div style={styles.groupsHeader}>
              <div style={styles.groupsHeaderMain}>
                <h3 style={styles.summaryTitle}>
                  Funcoes encontradas: {result.functionsCount ?? 0}
                </h3>
                <div style={styles.filterRow}>
                  {filterOptions.map((option) => {
                    const isActive = option.key === activeCategory;

                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setActiveCategory(option.key)}
                        style={{
                          ...styles.filterButton,
                          ...(isActive ? styles.activeFilterButton : {})
                        }}
                        aria-pressed={isActive}
                      >
                        <span>{option.label}</span>
                        <span
                          style={{
                            ...styles.filterCount,
                            ...(isActive ? {} : styles.inactiveFilterCount)
                          }}
                        >
                          {option.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={styles.groupsHeaderSide}>
                <div style={styles.hint}>
                  Clique em inspecionar para mapear a estrutura das funcoes do arquivo atual.
                </div>
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Buscar funcao por nome"
                  style={styles.searchInput}
                />
              </div>
            </div>

            <div style={styles.tableHeader}>
              <div style={styles.tableHeaderMain}>
                <div style={styles.buttonStack}>
                  <div style={styles.actionButtonRow}>
                    <button
                      type="button"
                      onClick={handleGenerateBatchPlan}
                      disabled={refactorActionStatus !== "idle"}
                      style={{
                        ...styles.planButton,
                        ...(refactorActionStatus !== "idle" ? styles.buttonDisabled : {})
                      }}
                    >
                      {refactorActionStatus === "planning" ? "Gerando..." : "Gerar plano"}
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteSafeRefactor}
                      disabled={refactorActionStatus !== "idle"}
                      style={{
                        ...styles.button,
                        ...(refactorActionStatus !== "idle" ? styles.buttonDisabled : {})
                      }}
                    >
                      {refactorActionStatus === "executing"
                        ? "Refatorando..."
                        : "Refatorar seguros"}
                    </button>
                    <button
                      type="button"
                      onClick={handleReviewBlocked}
                      disabled={refactorActionStatus !== "idle"}
                      style={{
                        ...styles.subtleButton,
                        ...(refactorActionStatus !== "idle" ? styles.buttonDisabled : {})
                      }}
                    >
                      {refactorActionStatus === "reviewing"
                        ? "Abrindo..."
                        : "Revisar bloqueios"}
                    </button>
                  </div>
                  <div style={styles.buttonSubtext}>
                    Pipeline: analisar {"->"} planejar {"->"} aplicar lotes seguros {"->"} reanalisar.
                  </div>
                  <div style={styles.buttonSubtext}>
                    Politica: pure extraction, dependency-injection surfacing, side-effect isolation, input normalization e parada manual quando necessario.
                  </div>
                </div>
                <h4 style={styles.tableTitle}>
                  {visibleCategoryMeta ? visibleCategoryMeta.groupLabel : "Todas as funcoes"}
                </h4>
                <span style={styles.tableCount}>{visibleFunctions.length}</span>
              </div>
            </div>

            {refactorActionError ? <div style={styles.errorBox}>{refactorActionError}</div> : null}

            {executionReport ? (
              <section style={styles.reportCard}>
                <div style={styles.reportHeader}>
                  <h5 style={styles.reportTitle}>Relatorio de execucao</h5>
                  <div style={styles.reportSubtitle}>
                    Loop automatico concluido com reanalise entre os lotes seguros.
                  </div>
                </div>
                <div style={styles.reportGrid}>
                  <div style={styles.reportMetric}>
                    <div style={styles.reportMetricLabel}>Iteracoes</div>
                    <div style={styles.reportMetricValue}>
                      {executionReport.iterationsRun || 0}
                    </div>
                  </div>
                  <div style={styles.reportMetric}>
                    <div style={styles.reportMetricLabel}>Funcoes alteradas</div>
                    <div style={styles.reportMetricValue}>
                      {getCount(executionReport.changedFunctions)}
                    </div>
                  </div>
                  <div style={styles.reportMetric}>
                    <div style={styles.reportMetricLabel}>Batches aplicados</div>
                    <div style={styles.reportMetricValue}>
                      {getCount(executionReport.appliedBatches)}
                    </div>
                  </div>
                  <div style={styles.reportMetric}>
                    <div style={styles.reportMetricLabel}>Bloqueadas</div>
                    <div style={styles.reportMetricValue}>
                      {getCount(executionReport.blockedFunctions)}
                    </div>
                  </div>
                  <div style={styles.reportMetric}>
                    <div style={styles.reportMetricLabel}>Parada</div>
                    <div style={styles.reportMetricValue}>
                      {executionReport.stoppedReason || "n/a"}
                    </div>
                  </div>
                </div>
                {getCount(executionReport.appliedSteps) > 0 ? (
                  <div style={styles.reportSection}>
                    <div style={styles.detailLabel}>Passos aplicados</div>
                    <ul style={styles.reportList}>
                      {getList(executionReport.appliedSteps)
                        .slice(0, 12)
                        .map((step, index) => (
                          <li
                            key={`${step.functionName}-${step.helperName}-${index}`}
                            style={styles.reportListItem}
                          >
                            {`${step.functionName} -> ${step.helperName} (${step.modeLabel})`}
                          </li>
                        ))}
                    </ul>
                  </div>
                ) : null}
                {getCount(executionReport.conflicts) > 0 ? (
                  <div style={styles.reportSection}>
                    <div style={styles.detailLabel}>Conflitos</div>
                    <ul style={styles.reportList}>
                      {getList(executionReport.conflicts).map((conflict, index) => (
                        <li key={`${conflict}-${index}`} style={styles.reportListItem}>
                          {conflict}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>
            ) : null}

            {batchPlan ? (
              <section style={styles.planCard}>
                <div style={styles.planHeader}>
                  <h5 style={styles.planTitle}>Batch Refactor</h5>
                  <div style={styles.planSubtitle}>
                    {planView === "blocked"
                      ? "Fila de bloqueios que exigem supervisao manual."
                      : "Fila estrutural do arquivo inteiro, ordenada por impacto e estrategia."}
                  </div>
                </div>
                <div style={styles.planSummaryGrid}>
                  <div style={styles.planMetric}>
                    <div style={styles.planMetricLabel}>Total de funcoes</div>
                    <div style={styles.planMetricValue}>{batchPlan.totalFunctions}</div>
                  </div>
                  <div style={styles.planMetric}>
                    <div style={styles.planMetricLabel}>Elegiveis agora</div>
                    <div style={styles.planMetricValue}>
                      {getCount(batchPlan.eligibleFunctions)}
                    </div>
                  </div>
                  <div style={styles.planMetric}>
                    <div style={styles.planMetricLabel}>Revisao manual</div>
                    <div style={styles.planMetricValue}>
                      {getCount(batchPlan.blockedFunctions)}
                    </div>
                  </div>
                  <div style={styles.planMetric}>
                    <div style={styles.planMetricLabel}>Batches ativos</div>
                    <div style={styles.planMetricValue}>{getCount(batchPlan.batches)}</div>
                  </div>
                </div>
                <div style={styles.batchList}>
                  {visiblePlanBatches.map((batch) => {
                    const tone = REFACTOR_BATCH_META[batch.key]?.tone || {};

                    return (
                      <section key={batch.key} style={styles.batchCard}>
                        <div style={styles.batchHeader}>
                          <div style={styles.batchHeaderMain}>
                            <div style={styles.batchTitleRow}>
                              <h6 style={styles.batchTitle}>{batch.label}</h6>
                              <span
                                style={{
                                  ...styles.batchBadge,
                                  border: tone.border,
                                  background: tone.background,
                                  color: tone.color
                                }}
                              >
                                {batch.modeLabel}
                              </span>
                              <span style={styles.tableCount}>{batch.count}</span>
                            </div>
                            <div style={styles.batchDescription}>{batch.description}</div>
                            <div style={styles.batchMeta}>
                              Estrategia: {batch.modeLabel}
                            </div>
                          </div>
                        </div>
                        {getCount(batch.families) > 0 ? (
                          <div style={styles.familyRow}>
                            {getList(batch.families)
                              .slice(0, 6)
                              .map((family) => (
                                <span
                                  key={`${batch.key}-${family.label}`}
                                  style={styles.familyChip}
                                >
                                  {family.label} · {family.count}
                                </span>
                              ))}
                          </div>
                        ) : null}
                        <div style={styles.planFunctionList}>
                          {getList(batch.functions)
                            .slice(0, 8)
                            .map((plannedEntry) => (
                              <div
                                key={`${batch.key}-${getRowKey(plannedEntry)}`}
                                style={styles.planFunctionRow}
                              >
                                <div style={styles.planFunctionHeader}>
                                  <span style={styles.planFunctionName}>
                                    {plannedEntry.name}
                                  </span>
                                  <div style={styles.planFunctionMeta}>
                                    <span style={styles.roleBadge}>{plannedEntry.role}</span>
                                    <span style={styles.runtimeChip}>
                                      score {plannedEntry.priorityScore}
                                    </span>
                                  </div>
                                </div>
                                <div style={styles.planFunctionReason}>
                                  {plannedEntry.actionLabel}. Motivo: {plannedEntry.rationale}.{" "}
                                  Problema dominante:{" "}
                                  {plannedEntry.diagnosis?.dominantProblem || "Review"}.{" "}
                                  Intervencao sugerida:{" "}
                                  {plannedEntry.diagnosis?.suggestedIntervention || "Revisar"}.
                                </div>
                                <div style={styles.planFunctionActions}>
                                  <button
                                    type="button"
                                    onClick={() => handleFocusPlannedFunction(plannedEntry)}
                                    style={styles.smallButton}
                                  >
                                    Abrir funcao
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {allFunctions.length > 0 ? (
              <>
                {visibleFunctions.length > 0 ? (
                  <div style={styles.tableViewport}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={{ ...styles.headCell, ...styles.nameCell }}>Funcao</th>
                          <th style={{ ...styles.headCell, ...styles.roleCell }}>Role</th>
                          <th style={{ ...styles.headCell, ...styles.scoreCell }}>Score</th>
                          <th style={{ ...styles.headCell, ...styles.countCell }}>Hidden</th>
                          <th style={{ ...styles.headCell, ...styles.countCell }}>Reads</th>
                          <th style={{ ...styles.headCell, ...styles.callsCell }}>Calls</th>
                          <th style={{ ...styles.headCell, ...styles.runtimeCell }}>Runtime Direct</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleFunctions.map((entry) => {
                        const rowKey = getRowKey(entry);
                        const extractKey = getExtractionStateKey(entry);
                        const isExpanded = Boolean(expandedRows[rowKey]);
                        const extractState = extractStates[extractKey] || {
                          ...getDefaultExtractState()
                        };
                        const preview = extractState.preview;
                        const hasApplicablePreview = Boolean(
                          preview?.helperSource && preview?.updatedFunctionSource
                        );
                        const selectedCandidate = getList(preview?.candidates).find(
                          (candidate) => candidate?.id === preview?.selectedCandidateId
                        ) || getList(preview?.candidates)[0];
                        const runtimeSummary = formatRuntimeSummary(entry);
                        const diagnosis = buildStructuralDiagnosis(entry);
                        const annotationFallbackText = entry?.architectureAnnotation?.text || "";
                        const annotationState = getAnnotationState(
                          extractKey,
                          annotationFallbackText
                        );
                        const annotationDraft = String(
                          annotationState.draft ?? annotationFallbackText
                        );
                        const annotationSummary = getArchitectureAnnotationSummary(
                          entry?.architectureAnnotation
                        );
                        const progress = preview?.progress || null;
                        const timeline = getList(extractState.timeline);
                        const lastAppliedPatch = extractState.lastAppliedPatch;
                        const originalComplexity =
                          extractState.originalComplexity ?? entry.riskScore;
                        const currentComplexity =
                          extractState.latestComplexity ?? entry.riskScore;
                        const shouldShowProgress =
                          Boolean(progress) || (extractState.appliedCount || 0) > 0;

                        return (
                          <React.Fragment key={rowKey}>
                            <tr style={styles.row}>
                              <td
                                style={{
                                  ...styles.summaryCell,
                                  ...styles.nameCell,
                                  ...(isExpanded ? styles.expandedSummaryCell : {})
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleRow(rowKey)}
                                  style={styles.nameButton}
                                  aria-expanded={isExpanded}
                                >
                                  <span style={styles.chevron}>
                                    {isExpanded ? "▾" : "▸"}
                                  </span>
                                  <span style={styles.functionName}>{entry.name}</span>
                                </button>
                              </td>
                              <td
                                style={{
                                  ...styles.summaryCell,
                                  ...styles.roleCell,
                                  ...(isExpanded ? styles.expandedSummaryCell : {})
                                }}
                              >
                                <span style={styles.roleBadge}>{entry.role}</span>
                              </td>
                              <td
                                style={{
                                  ...styles.summaryCell,
                                  ...styles.scoreCell,
                                  ...(isExpanded ? styles.expandedSummaryCell : {})
                                }}
                              >
                                {entry.riskScore}
                              </td>
                              <td
                                style={{
                                  ...styles.summaryCell,
                                  ...styles.countCell,
                                  ...(isExpanded ? styles.expandedSummaryCell : {})
                                }}
                              >
                                {entry.hiddenInputsCount}
                              </td>
                              <td
                                style={{
                                  ...styles.summaryCell,
                                  ...styles.countCell,
                                  ...(isExpanded ? styles.expandedSummaryCell : {})
                                }}
                              >
                                {entry.externalReadsCount}
                              </td>
                              <td
                                style={{
                                  ...styles.summaryCell,
                                  ...styles.callsCell,
                                  ...(isExpanded ? styles.expandedSummaryCell : {})
                                }}
                              >
                                {`L: ${entry.localCallsCount} | E: ${entry.externalCallsCount}`}
                              </td>
                              <td
                                style={{
                                  ...styles.summaryCell,
                                  ...styles.runtimeCell,
                                  ...(isExpanded ? styles.expandedSummaryCell : {})
                                }}
                              >
                                {Array.isArray(runtimeSummary?.visibleDependencies) ? (
                                  <div style={styles.runtimeSummary}>
                                    {runtimeSummary.visibleDependencies.map((dependency) => (
                                      <span
                                        key={`${rowKey}-${dependency}`}
                                        style={styles.runtimeChip}
                                      >
                                        {dependency}
                                      </span>
                                    ))}
                                    {runtimeSummary.hiddenCount > 0 ? (
                                      <span style={styles.runtimeOverflow}>
                                        +{runtimeSummary.hiddenCount}
                                      </span>
                                    ) : null}
                                  </div>
                                ) : (
                                  runtimeSummary
                                )}
                              </td>
                            </tr>

                            {isExpanded ? (
                              <tr>
                                <td colSpan={SUMMARY_COLUMNS} style={styles.detailRowCell}>
                                  <div style={styles.detailPanel}>
                                    <section style={styles.diagnosisCard}>
                                      <h5 style={styles.diagnosisTitle}>Diagnostico estrutural</h5>
                                      <div style={styles.diagnosisBody}>
                                        <div style={styles.diagnosisMeta}>
                                          <div style={styles.diagnosisLine}>
                                            <span style={styles.diagnosisKey}>
                                              Problema dominante:
                                            </span>
                                            <span style={styles.diagnosisValue}>
                                              {diagnosis.dominantProblem}
                                            </span>
                                          </div>
                                          <div style={styles.diagnosisLine}>
                                            <span style={styles.diagnosisKey}>
                                              Intervencao sugerida:
                                            </span>
                                            <span style={styles.diagnosisValue}>
                                              {diagnosis.suggestedIntervention}
                                            </span>
                                          </div>
                                          <div style={styles.diagnosisLine}>
                                            <span style={styles.diagnosisKey}>Role:</span>
                                            <span style={styles.diagnosisValue}>
                                              {diagnosis.role}
                                            </span>
                                          </div>
                                          <div style={styles.diagnosisLine}>
                                            <span style={styles.diagnosisKey}>Prioridade:</span>
                                            <span style={styles.diagnosisValue}>
                                              {diagnosis.priorityLabel}
                                            </span>
                                          </div>
                                          <div style={styles.diagnosisLine}>
                                            <span style={styles.diagnosisKey}>
                                              Runtime Direct:
                                            </span>
                                            <span style={styles.diagnosisValue}>
                                              {entry.runtimeDirect.level}
                                            </span>
                                          </div>
                                          <div style={styles.diagnosisLine}>
                                            <span style={styles.diagnosisKey}>
                                              External Coupling:
                                            </span>
                                            <span style={styles.diagnosisValue}>
                                              {entry.externalCoupling.level}
                                            </span>
                                          </div>
                                        </div>
                                        {renderDetailRow(
                                          "Motivos",
                                          diagnosis.reasons,
                                          styles
                                        )}
                                      </div>
                                    </section>
                                    <section style={styles.extractSection}>
                                      <div style={styles.extractHeader}>
                                        <div style={styles.extractHeaderMain}>
                                          <h5 style={styles.extractTitle}>Refatorar</h5>
                                          <div style={styles.buttonSubtext}>
                                            Reestruturar codigo sem mudar comportamento.
                                          </div>
                                          <div style={styles.extractCount}>
                                            {`Acao automatica: ${getAutomaticModeLabel(
                                              entry,
                                              preview
                                            )}`}
                                          </div>
                                          <div style={styles.extractCount}>
                                            {preview
                                              ? `candidates found: ${getCount(preview.candidates)}`
                                              : "Pure extraction -> dependency-injection surfacing -> side-effect isolation -> input normalization (descriptor extraction)"}
                                          </div>
                                        </div>
                                        <div style={styles.extractActions}>
                                          <button
                                            type="button"
                                            onClick={() => handlePreviewExtraction(entry)}
                                            disabled={
                                              extractState.status === "loading" ||
                                              extractState.status === "applying"
                                            }
                                            style={{
                                              ...styles.button,
                                              ...((extractState.status === "loading" ||
                                                extractState.status === "applying")
                                                ? styles.buttonDisabled
                                                : {})
                                            }}
                                          >
                                            {extractState.status === "loading"
                                              ? "Analisando refactor..."
                                              : "Refatorar"}
                                          </button>
                                          {hasApplicablePreview ? (
                                            <>
                                              <button
                                                type="button"
                                                onClick={() => handleRejectExtraction(entry)}
                                                disabled={extractState.status === "applying"}
                                                style={{
                                                  ...styles.subtleButton,
                                                  ...(extractState.status === "applying"
                                                    ? styles.buttonDisabled
                                                    : {})
                                                }}
                                              >
                                                Rejeitar
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleApplyExtraction(entry)}
                                                disabled={extractState.status === "applying"}
                                                style={{
                                                  ...styles.secondaryButton,
                                                  ...(extractState.status === "applying"
                                                    ? styles.buttonDisabled
                                                    : {})
                                                }}
                                              >
                                                {extractState.status === "applying"
                                                  ? "Aplicando patch..."
                                                  : "Aceitar patch"}
                                              </button>
                                            </>
                                          ) : null}
                                        </div>
                                      </div>
                                      {extractState.error ? (
                                        <div style={styles.errorBox}>{extractState.error}</div>
                                      ) : null}
                                      <div style={styles.extractInfoGrid}>
                                        <section style={styles.statusCard}>
                                          <h6 style={styles.statusTitle}>
                                            Current extraction status
                                          </h6>
                                          <div style={styles.statusGrid}>
                                            <div style={styles.statusMetric}>
                                              <div style={styles.statusMetricLabel}>
                                                current mode
                                              </div>
                                              <div style={styles.statusMetricValue}>
                                                {preview?.modeLabel || "none"}
                                              </div>
                                            </div>
                                            <div style={styles.statusMetric}>
                                              <div style={styles.statusMetricLabel}>
                                                candidates found now
                                              </div>
                                              <div style={styles.statusMetricValue}>
                                                {preview ? getCount(preview.candidates) : "n/a"}
                                              </div>
                                            </div>
                                            <div style={styles.statusMetric}>
                                              <div style={styles.statusMetricLabel}>
                                                safe next step
                                              </div>
                                              <div style={styles.statusMetricValue}>
                                                {progress?.safeNextExtraction || "none"}
                                              </div>
                                            </div>
                                            <div style={styles.statusMetric}>
                                              <div style={styles.statusMetricLabel}>
                                                analysis version
                                              </div>
                                              <div style={styles.statusMetricValue}>
                                                {extractState.analysisVersion || 0}
                                              </div>
                                            </div>
                                          </div>
                                          {preview?.summary ? (
                                            <div style={styles.extractSummary}>
                                              {preview.summary}
                                            </div>
                                          ) : null}
                                          {extractState.message ? (
                                            <div style={styles.warningBox}>
                                              {extractState.message}
                                            </div>
                                          ) : null}
                                        </section>
                                        {lastAppliedPatch ? (
                                          <section style={styles.statusCard}>
                                            <h6 style={styles.statusTitle}>Last applied patch</h6>
                                            <div style={styles.statusGrid}>
                                              <div style={styles.statusMetric}>
                                                <div style={styles.statusMetricLabel}>
                                                  extracted helper
                                                </div>
                                                <div style={styles.statusMetricValue}>
                                                  {lastAppliedPatch.helperName}
                                                </div>
                                              </div>
                                              <div style={styles.statusMetric}>
                                                <div style={styles.statusMetricLabel}>
                                                  source
                                                </div>
                                                <div style={styles.statusMetricValue}>
                                                  {lastAppliedPatch.modeLabel ||
                                                    lastAppliedPatch.source ||
                                                    "last-applied"}
                                                </div>
                                              </div>
                                            </div>
                                            <div style={styles.extractSummary}>
                                              {getCount(lastAppliedPatch.inputsUsed) > 0
                                                ? `Dependencias explicitadas: ${lastAppliedPatch.inputsUsed.join(
                                                    ", "
                                                  )}`
                                                : "Sem dependencias explicitadas registradas."}
                                            </div>
                                          </section>
                                        ) : null}
                                        {shouldShowProgress ? (
                                          <section style={styles.progressCard}>
                                            <h6 style={styles.progressTitle}>
                                              Function hollowing progress
                                            </h6>
                                            <div style={styles.progressGrid}>
                                              <div style={styles.progressMetric}>
                                                <div style={styles.progressMetricLabel}>
                                                  original complexity
                                                </div>
                                                <div style={styles.progressMetricValue}>
                                                  {getProgressMetricValue(originalComplexity)}
                                                </div>
                                              </div>
                                              <div style={styles.progressMetric}>
                                                <div style={styles.progressMetricLabel}>
                                                  current complexity
                                                </div>
                                                <div style={styles.progressMetricValue}>
                                                  {getProgressMetricValue(currentComplexity)}
                                                </div>
                                              </div>
                                              <div style={styles.progressMetric}>
                                                <div style={styles.progressMetricLabel}>
                                                  extracted blocks
                                                </div>
                                                <div style={styles.progressMetricValue}>
                                                  {extractState.appliedCount || 0}
                                                </div>
                                              </div>
                                              <div style={styles.progressMetric}>
                                                <div style={styles.progressMetricLabel}>
                                                  remaining mixed zones
                                                </div>
                                                <div style={styles.progressMetricValue}>
                                                  {getProgressMetricValue(
                                                    progress?.remainingMixedZones
                                                  )}
                                                </div>
                                              </div>
                                              <div style={styles.progressMetric}>
                                                <div style={styles.progressMetricLabel}>
                                                  safe next step
                                                </div>
                                                <div style={styles.progressMetricValue}>
                                                  {progress?.safeNextExtraction || "none"}
                                                </div>
                                              </div>
                                            </div>
                                          </section>
                                        ) : null}
                                        {timeline.length > 0 ? (
                                          <section style={styles.timelineCard}>
                                            <h6 style={styles.timelineTitle}>Refactor Timeline</h6>
                                            <ul style={styles.timelineList}>
                                              {timeline.map((timelineEntry) => (
                                                <li
                                                  key={timelineEntry.id}
                                                  style={styles.timelineListItem}
                                                >
                                                  <span
                                                    style={{
                                                      ...styles.timelineChip,
                                                      ...getTimelineEntryToneStyles(
                                                        timelineEntry.tone
                                                      )
                                                    }}
                                                  >
                                                    {timelineEntry.label}
                                                  </span>
                                                </li>
                                              ))}
                                            </ul>
                                          </section>
                                        ) : null}
                                        {!preview ? (
                                          <div style={styles.hintCard}>
                                            O assistente tenta primeiro extrair um bloco puro. Se
                                            nao houver um candidato claro, ele cai para
                                            dependency-injection surfacing, depois tenta
                                            side-effect isolation e, se ainda assim nao houver
                                            corte seguro, classifica o bloqueio estrutural dominante
                                            antes de sugerir o proximo passo.
                                          </div>
                                        ) : null}
                                      </div>
                                      {preview ? (
                                        <>
                                          {selectedCandidate ? (
                                            <div style={styles.extractSummary}>
                                              Estrategia escolhida:{" "}
                                              <strong>{preview.modeLabel || "Review"}</strong>
                                              {" · "}
                                              melhor candidato:{" "}
                                              <strong>{selectedCandidate.name}</strong>
                                              {preview.helperName
                                                ? ` -> helper ${preview.helperName}`
                                                : ""}
                                            </div>
                                          ) : null}
                                          <div style={styles.extractCandidateGrid}>
                                            {getList(preview.candidates).map((candidate) => {
                                              const riskTone = getCandidateRiskTone(candidate.risk);
                                              const isSelected =
                                                candidate?.id === preview?.selectedCandidateId;

                                              return (
                                                <div
                                                  key={`${rowKey}-${candidate.id}`}
                                                  style={{
                                                    ...styles.extractCandidateCard,
                                                    ...(isSelected
                                                      ? styles.extractSelectedCandidateCard
                                                      : {})
                                                  }}
                                                >
                                                  <div style={styles.extractCandidateHeader}>
                                                    <span style={styles.extractCandidateName}>
                                                      {candidate.name}
                                                    </span>
                                                    {isSelected ? (
                                                      <span style={styles.extractChip}>
                                                        selected
                                                      </span>
                                                    ) : null}
                                                    <span
                                                      style={{
                                                        ...styles.extractChip,
                                                        border: riskTone.border,
                                                        background: riskTone.background,
                                                        color: riskTone.color
                                                      }}
                                                    >
                                                      risco: {riskTone.label}
                                                    </span>
                                                    <span style={styles.extractChip}>
                                                      linhas: {getCandidateLineLabel(candidate)}
                                                    </span>
                                                    <span style={styles.extractChip}>
                                                      inputs: {getCount(candidate.inputsUsed)}
                                                    </span>
                                                  </div>
                                                  <div style={styles.extractChipRow}>
                                                    {getCount(candidate.inputsUsed) > 0 ? (
                                                      getList(candidate.inputsUsed).map((input) => (
                                                        <span
                                                          key={`${candidate.id}-${input}`}
                                                          style={styles.extractChip}
                                                        >
                                                          {input}
                                                        </span>
                                                      ))
                                                    ) : (
                                                      <span style={styles.emptyValue}>none</span>
                                                    )}
                                                  </div>
                                                  <div style={styles.extractCandidateReason}>
                                                    {candidate.reason || "Motivo nao informado."}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                          <div style={styles.detailRow}>
                                            <div style={styles.detailLabel}>
                                              Patch preview for current round
                                            </div>
                                            {hasApplicablePreview ? (
                                              <div style={styles.extractPreviewGrid}>
                                                <div style={styles.extractPreviewPanel}>
                                                  <div style={styles.extractPreviewLabel}>
                                                    Before
                                                  </div>
                                                  <pre style={styles.extractDiff}>
                                                    {preview.beforeSource ||
                                                      "Preview indisponivel."}
                                                  </pre>
                                                </div>
                                                <div style={styles.extractPreviewPanel}>
                                                  <div style={styles.extractPreviewLabel}>
                                                    After
                                                  </div>
                                                  <pre style={styles.extractDiff}>
                                                    {preview.afterSource ||
                                                      "Preview indisponivel."}
                                                  </pre>
                                                </div>
                                              </div>
                                            ) : (
                                              <div style={styles.hint}>
                                                Nenhum patch foi gerado porque a heuristica local
                                                recusou a extracao.
                                              </div>
                                            )}
                                          </div>
                                        </>
                                      ) : null}
                                    </section>
                                    <section style={styles.annotationSection}>
                                      <div style={styles.annotationHeader}>
                                        <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
                                          <h6 style={styles.annotationTitle}>
                                            Architecture Annotations
                                          </h6>
                                          <div style={styles.annotationHint}>
                                            O texto pode ser escrito em qualquer idioma. O
                                            comentario inserido no codigo sera sempre traduzido
                                            para ingles antes da insercao.
                                          </div>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleInsertArchitectureAnnotation(entry)}
                                          disabled={
                                            !annotationDraft.trim() ||
                                            annotationState.status === "saving"
                                          }
                                          style={{
                                            ...styles.secondaryButton,
                                            ...((!annotationDraft.trim() ||
                                              annotationState.status === "saving")
                                              ? styles.buttonDisabled
                                              : {})
                                          }}
                                        >
                                          {annotationState.status === "saving"
                                            ? "Inserindo..."
                                            : "Inserir annotation"}
                                        </button>
                                      </div>
                                      <textarea
                                        value={annotationDraft}
                                        onChange={(event) =>
                                          updateAnnotationState(extractKey, {
                                            draft: event.target.value,
                                            status: "idle",
                                            message: "",
                                            error: ""
                                          })
                                        }
                                        placeholder={`@pragt-role builder\n@pragt-layer ui\n@pragt-pure\n@pragt-refactor input-normalization`}
                                        style={styles.annotationTextarea}
                                      />
                                      {annotationSummary.length ? (
                                        <div style={styles.extractChipRow}>
                                          {annotationSummary.map((item, index) => (
                                            <span
                                              key={`${extractKey}-annotation-${item}-${index}`}
                                              style={styles.extractChip}
                                            >
                                              {item}
                                            </span>
                                          ))}
                                        </div>
                                      ) : null}
                                      {annotationState.message ? (
                                        <div style={styles.successBox}>
                                          {annotationState.message}
                                        </div>
                                      ) : null}
                                      {annotationState.error ? (
                                        <div style={styles.errorBox}>
                                          {annotationState.error}
                                        </div>
                                      ) : null}
                                    </section>
                                    <div style={styles.detailGrid}>
                                      {renderDetailRow(
                                        "Chamadas locais",
                                        entry.localCalls,
                                        styles
                                      )}
                                      {renderDetailRow(
                                        "Chamadas externas",
                                        entry.externalCalls,
                                        styles
                                      )}
                                      {renderDetailRow(
                                        "Called by",
                                        entry.calledBy,
                                        styles
                                      )}
                                      {renderDetailRow(
                                        "Leituras externas",
                                        entry.externalReads,
                                        styles
                                      )}
                                      {renderDetailRow(
                                        "Entradas ocultas",
                                        entry.hiddenInputs,
                                        styles
                                      )}
                                      {renderDetailRow(
                                        "Runtime Direct signals",
                                        entry.runtimeDirect.signals,
                                        styles
                                      )}
                                      {renderDetailRow(
                                        "External Coupling reads",
                                        entry.externalCoupling.reads,
                                        styles
                                      )}
                                      {renderDetailRow(
                                        "External Coupling calls",
                                        entry.externalCoupling.calls,
                                        styles
                                      )}
                                      {renderDetailRow(
                                        "External Coupling constants",
                                        entry.externalCoupling.constants,
                                        styles
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ) : null}
                          </React.Fragment>
                        );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={styles.hint}>
                    {searchedFunctions.length > 0
                      ? "Nenhuma funcao encontrada nesse filtro."
                      : "Nenhuma funcao nomeada encontrada no arquivo."}
                  </div>
                )}
              </>
            ) : (
              <div style={styles.hint}>
                {searchedFunctions.length > 0
                  ? "Nenhuma funcao encontrada nesse filtro."
                  : "Nenhuma funcao nomeada encontrada no arquivo."}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
