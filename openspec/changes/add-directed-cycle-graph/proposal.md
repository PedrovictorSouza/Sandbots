# Change: Directed cycle graph for application coupling

## Why

The project has several sensitive game boundaries: runtime boot, session assembly,
rendering, camera, input, scenes, UI overlays and content data. Refactoring inside
those areas without a dependency map can accidentally move coupling, hide cycles or
change scene behavior.

We need a small, repeatable architecture report that shows the directed dependency
edges of the application, highlights directed cycles, points out dangerous coupling,
and proposes incremental refactors that preserve the existing system.

## What Changes

- Add a static dependency analysis capability for first-party JavaScript modules.
- Generate a directed graph where each edge is shown as `importer -> imported`.
- Detect directed cycles and report the exact cycle paths.
- Classify dangerous coupling with explicit reasons, especially around game runtime,
  rendering, camera, input, scene flow and UI overlay boundaries.
- Produce refactor suggestions that are advisory only, incremental, and paired with a
  validation path.
- Implement the analyzer additively, treating the existing game/application code as
  read-only input.
- Require a TDD workflow for the implementation: failing focused test first, minimal
  production code second, passing test third.

## Non-Goals

- Do not automatically rewrite source files.
- Do not modify already implemented game/application modules to make the analyzer or
  report work.
- Do not change game stage, camera, render frame, input behavior or scene flow as
  part of the graph generation.
- Do not perform the suggested refactors as part of this change.
- Do not require understanding the whole project before producing a scoped report.
- Do not treat third-party packages as internal graph nodes unless explicitly
  configured.

## Expected Outputs

The report should include:

- A complete directed edge list for the configured scope.
- A directed graph artifact, preferably Mermaid or DOT, with visible arrows.
- A list of detected cycles, grouped by strongly connected component when useful.
- Dangerous coupling findings with severity, involved edges and rationale.
- Safe refactor suggestions that explain the smallest behavior-preserving next step.

## Risk And Mitigation

- Static import analysis can miss runtime references. The report must state that it is
  static and conservative.
- Large graphs can be noisy. The implementation should support scoped roots and
  filtered report sections.
- Game systems are sensitive. Suggestions must prefer dependency surfacing,
  extraction of pure data/helpers, and boundary adapters before any runtime flow
  change.
- Existing behavior must remain untouched. If implementation needs to edit current
  game/application modules, stop and split that into a separate change.
- TDD reduces analyzer risk. Each parser, resolver, cycle detector and classifier
  behavior should be introduced with a focused failing fixture test before production
  code is added.
