import autoSafePattern from "./auto-safe.js";
import dependencyFirstPattern from "./dependency-first.js";
import dependencySurfacingPattern from "./dependency-surfacing.js";
import effectLayerExtractionPattern from "./effect-layer-extraction.js";
import lowStructuralPressurePattern from "./low-structural-pressure.js";
import manualSupervisionPattern from "./manual-supervision.js";
import orchestrationOverloadPattern from "./orchestration-overload.js";
import pureExtractionPattern from "./pure-extraction.js";
import runtimeBoundaryPressurePattern from "./runtime-boundary-pressure.js";
import shapeFirstPattern from "./shape-first.js";

export const refactorPatterns = [];

const STATIC_PATTERN_MODULES = [
  autoSafePattern,
  dependencyFirstPattern,
  dependencySurfacingPattern,
  effectLayerExtractionPattern,
  lowStructuralPressurePattern,
  manualSupervisionPattern,
  orchestrationOverloadPattern,
  pureExtractionPattern,
  runtimeBoundaryPressurePattern,
  shapeFirstPattern
];

function getList(items) {
  return Array.isArray(items) ? items : [];
}

function resolveSignalValue(signals, key) {
  return String(key || "")
    .split(".")
    .filter(Boolean)
    .reduce((currentValue, segment) => currentValue?.[segment], signals);
}

function listIncludes(items, candidate) {
  const list = getList(items);

  return list.some((item) => String(item) === String(candidate));
}

function toRuleList(rule) {
  if (Array.isArray(rule)) {
    return rule;
  }

  if (!rule || typeof rule !== "object") {
    return [];
  }

  return [rule];
}

function evaluateRuleEntry(signals, key, expected) {
  if (key === "allOf") {
    return getList(expected).every((rule) => matchesDetectRules(signals, rule));
  }

  if (key === "anyOf") {
    return getList(expected).some((rule) => matchesDetectRules(signals, rule));
  }

  if (key === "not") {
    return toRuleList(expected).every((rule) => !matchesDetectRules(signals, rule));
  }

  const operatorMatch = String(key || "").match(
    /^(.*?)(Min|Max|Equals|Includes|IncludesAny|IncludesAll|OneOf)$/
  );
  const signalKey = operatorMatch?.[1] || key;
  const operator = operatorMatch?.[2] || "Equals";
  const actualValue = resolveSignalValue(signals, signalKey);

  switch (operator) {
    case "Min":
      return Number(actualValue) >= Number(expected);
    case "Max":
      return Number(actualValue) <= Number(expected);
    case "Equals":
      return actualValue === expected;
    case "Includes":
      return Array.isArray(actualValue)
        ? listIncludes(actualValue, expected)
        : String(actualValue || "").includes(String(expected || ""));
    case "IncludesAny":
      return getList(expected).some((candidate) => listIncludes(actualValue, candidate));
    case "IncludesAll":
      return getList(expected).every((candidate) => listIncludes(actualValue, candidate));
    case "OneOf":
      return getList(expected).some((candidate) => candidate === actualValue);
    default:
      return false;
  }
}

export function matchesDetectRules(signals, detect = {}) {
  if (!detect || typeof detect !== "object") {
    return true;
  }

  return Object.entries(detect).every(([key, expected]) =>
    evaluateRuleEntry(signals, key, expected)
  );
}

function normalizePattern(pattern) {
  if (!pattern || typeof pattern !== "object") {
    throw new Error("Refactor pattern must be an object.");
  }

  const id = String(pattern.id || "").trim();
  const name = String(pattern.name || "").trim();

  if (!id || !name) {
    throw new Error("Refactor pattern requires id and name.");
  }

  return {
    detect: {},
    description: "",
    intervention: "",
    pipeline: "",
    transformation: "",
    priority: 0,
    ...pattern,
    id,
    name
  };
}

export function registerPattern(pattern) {
  const normalizedPattern = normalizePattern(pattern);
  const existingIndex = refactorPatterns.findIndex(
    (registeredPattern) => registeredPattern.id === normalizedPattern.id
  );

  if (existingIndex >= 0) {
    refactorPatterns.splice(existingIndex, 1, normalizedPattern);
  } else {
    refactorPatterns.push(normalizedPattern);
  }

  return normalizedPattern;
}

export function getPatterns() {
  return [...refactorPatterns];
}

export function getPatternById(patternId) {
  return refactorPatterns.find((pattern) => pattern.id === patternId) || null;
}

export function detectPatterns(signals, options = {}) {
  return getPatterns()
    .map((pattern) => {
      const matchesDetect = matchesDetectRules(signals, pattern.detect);
      const matchesCustom =
        typeof pattern.match === "function" ? pattern.match(signals, options) : true;

      if (!matchesDetect || !matchesCustom) {
        return null;
      }

      const score =
        typeof pattern.getScore === "function"
          ? Number(pattern.getScore(signals, options) || 0)
          : Number(pattern.score || 0);
      const interventionLabel =
        typeof pattern.getIntervention === "function"
          ? pattern.getIntervention(signals, options)
          : pattern.intervention;
      const pipeline =
        typeof pattern.getPipeline === "function"
          ? pattern.getPipeline(signals, options)
          : pattern.pipeline;
      const executionBatch =
        typeof pattern.getExecutionBatch === "function"
          ? pattern.getExecutionBatch(signals, options)
          : pattern.executionBatch || pipeline;
      const reason =
        typeof pattern.getReason === "function"
          ? pattern.getReason(signals, options)
          : pattern.reason || pattern.description;
      const actionLabel =
        typeof pattern.getActionLabel === "function"
          ? pattern.getActionLabel(signals, options)
          : pattern.actionLabel || "";
      const rationale =
        typeof pattern.getRationale === "function"
          ? pattern.getRationale(signals, options)
          : pattern.rationale || reason;

      return {
        ...pattern,
        score,
        interventionLabel: String(interventionLabel || "").trim(),
        pipeline: String(pipeline || "").trim(),
        executionBatch: String(executionBatch || "").trim(),
        reason: String(reason || "").trim(),
        actionLabel: String(actionLabel || "").trim(),
        rationale: String(rationale || "").trim(),
        problemKey: String(pattern.problemKey || pattern.id || "").trim(),
        problemName: String(pattern.problemName || pattern.name || "").trim()
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (right.priority !== left.priority) {
        return right.priority - left.priority;
      }

      return left.name.localeCompare(right.name);
    });
}

export function getDominantPattern(signals, options = {}) {
  return detectPatterns(signals, options)[0] || null;
}

function loadBuiltInPatterns() {
  if (typeof import.meta.glob === "function") {
    const patternModules = import.meta.glob("./*.js", { eager: true });

    return Object.entries(patternModules)
      .filter(([modulePath]) => modulePath !== "./pattern-registry.js")
      .map(([, module]) => module?.default)
      .filter(Boolean);
  }

  return STATIC_PATTERN_MODULES;
}

const BUILTIN_PATTERNS = loadBuiltInPatterns();

BUILTIN_PATTERNS.forEach(registerPattern);
