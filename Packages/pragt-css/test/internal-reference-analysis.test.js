import test from "node:test";
import assert from "node:assert/strict";
import {
  buildInternalReferenceSummary,
  buildInternalReferenceViewModel,
  classifyInternalReference,
  mapConfidenceLevel,
  sortInternalReferences
} from "../src/react/internal-reference-analysis.js";

test("classifies style and hook internal references into useful semantic types", () => {
  assert.equal(classifyInternalReference("padding").type, "layout_style");
  assert.equal(classifyInternalReference("useState").type, "framework_hook");
  assert.equal(classifyInternalReference("path.join", "platform_api").type, "platform_api");
  assert.equal(classifyInternalReference("segments.length").type, "internal_value");
});

test("maps raw confidence scores into readable confidence levels", () => {
  assert.equal(mapConfidenceLevel(0.95).level, "high");
  assert.equal(mapConfidenceLevel(0.85).level, "medium-high");
  assert.equal(mapConfidenceLevel(0.75).level, "medium");
  assert.equal(mapConfidenceLevel(0.4).level, "low");
});

test("sorts internal references by semantic type, impact and confidence", () => {
  const sorted = sortInternalReferences([
    { reference: "right", referenceType: "layout_style", impact: "medium", confidence: 0.8 },
    { reference: "useState", referenceType: "framework_hook", impact: "medium", confidence: 0.85 },
    { reference: "padding", referenceType: "layout_style", impact: "high", confidence: 0.95 },
    { reference: "value", referenceType: "internal_value", impact: "high", confidence: 0.99 }
  ]);

  assert.deepEqual(sorted.map((entry) => entry.reference), ["useState", "padding", "right", "value"]);
});

test("builds a fast summary and groups internal references by function", () => {
  const viewModel = buildInternalReferenceViewModel({
    PragtCssTool: [
      { path: "useState", category: "unknown", impact: "medium", confidence: 0.95 },
      { path: "padding", category: "unknown", impact: "medium", confidence: 0.95 },
      { path: "position", category: "unknown", impact: "medium", confidence: 0.85 },
      { path: "zIndex", category: "unknown", impact: "medium", confidence: 0.85 }
    ]
  });

  assert.equal(viewModel.summary.totalReferences, 4);
  assert.match(viewModel.summary.headline, /4 references detected in PragtCssTool/i);
  assert.equal(viewModel.groups[0].functionName, "PragtCssTool");
  assert.equal(viewModel.groups[0].references[0].reference, "useState");
  assert.ok(viewModel.summary.categoryDistribution.some((entry) => entry.type === "framework_hook" && entry.count === 1));
  assert.ok(viewModel.summary.categoryDistribution.some((entry) => entry.type === "layout_style" && entry.count === 3));
  assert.ok(viewModel.summary.topSignals.some((entry) => /useState -> framework hook/i.test(entry.text)));
});

test("buildInternalReferenceSummary preserves category counts from enriched references", () => {
  const summary = buildInternalReferenceSummary([
    { functionName: "PragtCssTool", reference: "useState", referenceType: "framework_hook", referenceTypeLabel: "framework hook" },
    { functionName: "PragtCssTool", reference: "padding", referenceType: "layout_style", referenceTypeLabel: "layout/style" }
  ]);

  assert.equal(summary.totalReferences, 2);
  assert.equal(summary.functionCount, 1);
  assert.ok(summary.categoryDistribution.some((entry) => entry.type === "framework_hook"));
  assert.ok(summary.categoryDistribution.some((entry) => entry.type === "layout_style"));
});
