const LAYOUT_STYLE_PATHS = new Set([
  "alignItems",
  "bottom",
  "display",
  "gap",
  "gridTemplateColumns",
  "height",
  "justifyContent",
  "left",
  "margin",
  "marginBottom",
  "marginLeft",
  "marginRight",
  "marginTop",
  "maxHeight",
  "maxWidth",
  "minHeight",
  "minWidth",
  "padding",
  "paddingBottom",
  "paddingLeft",
  "paddingRight",
  "paddingTop",
  "position",
  "right",
  "top",
  "width",
  "zIndex"
]);

const PLATFORM_API_PATTERN = /^(path|fs|os|url|crypto|stream|net|tty|zlib|process|document|window|localStorage|sessionStorage|navigator|location|history|fetch|XMLHttpRequest|http|https)(\.|$)|^node:/i;
const FRAMEWORK_HOOK_PATTERN = /^use[A-Z]/;
const TYPE_ORDER = {
  framework_hook: 1,
  layout_style: 2,
  platform_api: 3,
  internal_value: 4,
  unclassified: 5
};
const IMPACT_ORDER = { high: 3, medium: 2, low: 1 };

function normalizePath(pathValue) {
  return String(pathValue || "").trim();
}

function lastPathSegment(pathValue) {
  const normalized = normalizePath(pathValue);
  if (!normalized) return "";
  const parts = normalized.split(".");
  return parts[parts.length - 1] || normalized;
}

function titleCase(value) {
  const normalized = String(value || "").replace(/-/g, " ");
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : "";
}

function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function typeLabel(type) {
  const map = {
    framework_hook: "framework hook",
    layout_style: "layout/style",
    internal_value: "internal value",
    platform_api: "platform API",
    unclassified: "unclassified"
  };
  return map[type] || type;
}

function categoryDetails(type, pathValue) {
  if (type === "framework_hook") {
    return {
      whyItMatters: "Indicates framework-managed state or lifecycle behavior inside the current function.",
      suggestedInspection: "Check whether this hook belongs in the current component or should be lifted/extracted."
    };
  }

  if (type === "layout_style") {
    return {
      whyItMatters: "Signals local layout or styling coordination inside the function/component.",
      suggestedInspection: "Check whether styling concerns are concentrated enough or should move to a smaller view/helper."
    };
  }

  if (type === "platform_api") {
    return {
      whyItMatters: "Touches a platform or runtime API even though it appears in the internal-reference set.",
      suggestedInspection: "Confirm whether this runtime/platform access belongs in the current layer or should move behind a boundary/helper."
    };
  }

  if (type === "internal_value") {
    return {
      whyItMatters: "Represents a local value/property reference that contributes to the function's internal behavior.",
      suggestedInspection: "Inspect whether this local value reveals a hidden sub-concern worth extracting or naming more explicitly."
    };
  }

  return {
    whyItMatters: `Local reference ${pathValue || "detected"} was captured, but its semantic role is still unclear.`,
    suggestedInspection: "Inspect the surrounding code to decide whether a more explicit category is needed."
  };
}

export function classifyInternalReference(pathValue, rawCategory = "unknown") {
  const normalizedPath = normalizePath(pathValue);
  const lastSegment = lastPathSegment(normalizedPath);

  let type = "unclassified";
  if (FRAMEWORK_HOOK_PATTERN.test(lastSegment) || FRAMEWORK_HOOK_PATTERN.test(normalizedPath)) {
    type = "framework_hook";
  } else if (LAYOUT_STYLE_PATHS.has(lastSegment) || LAYOUT_STYLE_PATHS.has(normalizedPath)) {
    type = "layout_style";
  } else if (rawCategory === "platform_api" || PLATFORM_API_PATTERN.test(normalizedPath)) {
    type = "platform_api";
  } else if (/^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*$/.test(normalizedPath)) {
    type = "internal_value";
  }

  return {
    type,
    label: typeLabel(type),
    ...categoryDetails(type, normalizedPath)
  };
}

export function mapConfidenceLevel(score) {
  const normalized = Number.isFinite(score) ? Math.max(0, Math.min(0.99, score)) : 0;
  if (normalized >= 0.9) {
    return {
      level: "high",
      label: "high",
      description: "High confidence",
      barWidth: Math.max(18, Math.round(normalized * 100))
    };
  }
  if (normalized >= 0.8) {
    return {
      level: "medium-high",
      label: "medium-high",
      description: "Medium-high confidence",
      barWidth: Math.max(18, Math.round(normalized * 100))
    };
  }
  if (normalized >= 0.7) {
    return {
      level: "medium",
      label: "medium",
      description: "Medium confidence",
      barWidth: Math.max(18, Math.round(normalized * 100))
    };
  }
  return {
    level: "low",
    label: "low",
    description: "Low confidence",
    barWidth: Math.max(18, Math.round(normalized * 100))
  };
}

function enrichInternalReference(functionName, entry) {
  const classification = classifyInternalReference(entry?.path, entry?.category);
  const confidence = mapConfidenceLevel(entry?.confidence);
  return {
    functionName,
    reference: entry?.path || "",
    rawCategory: entry?.category || "unknown",
    impact: entry?.impact || "low",
    confidence: Number.isFinite(entry?.confidence) ? entry.confidence : 0,
    referenceType: classification.type,
    referenceTypeLabel: classification.label,
    whyItMatters: classification.whyItMatters,
    suggestedInspection: classification.suggestedInspection,
    confidenceLevel: confidence.level,
    confidenceLabel: confidence.label,
    confidenceDescription: confidence.description,
    confidenceBarWidth: confidence.barWidth
  };
}

export function sortInternalReferences(references) {
  return [...(references || [])].sort((left, right) => {
    const byType = (TYPE_ORDER[left.referenceType] || 99) - (TYPE_ORDER[right.referenceType] || 99);
    if (byType !== 0) return byType;

    const byImpact = (IMPACT_ORDER[right.impact] || 0) - (IMPACT_ORDER[left.impact] || 0);
    if (byImpact !== 0) return byImpact;

    const byConfidence = (right.confidence || 0) - (left.confidence || 0);
    if (byConfidence !== 0) return byConfidence;

    return String(left.reference || "").localeCompare(String(right.reference || ""));
  });
}

export function buildInternalReferenceSummary(references) {
  const flat = Array.isArray(references) ? references : [];
  const totalReferences = flat.length;
  const functions = Array.from(new Set(flat.map((entry) => entry.functionName).filter(Boolean)));
  const byType = new Map();

  flat.forEach((entry) => {
    const current = byType.get(entry.referenceType) || { type: entry.referenceType, label: entry.referenceTypeLabel, count: 0, references: [] };
    current.count += 1;
    current.references.push(entry.reference);
    byType.set(entry.referenceType, current);
  });

  const categoryDistribution = Array.from(byType.values())
    .sort((left, right) => right.count - left.count || (TYPE_ORDER[left.type] || 99) - (TYPE_ORDER[right.type] || 99))
    .map((entry) => ({
      type: entry.type,
      label: entry.label,
      count: entry.count,
      text: `${pluralize(entry.count, entry.label)}`
    }));

  const topSignals = categoryDistribution.slice(0, 3).map((entry) => {
    const referencesForType = sortInternalReferences(flat.filter((reference) => reference.referenceType === entry.type))
      .slice(0, entry.type === "layout_style" ? 3 : 2)
      .map((reference) => reference.reference);
    return {
      type: entry.type,
      label: entry.label,
      text: `${referencesForType.join(", ")} -> ${entry.label}`
    };
  });

  let headline = "No internal references detected.";
  if (totalReferences === 1 && functions.length === 1) {
    headline = `1 reference detected in ${functions[0]}`;
  } else if (totalReferences > 0 && functions.length === 1) {
    headline = `${totalReferences} references detected in ${functions[0]}`;
  } else if (totalReferences > 0) {
    headline = `${totalReferences} references detected across ${functions.length} functions`;
  }

  return {
    totalReferences,
    functionCount: functions.length,
    headline,
    categoryDistribution,
    topSignals
  };
}

export function buildInternalReferenceViewModel(referencesByFunction) {
  const groups = Object.entries(referencesByFunction || {})
    .map(([functionName, entries]) => {
      const enriched = sortInternalReferences((entries || []).map((entry) => enrichInternalReference(functionName, entry)));
      const categoryCounts = enriched.reduce((accumulator, entry) => {
        accumulator[entry.referenceType] = (accumulator[entry.referenceType] || 0) + 1;
        return accumulator;
      }, {});

      return {
        functionName,
        count: enriched.length,
        categoryCounts,
        references: enriched
      };
    })
    .filter((group) => group.references.length > 0)
    .sort((left, right) => right.count - left.count || left.functionName.localeCompare(right.functionName));

  const flatReferences = groups.flatMap((group) => group.references);

  return {
    groups,
    flatReferences,
    summary: buildInternalReferenceSummary(flatReferences)
  };
}

export function getInternalReferenceImpactDescription(impact) {
  const map = {
    low: "local reference with low structural effect",
    medium: "may affect how the component or function is organized",
    high: "may affect architecture or module flow"
  };
  return map[impact] || "relevance signal not yet classified";
}

export function getInternalReferenceTypeLabel(type) {
  return typeLabel(type);
}

export function formatInternalReferenceCount(count, label) {
  return `${count} ${label}${count === 1 ? "" : "s"}`;
}

export function formatConfidenceValue(score) {
  return Number.isFinite(score) ? score.toFixed(2) : "0.00";
}

export function getConfidenceTone(level) {
  const map = {
    high: "#166534",
    "medium-high": "#0f766e",
    medium: "#a16207",
    low: "#991b1b"
  };
  return map[level] || "#4b5563";
}

export function getConfidenceTrackColor(level) {
  const map = {
    high: "rgba(22, 101, 52, 0.16)",
    "medium-high": "rgba(15, 118, 110, 0.16)",
    medium: "rgba(161, 98, 7, 0.16)",
    low: "rgba(153, 27, 27, 0.16)"
  };
  return map[level] || "rgba(75, 85, 99, 0.14)";
}
