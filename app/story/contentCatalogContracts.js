export const CONTENT_CATALOG_KIND = Object.freeze({
  BOTS: "bots",
  ITEMS: "items",
  TOOLS: "tools",
  MATERIALS: "materials",
  BUILDABLES: "buildables",
  FIELD_TASKS: "field-tasks",
  SHORT_EXPEDITIONS: "short-expeditions",
  WORKBENCH_PROTOCOLS: "workbench-protocols",
  CODEX_ENTRIES: "codex-entries",
  CODEX_REQUESTS: "codex-requests"
});

export const CONTENT_CATALOG_REQUIRED_FIELDS = Object.freeze({
  [CONTENT_CATALOG_KIND.BOTS]: Object.freeze(["id", "name"]),
  [CONTENT_CATALOG_KIND.ITEMS]: Object.freeze(["id", "label"]),
  [CONTENT_CATALOG_KIND.TOOLS]: Object.freeze(["id", "label"]),
  [CONTENT_CATALOG_KIND.MATERIALS]: Object.freeze(["id", "label"]),
  [CONTENT_CATALOG_KIND.BUILDABLES]: Object.freeze(["id", "label", "group"]),
  [CONTENT_CATALOG_KIND.FIELD_TASKS]: Object.freeze(["id", "title", "description"]),
  [CONTENT_CATALOG_KIND.SHORT_EXPEDITIONS]: Object.freeze(["id", "title", "hook", "discoveries", "returnAid.type", "reward.visibleWorldChange"]),
  [CONTENT_CATALOG_KIND.WORKBENCH_PROTOCOLS]: Object.freeze(["id", "label", "category", "state"]),
  [CONTENT_CATALOG_KIND.CODEX_ENTRIES]: Object.freeze(["id", "name", "details.descriptionHtml"]),
  [CONTENT_CATALOG_KIND.CODEX_REQUESTS]: Object.freeze(["id", "title", "description", "objective", "reward"])
});

export const DEFAULT_PLAYER_FACING_CATALOG_FIELDS = Object.freeze([
  "name",
  "displayName",
  "label",
  "title",
  "description",
  "descriptionHtml",
  "summary",
  "body",
  "eyebrow",
  "note",
  "category",
  "actionLabel",
  "statusText",
  "lockedReason",
  "blockedReason"
]);

export const EXTERNAL_IP_PLAYER_FACING_TERMS = Object.freeze([
  "pokemon",
  "pokémon",
  "pokedex",
  "pokédex",
  "pokopia",
  "pokeball",
  "pokéball",
  "bulbasaur",
  "charmander",
  "squirtle",
  "tangrowth",
  "timburr",
  "leppa"
]);

export const OBJECTIVE_CONSEQUENCE_TERMS = Object.freeze([
  "authorize",
  "benefit",
  "bot",
  "build",
  "colony",
  "complete",
  "create",
  "field tool",
  "grow",
  "habitat",
  "home",
  "learn",
  "online",
  "power",
  "prove",
  "protocol",
  "restore",
  "restored",
  "route",
  "soil",
  "system",
  "test",
  "tool",
  "unlock",
  "viable",
  "water"
]);

export const DIALOGUE_LINE_FUNCTION = Object.freeze({
  INSTRUCTION: "instruction",
  WORLD: "world",
  CHARACTER: "character",
  RELATIONSHIP: "relationship",
  PLOT: "plot",
  JOKE: "joke",
  FEEDBACK: "feedback",
  HINT: "hint"
});

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getFieldValue(entry, fieldPath) {
  if (!fieldPath || !isRecord(entry)) {
    return undefined;
  }

  return String(fieldPath)
    .split(".")
    .reduce((value, key) => (isRecord(value) ? value[key] : undefined), entry);
}

function hasRequiredValue(entry, fieldPath) {
  const value = getFieldValue(entry, fieldPath);

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return value !== null && value !== undefined;
}

function collectStrings(value, { evaluateTextFunctions = false, textFunctionContext = {} } = {}) {
  if (typeof value === "string") {
    return [value];
  }

  if (typeof value === "function") {
    if (!evaluateTextFunctions) {
      return [];
    }

    const resolved = value(textFunctionContext);
    return collectStrings(resolved, { evaluateTextFunctions: false, textFunctionContext });
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectStrings(item, { evaluateTextFunctions, textFunctionContext }));
  }

  if (isRecord(value)) {
    return Object.values(value).flatMap((item) =>
      collectStrings(item, { evaluateTextFunctions, textFunctionContext })
    );
  }

  return [];
}

function findForbiddenTerms(text, terms) {
  const normalizedText = String(text || "")
    .replace(/<[^>]*>/g, " ")
    .toLocaleLowerCase();
  return terms.filter((term) => normalizedText.includes(term.toLocaleLowerCase()));
}

function normalizeComparableCopy(text) {
  return String(text || "")
    .replace(/<[^>]*>/g, " ")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function hasConsequenceCopy(text, terms = OBJECTIVE_CONSEQUENCE_TERMS) {
  const normalizedText = normalizeComparableCopy(text);
  return terms.some((term) => normalizedText.includes(normalizeComparableCopy(term)));
}

export function listContentCatalogEntries(catalog) {
  if (Array.isArray(catalog)) {
    return catalog;
  }

  if (isRecord(catalog)) {
    return Object.values(catalog);
  }

  return [];
}

export function validateContentCatalog({
  kind,
  catalog,
  entries = listContentCatalogEntries(catalog),
  requiredFields = CONTENT_CATALOG_REQUIRED_FIELDS[kind] || [],
  playerFacingFields = DEFAULT_PLAYER_FACING_CATALOG_FIELDS,
  prohibitedPlayerFacingTerms = EXTERNAL_IP_PLAYER_FACING_TERMS,
  evaluateTextFunctions = false,
  textFunctionContext = {}
} = {}) {
  const errors = [];
  const knownKinds = new Set(Object.values(CONTENT_CATALOG_KIND));

  if (!knownKinds.has(kind)) {
    errors.push({
      type: "unknown-catalog-kind",
      kind
    });
  }

  const ids = new Set();
  const catalogEntries = listContentCatalogEntries(entries);

  catalogEntries.forEach((entry, index) => {
    const entryId = entry?.id || null;

    if (!entryId) {
      errors.push({
        type: "missing-entry-id",
        kind,
        index
      });
    } else if (ids.has(entryId)) {
      errors.push({
        type: "duplicate-entry-id",
        kind,
        entryId,
        index
      });
    } else {
      ids.add(entryId);
    }

    requiredFields.forEach((field) => {
      if (!hasRequiredValue(entry, field)) {
        errors.push({
          type: "missing-required-field",
          kind,
          entryId,
          index,
          field
        });
      }
    });

    playerFacingFields.forEach((field) => {
      const value = getFieldValue(entry, field);

      try {
        collectStrings(value, { evaluateTextFunctions, textFunctionContext }).forEach((text) => {
          findForbiddenTerms(text, prohibitedPlayerFacingTerms).forEach((term) => {
            errors.push({
              type: "external-ip-player-facing-term",
              kind,
              entryId,
              index,
              field,
              term
            });
          });
        });
      } catch (error) {
        errors.push({
          type: "player-facing-text-function-error",
          kind,
          entryId,
          index,
          field,
          message: error?.message || String(error)
        });
      }
    });
  });

  return Object.freeze({
    valid: errors.length === 0,
    entriesChecked: catalogEntries.length,
    errors: Object.freeze(errors.map((error) => Object.freeze(error)))
  });
}

export function getContentCatalogValidationErrors(options = {}) {
  return validateContentCatalog(options).errors;
}

export function getObjectiveConsequenceCopyErrors({
  catalog,
  entries = listContentCatalogEntries(catalog),
  titleField = "title",
  copyFields = ["description", "body", "guidance"],
  consequenceTerms = OBJECTIVE_CONSEQUENCE_TERMS,
  evaluateTextFunctions = false,
  textFunctionContext = {}
} = {}) {
  const errors = [];
  const catalogEntries = listContentCatalogEntries(entries);

  catalogEntries.forEach((entry, index) => {
    const entryId = entry?.id || null;
    const title = getFieldValue(entry, titleField);
    const normalizedTitle = normalizeComparableCopy(title);

    copyFields.forEach((field) => {
      const value = getFieldValue(entry, field);
      const strings = collectStrings(value, { evaluateTextFunctions, textFunctionContext });

      strings.forEach((text) => {
        const normalizedText = normalizeComparableCopy(text);
        if (!normalizedText) {
          return;
        }

        if (normalizedTitle && normalizedText === normalizedTitle) {
          errors.push({
            type: "objective-copy-duplicates-title",
            entryId,
            index,
            field
          });
          return;
        }

        if (!hasConsequenceCopy(text, consequenceTerms)) {
          errors.push({
            type: "objective-copy-missing-consequence",
            entryId,
            index,
            field
          });
        }
      });
    });
  });

  return Object.freeze(errors.map((error) => Object.freeze(error)));
}

function getDialogueLineFunctionValues(line) {
  const rawValue =
    line?.lineFunction ??
    line?.function ??
    line?.utility ??
    line?.functions ??
    null;

  if (Array.isArray(rawValue)) {
    return rawValue;
  }

  return rawValue ? [rawValue] : [];
}

function listDialogueEntries(dialogues) {
  if (Array.isArray(dialogues)) {
    return dialogues;
  }

  if (isRecord(dialogues)) {
    return Object.values(dialogues);
  }

  return [];
}

export function getDialogueLineUtilityErrors({
  dialogues,
  entries = listDialogueEntries(dialogues),
  requireLineFunction = false,
  allowedFunctions = Object.values(DIALOGUE_LINE_FUNCTION)
} = {}) {
  const errors = [];
  const allowedFunctionSet = new Set(allowedFunctions);

  listDialogueEntries(entries).forEach((dialogue, dialogueIndex) => {
    const dialogueId = dialogue?.id || null;
    const lines = Array.isArray(dialogue?.lines) ?
      dialogue.lines :
      Array.isArray(dialogue) ?
        dialogue :
        [];

    lines.forEach((line, lineIndex) => {
      const lineId = line?.id || `${dialogueId || `dialogue-${dialogueIndex}`}-line-${lineIndex}`;
      const text = typeof line?.text === "string" ? line.text.trim() : "";
      const functions = getDialogueLineFunctionValues(line);

      if (!text) {
        errors.push({
          type: "dialogue-line-missing-text",
          dialogueId,
          lineId,
          lineIndex
        });
      }

      if (requireLineFunction && functions.length === 0) {
        errors.push({
          type: "dialogue-line-missing-function",
          dialogueId,
          lineId,
          lineIndex
        });
      }

      functions.forEach((lineFunction) => {
        if (!allowedFunctionSet.has(lineFunction)) {
          errors.push({
            type: "dialogue-line-unknown-function",
            dialogueId,
            lineId,
            lineIndex,
            lineFunction
          });
        }
      });
    });
  });

  return Object.freeze(errors.map((error) => Object.freeze(error)));
}
