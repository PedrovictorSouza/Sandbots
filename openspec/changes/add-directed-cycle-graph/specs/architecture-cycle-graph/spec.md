# architecture-cycle-graph Specification

## ADDED Requirements

### Requirement: Directed dependency graph

The system MUST generate a directed dependency graph for a configured set of
first-party JavaScript modules.

By default, the first-party application scope MUST include project-relative
JavaScript modules in:

- root-level game entry/orchestration files matching `*.js`
- `app/`
- `world/`
- `rendering/`
- `input/`
- `intro/`
- `tutorial/`
- `dialogue/`
- `story/`
- `ground/`
- `material/`
- `handbook/`

The default scope MUST exclude `tests/`, `e2e/`, `dist/`, `node_modules/`,
generated artifacts, binary/model/image assets, config files, and first-party
tooling packages under `packages/` unless those paths are explicitly included by
configuration.

#### Scenario: Default application roots are used

- **WHEN** the graph is generated without custom roots
- **THEN** it MUST analyze root-level game `*.js` modules and JavaScript modules
  under `app/`, `world/`, `rendering/`, `input/`, `intro/`, `tutorial/`,
  `dialogue/`, `story/`, `ground/`, `material/` and `handbook/`
- **AND** it MUST NOT analyze tests, build output, assets or `packages/` by
  default.

#### Scenario: Custom roots extend the default scope

- **WHEN** configuration explicitly includes additional first-party roots such as
  `packages/pragt-css/src/`
- **THEN** the graph MUST analyze JavaScript modules under those configured roots
- **AND** explicit includes MUST only override the default `packages/` exclusion for
  the configured path subtree.

#### Scenario: Ignored filesystem roots are not scanned

- **WHEN** the project contains JavaScript files under `node_modules/`, `dist/` or
  generated artifact directories
- **THEN** the default graph MUST NOT scan those files
- **AND** those files MUST NOT appear as internal graph nodes.

#### Scenario: Static import creates a directed edge

- **WHEN** `app/runtime/createEngineRuntime.js` imports `./gameLoop.js`
- **THEN** the graph MUST include the edge
  `app/runtime/createEngineRuntime.js -> app/runtime/gameLoop.js`
- **AND** the edge MUST preserve the importer-to-imported direction.

#### Scenario: Re-export creates a directed edge

- **WHEN** a module exports symbols from another first-party module
- **THEN** the graph MUST include an edge from the re-exporting module to the
  re-exported module.

#### Scenario: External dependency is excluded by default

- **WHEN** a module imports `react`, `vite`, `@playwright/test` or another package
  dependency
- **THEN** the default graph MUST NOT create an internal node for that package
- **AND** it MUST NOT resolve that package import into `node_modules/`
- **AND** the report MAY count the package as external metadata.

#### Scenario: Path ids are stable

- **WHEN** the same module is referenced through equivalent relative paths
- **THEN** the graph MUST normalize those references to one stable project-relative
  node id.

#### Scenario: Node ids are canonical project-relative paths

- **WHEN** an internal module is added to the graph
- **THEN** its node id MUST be a project-relative path using `/` separators
- **AND** the id MUST NOT include absolute path prefixes, `./`, `../` segments, URL
  prefixes or platform-specific separators.

#### Scenario: Equivalent specifiers resolve to one node

- **WHEN** imports such as `./gameLoop`, `./gameLoop.js` and
  `../runtime/gameLoop.js` resolve to the same first-party file
- **THEN** the graph MUST create exactly one internal node for that file
- **AND** every edge to that file MUST target the same canonical node id.

#### Scenario: Directory index imports are canonicalized

- **WHEN** an import resolves through a directory index file
- **THEN** the graph MUST use the resolved index file path as the node id
- **AND** equivalent imports of the directory and the index file MUST point to the
  same node.

### Requirement: Import reference parsing

The system MUST parse supported JavaScript dependency references without executing
application code.

#### Scenario: Static import declarations are parsed

- **WHEN** a module contains named imports, default imports, namespace imports or
  side-effect-only imports
- **THEN** each first-party import specifier MUST be resolved into a directed edge
  from the importing module to the imported module.

#### Scenario: Re-export declarations are parsed

- **WHEN** a module contains `export ... from` or `export * from`
- **THEN** each first-party re-export specifier MUST be resolved into a directed
  edge from the re-exporting module to the re-exported module.

#### Scenario: Literal dynamic imports are parsed

- **WHEN** a module contains `import("./someModule.js")` with a string literal
  specifier
- **THEN** the report MUST resolve that first-party specifier into a directed edge
- **AND** the edge metadata MUST mark the import kind as dynamic.

#### Scenario: Non-literal dynamic imports are conservative

- **WHEN** a module contains `import(variableName)` or another non-literal dynamic
  import
- **THEN** the graph MUST NOT invent an unresolved internal edge
- **AND** the report MUST include a warning that the dynamic import could not be
  statically resolved.

### Requirement: Directed edge report

The system MUST show all directed edges in a human-readable section.

Each edge MUST use canonical project-relative node ids and preserve the direction
`source -> target`, where `source` is the importing module and `target` is the
imported module.

#### Scenario: Edge payload preserves direction

- **WHEN** module `A` imports module `B`
- **THEN** the graph MUST create an edge whose source is `A` and target is `B`
- **AND** it MUST NOT create the reverse edge unless `B` also imports `A`.

#### Scenario: Edge metadata identifies import kind

- **WHEN** an edge is created from a static import, re-export or dynamic import
- **THEN** the edge SHOULD include metadata for import kind and original specifier
  when available.

#### Scenario: Edge list is complete for scope

- **WHEN** the report is generated for a configured scope
- **THEN** every resolved first-party dependency edge in that scope MUST appear in an
  edge list using the format `source -> target`.

#### Scenario: Edge list is deterministic

- **WHEN** the edge list is emitted
- **THEN** edges MUST be sorted by `source`, then `target`, then import kind.

#### Scenario: Graph artifact uses visible arrows

- **WHEN** a graph artifact is emitted
- **THEN** it MUST use a directed format with visible arrows, such as Mermaid
  `source --> target` or DOT `source -> target`.

#### Scenario: Graph artifact covers the scoped graph

- **WHEN** a Mermaid or DOT artifact is emitted
- **THEN** it MUST include every internal node and directed edge from the configured
  scope unless a documented output filter is enabled.

### Requirement: Directed cycle detection

The system MUST detect directed dependency cycles in the graph.

#### Scenario: Strongly connected component is detected

- **GIVEN** two or more modules can reach each other through directed dependency
  paths
- **WHEN** the cycle report is generated
- **THEN** the report MUST group those modules as a strongly connected component
- **AND** the component MUST include the directed edges that keep it connected.

#### Scenario: Self import is reported separately

- **GIVEN** a module resolves an import back to its own canonical node id
- **WHEN** the cycle report is generated
- **THEN** the report MUST classify it as a self-cycle
- **AND** it MUST distinguish that finding from two-node and multi-node cycles.

#### Scenario: Two-node cycle is reported

- **GIVEN** module `A` imports module `B`
- **AND** module `B` imports module `A`
- **WHEN** the cycle report is generated
- **THEN** it MUST report a directed cycle path equivalent to `A -> B -> A`.

#### Scenario: Multi-node cycle is reported

- **GIVEN** module `A` imports `B`
- **AND** module `B` imports `C`
- **AND** module `C` imports `A`
- **WHEN** the cycle report is generated
- **THEN** it MUST report a directed cycle path equivalent to `A -> B -> C -> A`.

#### Scenario: Acyclic graph has no cycle findings

- **GIVEN** all directed dependencies in scope form an acyclic graph
- **WHEN** the cycle report is generated
- **THEN** it MUST state that no directed cycles were found.

#### Scenario: Cycle paths are representative and deterministic

- **WHEN** a strongly connected component contains multiple possible cycle paths
- **THEN** the report MUST include at least one representative directed cycle path
- **AND** the selected path order MUST be deterministic for the same graph.

### Requirement: Dangerous coupling findings

The system MUST identify dangerous coupling patterns and explain why each finding is
risky.

Each finding MUST include a stable id, severity, involved node ids, involved edge
ids when available, and a short rationale.

#### Scenario: Subsystem boundary is classified

- **WHEN** an edge connects modules across runtime, rendering, camera, input, scene,
  UI or content boundaries
- **THEN** the report MUST classify the edge with the detected source and target
  subsystem labels
- **AND** the classification MUST be visible in the finding or edge metadata.

#### Scenario: Cross-boundary cycle is high risk

- **WHEN** a detected cycle crosses runtime, rendering, camera, input, scene, UI or
  content boundaries
- **THEN** the report MUST mark it as dangerous coupling
- **AND** the finding MUST include the involved edges, severity and rationale.

#### Scenario: Sensitive game-system edge is called out

- **WHEN** an edge points from low-level reusable logic into camera, render frame,
  stage, input handling or scene orchestration
- **THEN** the report MUST flag the edge as risky unless that direction is explicitly
  allowed by configuration.

#### Scenario: Bidirectional dependency is called out

- **WHEN** two first-party modules depend on each other directly or through a small
  strongly connected component
- **THEN** the report MUST identify the bidirectional coupling and show the directed
  edges that create it.

#### Scenario: Cross-subsystem cycle is called out

- **WHEN** a strongly connected component contains modules from more than one
  subsystem boundary
- **THEN** the report MUST flag the component as cross-subsystem coupling
- **AND** severity MUST be at least medium.

#### Scenario: Hub module risk is called out

- **WHEN** a module has unusually high fan-in or fan-out within the configured scope
- **THEN** the report MUST include a hub-risk finding when that concentration makes
  refactoring harder or increases blast radius.

#### Scenario: Finding rationale is concise

- **WHEN** a dangerous coupling finding is emitted
- **THEN** the rationale MUST explain the concrete risk in one or two sentences
- **AND** it MUST avoid recommending speculative rewrites as part of the rationale.

### Requirement: Safe refactor recommendations

The system MUST provide advisory refactor recommendations that preserve current
behavior.

Each recommendation MUST reference the finding it addresses and MUST avoid changing
source files automatically.

#### Scenario: Recommendation is non-mutating

- **WHEN** the graph report is generated
- **THEN** recommendations MUST NOT modify source files automatically
- **AND** every recommendation MUST be presented as an optional next step.

#### Scenario: Recommendation includes smallest safe move

- **WHEN** a dangerous coupling finding has a plausible local improvement
- **THEN** the recommendation MUST describe the smallest behavior-preserving move,
  such as surfacing dependencies, extracting pure helpers, extracting data/config, or
  introducing a narrow boundary adapter.

#### Scenario: Recommendation avoids first-step runtime rewrites

- **WHEN** a finding involves camera, stage, render frame, input or scene flow
- **THEN** the recommendation MUST avoid proposing direct behavior rewrites as the
  first step unless smaller dependency moves are not available.

#### Scenario: Recommendation includes validation

- **WHEN** a recommendation is emitted
- **THEN** it MUST include a validation path, such as targeted unit tests, smoke tests
  or a build command relevant to the affected modules.

#### Scenario: Recommendation is tied to involved edges

- **WHEN** a recommendation addresses a cycle or risky dependency
- **THEN** it MUST name the involved edge or cycle id
- **AND** it MUST explain which dependency direction would become less coupled.

#### Scenario: Recommendation preserves game behavior

- **WHEN** a recommendation involves gameplay, camera, render frame, input, stage,
  cinematic, tutorial or overlay modules
- **THEN** it MUST state the behavior that should remain unchanged
- **AND** it MUST prefer validation through existing focused tests before broader
  end-to-end checks.

### Requirement: Deterministic machine-readable output

The system MUST support deterministic machine-readable output for follow-up tools.

#### Scenario: JSON output is stable

- **WHEN** the same source tree and configuration are analyzed twice
- **THEN** the JSON output MUST have stable node ordering, edge ordering and finding
  ordering.

#### Scenario: Human report references machine ids

- **WHEN** the human-readable report lists cycles, findings or recommendations
- **THEN** each item SHOULD include a stable id that can be matched to the JSON output.

### Requirement: Verification coverage

The implementation MUST include focused verification for graph construction, cycle
detection, exclusions, coupling classification and report determinism.

#### Scenario: Fixture graphs cover cycle shapes

- **WHEN** unit tests run against fixture modules
- **THEN** they MUST cover acyclic graphs, two-node cycles and multi-node cycles
- **AND** they SHOULD cover a self-cycle fixture when the resolver can create one.

#### Scenario: Path normalization and exclusions are tested

- **WHEN** unit tests run against resolver fixtures
- **THEN** they MUST verify equivalent specifiers map to one canonical node id
- **AND** they MUST verify `node_modules/`, `dist/`, generated artifacts and
  external package names are excluded from internal nodes.

#### Scenario: Dangerous coupling classification is tested

- **WHEN** classifier tests run against representative graph fixtures
- **THEN** they MUST verify cross-boundary cycles, bidirectional dependencies and
  hub-risk findings include severity, involved edges and rationale.

#### Scenario: Report command is deterministic

- **WHEN** the report command runs twice against the same fixture project
- **THEN** both runs MUST exit successfully
- **AND** both runs MUST produce equivalent sorted JSON output.

### Requirement: Additive implementation guardrails

The implementation MUST treat already implemented game/application modules as
read-only analysis inputs.

#### Scenario: Existing game modules are not modified

- **WHEN** this change is implemented
- **THEN** existing modules that belong to gameplay, runtime, rendering, camera,
  input, scenes, UI, content, world or assets MUST NOT be modified
- **AND** the analyzer MUST read those modules only as source input.

#### Scenario: Analyzer code is isolated

- **WHEN** production analyzer code is added
- **THEN** it MUST live in a dedicated analyzer/tooling location
- **AND** it MUST NOT be interleaved into existing runtime, rendering, camera, input,
  scene or UI modules.

#### Scenario: Existing behavior edit requires a separate change

- **WHEN** implementation appears to require editing an already implemented
  game/application behavior
- **THEN** work on this change MUST stop before that edit
- **AND** the behavior edit MUST be proposed as a separate scoped change.

### Requirement: TDD implementation workflow

The implementation MUST be developed with test-driven development.

#### Scenario: Failing test precedes production behavior

- **WHEN** a parser, resolver, graph, cycle, classifier or report behavior is added
- **THEN** a focused test or fixture expectation for that behavior MUST be added or
  updated before production analyzer code is changed
- **AND** the implementation notes SHOULD identify the failing test that drove the
  production change.

#### Scenario: Minimal production code follows the test

- **WHEN** a focused test defines the next behavior
- **THEN** the production change MUST be the smallest analyzer-only change needed to
  make that test pass
- **AND** unrelated refactors MUST be deferred.

#### Scenario: TDD verification closes each step

- **WHEN** a TDD step is completed
- **THEN** the focused test MUST pass
- **AND** the relevant deterministic report or fixture verification MUST pass before
  moving to the next behavior.
