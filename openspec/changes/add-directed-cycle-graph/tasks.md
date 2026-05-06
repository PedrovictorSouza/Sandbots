# Tasks

Checklist for proposal/spec definition. Implementation remains a separate step after
this OpenSpec change is accepted.

## 1. Scope And Resolution

- [x] Define the default first-party roots for the graph.
- [x] Exclude `node_modules`, `dist`, generated artifacts and external package names.
- [x] Normalize module paths so every internal node has one stable id.
- [x] Support root-level game modules and nested modules under `app/`, `world/`,
  `rendering/`, `input/`, `intro/`, `tutorial/`, `dialogue/` and `packages/` when
  included by configuration.

## 2. Directed Graph

- [x] Parse static `import`, `export ... from` and supported dynamic `import()`
  references.
- [x] Build directed edges as `source -> target`, where `source` is the importing
  module and `target` is the imported module.
- [x] Emit a complete edge list.
- [x] Emit a directed graph format with arrows, such as Mermaid or DOT.

## 3. Cycle Detection

- [x] Detect strongly connected components with more than one module.
- [x] Report representative directed cycle paths.
- [x] Distinguish file-local self imports, two-node cycles and multi-node cycles.
- [x] Keep output deterministic by sorting nodes and edges.

## 4. Dangerous Coupling Findings

- [x] Classify risky edges across runtime, rendering, camera, input, scene, UI and
  content boundaries.
- [x] Flag bidirectional dependencies and cycles that cross subsystem boundaries.
- [x] Flag high fan-in or high fan-out modules when they increase refactor risk.
- [x] Include severity, involved edges and a short rationale for each finding.

## 5. Safe Refactor Suggestions

- [x] Suggest behavior-preserving steps only.
- [x] Prefer dependency surfacing, pure helper extraction, data/config extraction or
  boundary adapters before runtime rewrites.
- [x] Include a validation recommendation for each suggestion.
- [x] Avoid suggesting camera, stage, render frame or scene-flow changes as a first
  step unless the report proves that smaller moves cannot reduce the coupling.

## 6. Tests And Verification

- [x] Define required unit tests with fixture graphs for acyclic, two-node cycle and
  multi-node cycle cases.
- [x] Define required tests for path normalization and external dependency exclusion.
- [x] Define required tests for dangerous coupling classification.
- [x] Define required verification that the report command exits successfully and
  produces deterministic output.

## 7. Implementation Guardrails

- [x] Define that already implemented game/application modules are read-only inputs
  for this change.
- [x] Define that analyzer implementation must be additive and isolated from runtime,
  rendering, camera, input, scene and UI code.
- [x] Define TDD as the required implementation workflow: failing focused test first,
  minimal production code second, passing verification third.
- [x] Define that any required edit to existing game/application behavior must stop
  this change and become a separate proposal.
