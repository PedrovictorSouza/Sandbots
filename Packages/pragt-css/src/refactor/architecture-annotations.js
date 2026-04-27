import { getPatterns } from "./patterns/pattern-registry.js";

const PRAGT_MARKER_PATTERN = /@pragt-|(?:^|\b)pragt(?:\b|[-_])/i;

const ROLE_ALIASES = new Map([
  ["action handler", "action-handler"],
  ["algorithm", "algorithm"],
  ["analisador", "analyzer"],
  ["analizador", "analyzer"],
  ["analyzer", "analyzer"],
  ["auxiliar", "utility"],
  ["builder", "builder"],
  ["construtor", "builder"],
  ["constructor", "builder"],
  ["handler", "action-handler"],
  ["helper", "utility"],
  ["module function", "module-function"],
  ["orchestrator", "orchestrator"],
  ["orquestrador", "orchestrator"],
  ["orquestador", "orchestrator"],
  ["runtime", "runtime-helper"],
  ["runtime helper", "runtime-helper"],
  ["utility", "utility"],
  ["utilidade", "utility"],
  ["utilitario", "utility"],
  ["utilitario de runtime", "runtime-helper"]
]);

const LAYER_ALIASES = new Map([
  ["app", "application"],
  ["application", "application"],
  ["aplicacao", "application"],
  ["browser", "runtime"],
  ["client", "ui"],
  ["cliente", "ui"],
  ["data", "data"],
  ["dados", "data"],
  ["domain", "domain"],
  ["dominio", "domain"],
  ["front", "ui"],
  ["frontend", "ui"],
  ["infra", "infrastructure"],
  ["infraestrutura", "infrastructure"],
  ["infrastructure", "infrastructure"],
  ["interface", "ui"],
  ["interfaz", "ui"],
  ["runtime", "runtime"],
  ["state", "state"],
  ["ui", "ui"]
]);

const REFACTOR_ALIASES = new Map([
  ["dependency first", "dependency-first"],
  ["dependency surfacing", "dependency-first"],
  ["dependency injection surfacing", "dependency-first"],
  ["dependency-injection surfacing", "dependency-first"],
  ["dependency-injection-surfacing", "dependency-first"],
  ["desacoplar shape", "shape-first"],
  ["effect layer extraction", "effect-layer-extraction"],
  ["effect separation", "effect-layer-extraction"],
  ["side effect isolation", "effect-layer-extraction"],
  ["side-effect isolation", "effect-layer-extraction"],
  ["side-effect-isolation", "effect-layer-extraction"],
  ["extract first", "pure-extraction"],
  ["extracao pura", "pure-extraction"],
  ["extracao de efeito", "effect-layer-extraction"],
  ["input normalization", "shape-first"],
  ["input normalization descriptor extraction", "shape-first"],
  ["input-normalization", "shape-first"],
  ["introduce intermediate representation", "shape-first"],
  ["implicit type inference from object structure", "shape-first"],
  ["manual review", "manual-supervision"],
  ["manual supervision", "manual-supervision"],
  ["manual-supervision", "manual-supervision"],
  ["conditional logic based on object structure", "shape-first"],
  ["conditional normalization", "shape-first"],
  ["object shape coupling", "shape-first"],
  ["orchestration split", "orchestration-split"],
  ["pure extraction", "pure-extraction"],
  ["pure-extraction", "pure-extraction"],
  ["reduce object shape coupling", "shape-first"],
  ["shape based conditional logic", "shape-first"],
  ["shape decoupling", "shape-first"],
  ["shape first", "shape-first"],
  ["shape surfacing", "shape-first"],
  ["shape-first", "shape-first"],
  ["surface object shape", "shape-first"],
  ["surfacing dependencies", "dependency-first"]
]);

const EXACT_LINE_TRANSLATIONS = new Map([
  ["deve permanecer puro", "must remain pure"],
  ["deve continuar puro", "must remain pure"],
  ["deve ficar puro", "must remain pure"],
  ["debe permanecer puro", "must remain pure"],
  ["debe seguir puro", "must remain pure"],
  ["manter puro", "must remain pure"],
  ["must stay pure", "must remain pure"],
  ["sem efeitos colaterais", "side-effect free"],
  ["sin efectos secundarios", "side-effect free"]
]);

const TOKEN_REPLACEMENTS = [
  [/\bcamada\b/gi, "layer"],
  [/\bcapa\b/gi, "layer"],
  [/\bconstrutor\b/gi, "builder"],
  [/\bconstructor\b/gi, "builder"],
  [/\bdebe\b/gi, "must"],
  [/\bdeve\b/gi, "must"],
  [/\bdependencias\b/gi, "dependencies"],
  [/\bdependencia\b/gi, "dependency"],
  [/\binterfaz\b/gi, "ui"],
  [/\binterface\b/gi, "ui"],
  [/\bpermanecer\b/gi, "remain"],
  [/\bpuro\b/gi, "pure"],
  [/\bpura\b/gi, "pure"],
  [/\brefatoracao\b/gi, "refactor"],
  [/\brefactorizacion\b/gi, "refactor"],
  [/\brol\b/gi, "role"],
  [/\bpapel\b/gi, "role"]
];

function getList(items) {
  return Array.isArray(items) ? items : [];
}

function stripAccents(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeLookupKey(value) {
  return stripAccents(value)
    .toLowerCase()
    .replace(/[_/]+/g, " ")
    .replace(/[^a-z0-9@-]+/g, " ")
    .trim();
}

function normalizeCommentBody(text) {
  return String(text || "")
    .replace(/^\s*\/\*/, "")
    .replace(/\*\/\s*$/, "")
    .split(/\r\n|\n|\r/)
    .map((line) => line.replace(/^\s*\*\s?/, "").trim())
    .filter(Boolean);
}

function replaceWholePhrase(input, phrase, nextValue) {
  const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const boundaryPattern = new RegExp(`(^|\\b)${escapedPhrase}(\\b|$)`, "gi");

  return input.replace(boundaryPattern, (_match, leading, trailing) => `${leading}${nextValue}${trailing}`);
}

function translateFreeTextLine(line) {
  const normalizedLine = normalizeLookupKey(line);
  const exactTranslation = EXACT_LINE_TRANSLATIONS.get(normalizedLine);

  if (exactTranslation) {
    return exactTranslation;
  }

  let translatedLine = stripAccents(String(line || "").trim()).toLowerCase();

  TOKEN_REPLACEMENTS.forEach(([pattern, replacement]) => {
    translatedLine = translatedLine.replace(pattern, replacement);
  });

  Array.from(EXACT_LINE_TRANSLATIONS.keys())
    .sort((left, right) => right.length - left.length)
    .forEach((phrase) => {
      translatedLine = replaceWholePhrase(
        translatedLine,
        phrase,
        EXACT_LINE_TRANSLATIONS.get(phrase)
      );
    });

  return translatedLine
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function normalizeDirectiveValue(value, aliasMap) {
  const normalizedValue = normalizeLookupKey(value);

  if (aliasMap.has(normalizedValue)) {
    return aliasMap.get(normalizedValue);
  }

  return translateFreeTextLine(value).replace(/\s+/g, "-");
}

function normalizeRefactorValue(value) {
  const normalizedValue = normalizeLookupKey(value);

  if (REFACTOR_ALIASES.has(normalizedValue)) {
    return REFACTOR_ALIASES.get(normalizedValue);
  }

  const knownPattern = getPatterns().find((pattern) => {
    const idKey = normalizeLookupKey(pattern.id).replace(/-/g, " ");
    const nameKey = normalizeLookupKey(pattern.name).replace(/-/g, " ");

    return normalizedValue === idKey || normalizedValue === nameKey;
  });

  if (knownPattern) {
    return knownPattern.id;
  }

  return translateFreeTextLine(value).replace(/\s+/g, "-");
}

function isPureDirectiveLine(line) {
  const normalizedLine = normalizeLookupKey(line);

  return (
    normalizedLine === "@pragt-pure" ||
    normalizedLine === "pragt pure" ||
    normalizedLine === "pure" ||
    normalizedLine === "puro" ||
    normalizedLine === "pura" ||
    normalizedLine === "must be pure" ||
    normalizedLine === "should be pure" ||
    normalizedLine === "deve ser puro" ||
    normalizedLine === "debe ser puro"
  );
}

function translateAnnotationLine(line) {
  const cleanedLine = String(line || "").trim();

  if (!cleanedLine) {
    return "";
  }

  const roleMatch = cleanedLine.match(
    /^(?:@pragt-role|role|papel|rol|funcao|funcion)\s*[:=-]?\s+(.+)$/i
  );

  if (roleMatch) {
    return `@pragt-role ${normalizeDirectiveValue(roleMatch[1], ROLE_ALIASES)}`;
  }

  const layerMatch = cleanedLine.match(/^(?:@pragt-layer|layer|camada|capa)\s*[:=-]?\s+(.+)$/i);

  if (layerMatch) {
    return `@pragt-layer ${normalizeDirectiveValue(layerMatch[1], LAYER_ALIASES)}`;
  }

  const refactorMatch = cleanedLine.match(
    /^(?:@pragt-refactor|refactor|refatoracao|refatorizacion|intervencao|intervencion|strategy|estrategia)\s*[:=-]?\s+(.+)$/i
  );

  if (refactorMatch) {
    return `@pragt-refactor ${normalizeRefactorValue(refactorMatch[1])}`;
  }

  if (isPureDirectiveLine(cleanedLine)) {
    return "@pragt-pure";
  }

  if (/^@pragt-[a-z-]+/i.test(cleanedLine)) {
    const directiveMatch = cleanedLine.match(/^(@pragt-[a-z-]+)\s*(.*)$/i);
    const directiveName = directiveMatch?.[1]?.toLowerCase() || "@pragt-note";
    const directiveValue = String(directiveMatch?.[2] || "").trim();

    if (!directiveValue) {
      return directiveName;
    }

    if (directiveName === "@pragt-role") {
      return `@pragt-role ${normalizeDirectiveValue(directiveValue, ROLE_ALIASES)}`;
    }

    if (directiveName === "@pragt-layer") {
      return `@pragt-layer ${normalizeDirectiveValue(directiveValue, LAYER_ALIASES)}`;
    }

    if (directiveName === "@pragt-refactor") {
      return `@pragt-refactor ${normalizeRefactorValue(directiveValue)}`;
    }

    return `${directiveName} ${translateFreeTextLine(directiveValue)}`.trim();
  }

  return translateFreeTextLine(cleanedLine);
}

export function isPragtAnnotationCommentText(commentText) {
  return PRAGT_MARKER_PATTERN.test(String(commentText || ""));
}

export function parseArchitectureAnnotationText(text) {
  const lines = normalizeCommentBody(text);
  const directives = {};
  const notes = [];

  lines.forEach((line) => {
    const roleMatch = line.match(/^@pragt-role\s+(.+)$/i);
    const layerMatch = line.match(/^@pragt-layer\s+(.+)$/i);
    const refactorMatch = line.match(/^@pragt-refactor\s+(.+)$/i);

    if (roleMatch) {
      directives.role = roleMatch[1].trim();
      return;
    }

    if (layerMatch) {
      directives.layer = layerMatch[1].trim();
      return;
    }

    if (refactorMatch) {
      directives.refactor = refactorMatch[1].trim();
      return;
    }

    if (/^@pragt-pure$/i.test(line)) {
      directives.pure = true;
      return;
    }

    if (!/^PRAGT$/i.test(line)) {
      notes.push(line);
    }
  });

  return {
    text: lines.join("\n"),
    lines,
    directives,
    notes,
    hasMarkers: lines.some((line) => isPragtAnnotationCommentText(line))
  };
}

export function translateArchitectureAnnotation(inputText) {
  const inputLines = normalizeCommentBody(inputText);

  if (!inputLines.length) {
    throw new Error("Architecture annotation vazia.");
  }

  const translatedLines = inputLines.map(translateAnnotationLine).filter(Boolean);

  if (!translatedLines.length) {
    throw new Error("Architecture annotation vazia.");
  }

  const finalLines = translatedLines.some((line) => isPragtAnnotationCommentText(line))
    ? translatedLines
    : ["PRAGT", ...translatedLines];

  return {
    translatedLines: finalLines,
    translatedText: finalLines.join("\n"),
    parsed: parseArchitectureAnnotationText(finalLines.join("\n"))
  };
}

export function formatArchitectureAnnotationBlock(annotationText, options = {}) {
  const { indent = "", eol = "\n" } = options;
  const lines = normalizeCommentBody(annotationText);

  if (!lines.length) {
    throw new Error("Architecture annotation vazia.");
  }

  return [
    `${indent}/*`,
    ...lines.map((line) => `${indent}${line}`),
    `${indent}*/`
  ].join(eol);
}

export function getArchitectureAnnotationSummary(annotation) {
  if (!annotation?.directives && !annotation?.parsed) {
    return [];
  }

  const parsed = annotation?.parsed || annotation;
  const directives = parsed.directives || {};
  const notes = getList(parsed.notes);
  const summary = [];

  if (directives.role) {
    summary.push(`role:${directives.role}`);
  }

  if (directives.layer) {
    summary.push(`layer:${directives.layer}`);
  }

  if (directives.refactor) {
    summary.push(`refactor:${directives.refactor}`);
  }

  if (directives.pure) {
    summary.push("pure");
  }

  return [...summary, ...notes];
}
