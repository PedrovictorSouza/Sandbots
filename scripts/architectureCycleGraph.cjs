#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const OUTPUT_PATH = path.join(PROJECT_ROOT, "docs", "architecture-cycle-graph.md");

const DEFAULT_DIR_ROOTS = [
  "app",
  "world",
  "rendering",
  "input",
  "intro",
  "tutorial",
  "dialogue",
  "story",
  "ground",
  "material",
  "handbook"
];

const EXCLUDED_DIRS = new Set([
  ".git",
  ".playwright",
  "dist",
  "node_modules",
  "test-results",
  "tests",
  "e2e",
  "Packages",
  "packages",
  "openspec"
]);

const ROOT_CONFIG_FILES = new Set([
  "vite.config.js",
  "vitest.config.js",
  "playwright.config.js",
  "pragt.config.js"
]);

const ASSET_EXTENSIONS = new Set([
  ".bin",
  ".css",
  ".docx",
  ".gif",
  ".glb",
  ".gltf",
  ".jpeg",
  ".jpg",
  ".json",
  ".log",
  ".md",
  ".png",
  ".svg",
  ".txt",
  ".webp"
]);

function toProjectPath(absolutePath) {
  return path.relative(PROJECT_ROOT, absolutePath).split(path.sep).join("/");
}

function fromProjectPath(projectPath) {
  return path.join(PROJECT_ROOT, ...projectPath.split("/"));
}

function isRootGameFile(fileName) {
  return (
    fileName.endsWith(".js") &&
    !ROOT_CONFIG_FILES.has(fileName) &&
    !fileName.endsWith(".config.js")
  );
}

function isDirectory(pathname) {
  try {
    return fs.statSync(pathname).isDirectory();
  } catch {
    return false;
  }
}

function isFile(pathname) {
  try {
    return fs.statSync(pathname).isFile();
  } catch {
    return false;
  }
}

function collectJsFiles(rootDir) {
  const files = [];

  function walk(currentDir) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!EXCLUDED_DIRS.has(entry.name)) {
          walk(path.join(currentDir, entry.name));
        }
        continue;
      }

      if (entry.isFile() && entry.name.endsWith(".js")) {
        files.push(toProjectPath(path.join(currentDir, entry.name)));
      }
    }
  }

  if (isDirectory(rootDir)) {
    walk(rootDir);
  }

  return files;
}

function collectScopeFiles() {
  const files = [];

  for (const entry of fs.readdirSync(PROJECT_ROOT, { withFileTypes: true })) {
    if (entry.isFile() && isRootGameFile(entry.name)) {
      files.push(entry.name);
    }
  }

  for (const root of DEFAULT_DIR_ROOTS) {
    files.push(...collectJsFiles(path.join(PROJECT_ROOT, root)));
  }

  return Array.from(new Set(files)).sort((left, right) => left.localeCompare(right));
}

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function collectImportSpecifiers(source) {
  const cleaned = stripComments(source);
  const specifiers = [];
  const patterns = [
    { kind: "static", regex: /\bimport\s+(?:[^'"();]*?\s+from\s+)?["']([^"']+)["']/g },
    { kind: "re-export", regex: /\bexport\s+(?:\*|\{[\s\S]*?\})\s+from\s+["']([^"']+)["']/g },
    { kind: "dynamic", regex: /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g }
  ];

  for (const pattern of patterns) {
    let match = pattern.regex.exec(cleaned);
    while (match) {
      specifiers.push({
        kind: pattern.kind,
        specifier: match[1]
      });
      match = pattern.regex.exec(cleaned);
    }
  }

  return specifiers;
}

function resolveRelativeModule(sourceId, specifier, fileSet) {
  if (!specifier.startsWith(".")) {
    return { type: "external" };
  }

  const sourceDir = path.dirname(fromProjectPath(sourceId));
  const basePath = path.resolve(sourceDir, specifier);
  const candidates = [];
  const ext = path.extname(basePath);

  if (ext) {
    candidates.push(basePath);
  } else {
    candidates.push(`${basePath}.js`);
    candidates.push(path.join(basePath, "index.js"));
  }

  for (const candidate of candidates) {
    const id = toProjectPath(candidate);
    if (fileSet.has(id)) {
      return { type: "internal", target: id };
    }
  }

  if (ASSET_EXTENSIONS.has(ext)) {
    return { type: "asset" };
  }

  for (const candidate of candidates) {
    if (isFile(candidate) || isDirectory(candidate)) {
      return { type: "out-of-scope", target: toProjectPath(candidate) };
    }
  }

  return { type: "unresolved" };
}

function addEdge(edgeMap, source, target, kind, specifier) {
  const key = `${source}\0${target}`;
  const existing = edgeMap.get(key) || {
    source,
    target,
    kinds: new Set(),
    specifiers: new Set()
  };
  existing.kinds.add(kind);
  existing.specifiers.add(specifier);
  edgeMap.set(key, existing);
}

function buildGraph(files) {
  const fileSet = new Set(files);
  const edgeMap = new Map();
  const warnings = [];
  const externalImports = new Map();

  for (const sourceId of files) {
    const source = fs.readFileSync(fromProjectPath(sourceId), "utf8");
    const imports = collectImportSpecifiers(source);

    for (const imported of imports) {
      const resolved = resolveRelativeModule(sourceId, imported.specifier, fileSet);

      if (resolved.type === "internal") {
        addEdge(edgeMap, sourceId, resolved.target, imported.kind, imported.specifier);
        continue;
      }

      if (resolved.type === "external") {
        externalImports.set(imported.specifier, (externalImports.get(imported.specifier) || 0) + 1);
        continue;
      }

      if (resolved.type === "out-of-scope") {
        warnings.push(
          `${sourceId}: ${imported.specifier} resolves outside the default graph scope`
        );
      } else if (resolved.type === "unresolved") {
        warnings.push(`${sourceId}: ${imported.specifier} could not be resolved`);
      }
    }
  }

  const edges = Array.from(edgeMap.values())
    .map((edge) => ({
      source: edge.source,
      target: edge.target,
      kinds: Array.from(edge.kinds).sort(),
      specifiers: Array.from(edge.specifiers).sort()
    }))
    .sort(compareEdges);

  return {
    nodes: files,
    edges,
    warnings: warnings.sort((left, right) => left.localeCompare(right)),
    externalImports: Array.from(externalImports.entries()).sort((left, right) =>
      left[0].localeCompare(right[0])
    )
  };
}

function compareEdges(left, right) {
  return (
    left.source.localeCompare(right.source) ||
    left.target.localeCompare(right.target) ||
    left.kinds.join(",").localeCompare(right.kinds.join(","))
  );
}

function buildAdjacency(nodes, edges) {
  const adjacency = new Map(nodes.map((node) => [node, []]));
  for (const edge of edges) {
    adjacency.get(edge.source).push(edge.target);
  }

  for (const targets of adjacency.values()) {
    targets.sort((left, right) => left.localeCompare(right));
  }

  return adjacency;
}

function detectStronglyConnectedComponents(nodes, edges) {
  const adjacency = buildAdjacency(nodes, edges);
  const indexByNode = new Map();
  const lowlinkByNode = new Map();
  const stack = [];
  const onStack = new Set();
  const components = [];
  let index = 0;

  function visit(node) {
    indexByNode.set(node, index);
    lowlinkByNode.set(node, index);
    index += 1;
    stack.push(node);
    onStack.add(node);

    for (const target of adjacency.get(node) || []) {
      if (!indexByNode.has(target)) {
        visit(target);
        lowlinkByNode.set(
          node,
          Math.min(lowlinkByNode.get(node), lowlinkByNode.get(target))
        );
      } else if (onStack.has(target)) {
        lowlinkByNode.set(
          node,
          Math.min(lowlinkByNode.get(node), indexByNode.get(target))
        );
      }
    }

    if (lowlinkByNode.get(node) === indexByNode.get(node)) {
      const component = [];
      let current = null;

      do {
        current = stack.pop();
        onStack.delete(current);
        component.push(current);
      } while (current !== node);

      component.sort((left, right) => left.localeCompare(right));
      components.push(component);
    }
  }

  for (const node of nodes) {
    if (!indexByNode.has(node)) {
      visit(node);
    }
  }

  return components
    .filter((component) => component.length > 1)
    .sort((left, right) => left[0].localeCompare(right[0]));
}

function findRepresentativeCycle(component, adjacency) {
  const componentSet = new Set(component);
  const start = component[0];
  const pathStack = [start];
  const visited = new Set([start]);

  function visit(node) {
    for (const target of adjacency.get(node) || []) {
      if (!componentSet.has(target)) {
        continue;
      }

      if (target === start) {
        return [...pathStack, start];
      }

      if (!visited.has(target)) {
        visited.add(target);
        pathStack.push(target);
        const cycle = visit(target);
        if (cycle) {
          return cycle;
        }
        pathStack.pop();
      }
    }

    return null;
  }

  return visit(start) || [...component, start];
}

function detectCycles(nodes, edges) {
  const adjacency = buildAdjacency(nodes, edges);
  const sccs = detectStronglyConnectedComponents(nodes, edges);
  const selfCycles = edges
    .filter((edge) => edge.source === edge.target)
    .map((edge) => ({
      id: `self:${edge.source}`,
      type: "self-cycle",
      path: [edge.source, edge.target],
      nodes: [edge.source],
      edges: [`${edge.source} -> ${edge.target}`]
    }));

  const componentCycles = sccs.map((component, index) => {
    const cyclePath = findRepresentativeCycle(component, adjacency);
    const componentSet = new Set(component);
    const componentEdges = edges
      .filter((edge) => componentSet.has(edge.source) && componentSet.has(edge.target))
      .map((edge) => `${edge.source} -> ${edge.target}`);

    return {
      id: `cycle:${String(index + 1).padStart(2, "0")}`,
      type: component.length === 2 ? "two-node-cycle" : "multi-node-cycle",
      path: cyclePath,
      nodes: component,
      edges: componentEdges
    };
  });

  return [...selfCycles, ...componentCycles];
}

function getBoundary(node) {
  if (node === "camera.js" || node.includes("Camera")) {
    return "camera";
  }
  if (node.startsWith("app/runtime/")) {
    return "runtime";
  }
  if (node.startsWith("rendering/")) {
    return "rendering";
  }
  if (node.startsWith("input/")) {
    return "input";
  }
  if (node.startsWith("app/scene/") || node.startsWith("app/scenes/")) {
    return "scene";
  }
  if (node.startsWith("app/ui/") || node === "pokedexOverlay.js" || node === "guidePanel.js") {
    return "ui";
  }
  if (
    node === "gameplayContent.js" ||
    node === "pokedexEntries.js" ||
    node === "winterBurrowData.js" ||
    node.startsWith("app/gameplay/") ||
    node.startsWith("dialogue/") ||
    node.startsWith("app/dialogue/") ||
    node.startsWith("app/quest/") ||
    node.startsWith("app/story/")
  ) {
    return "content";
  }
  if (node.startsWith("app/session/") || node === "app/gameSession.js") {
    return "session";
  }
  if (node.startsWith("world/") || node.startsWith("ground/")) {
    return "world";
  }
  if (node.startsWith("intro/") || node.startsWith("tutorial/")) {
    return "sequence";
  }
  if (node.startsWith("handbook/")) {
    return "handbook";
  }
  if (!node.includes("/")) {
    return "root";
  }
  return "other";
}

function isSensitiveBoundary(boundary, node) {
  return (
    boundary === "camera" ||
    boundary === "input" ||
    boundary === "scene" ||
    node.includes("renderFrame") ||
    node.includes("stageRuntime")
  );
}

function classifyFindings(nodes, edges, cycles) {
  const findings = [];
  const incoming = new Map(nodes.map((node) => [node, 0]));
  const outgoing = new Map(nodes.map((node) => [node, 0]));
  const edgeSet = new Set(edges.map((edge) => `${edge.source}\0${edge.target}`));

  for (const edge of edges) {
    incoming.set(edge.target, incoming.get(edge.target) + 1);
    outgoing.set(edge.source, outgoing.get(edge.source) + 1);
  }

  for (const cycle of cycles) {
    const boundaries = Array.from(new Set(cycle.nodes.map(getBoundary))).sort();
    if (boundaries.length > 1) {
      findings.push({
        id: `finding:cycle:${cycle.id.split(":")[1]}`,
        severity: "high",
        kind: "cross-boundary-cycle",
        nodes: cycle.nodes,
        edges: cycle.edges,
        rationale: `Cycle crosses ${boundaries.join(", ")} boundaries, so changes in one subsystem can pull behavior back through another subsystem.`
      });
    }
  }

  for (const edge of edges) {
    const sourceBoundary = getBoundary(edge.source);
    const targetBoundary = getBoundary(edge.target);

    if (
      sourceBoundary !== targetBoundary &&
      ["world", "content", "rendering", "handbook"].includes(sourceBoundary) &&
      isSensitiveBoundary(targetBoundary, edge.target)
    ) {
      findings.push({
        id: `finding:sensitive-edge:${findings.length + 1}`,
        severity: "medium",
        kind: "sensitive-game-boundary",
        nodes: [edge.source, edge.target],
        edges: [`${edge.source} -> ${edge.target}`],
        rationale: `${sourceBoundary} code points into ${targetBoundary} behavior, which can make camera, render, input or scene changes harder to isolate.`
      });
    }

    if (edgeSet.has(`${edge.target}\0${edge.source}`) && edge.source < edge.target) {
      findings.push({
        id: `finding:bidirectional:${findings.length + 1}`,
        severity: sourceBoundary === targetBoundary ? "medium" : "high",
        kind: "bidirectional-dependency",
        nodes: [edge.source, edge.target],
        edges: [`${edge.source} -> ${edge.target}`, `${edge.target} -> ${edge.source}`],
        rationale: "Two modules depend on each other directly, so either side is harder to move or test independently."
      });
    }
  }

  const hubCandidates = nodes
    .map((node) => ({
      node,
      fanIn: incoming.get(node),
      fanOut: outgoing.get(node),
      score: incoming.get(node) + outgoing.get(node)
    }))
    .filter((item) => item.fanIn >= 6 || item.fanOut >= 8)
    .sort((left, right) => right.score - left.score || left.node.localeCompare(right.node))
    .slice(0, 10);

  for (const candidate of hubCandidates) {
    findings.push({
      id: `finding:hub:${candidate.node}`,
      severity: candidate.score >= 18 ? "high" : "medium",
      kind: "hub-risk",
      nodes: [candidate.node],
      edges: [],
      rationale: `${candidate.node} has fan-in ${candidate.fanIn} and fan-out ${candidate.fanOut}, increasing the blast radius of refactors around it.`
    });
  }

  return findings.sort((left, right) => left.id.localeCompare(right.id));
}

function buildRecommendations(findings) {
  return findings.map((finding) => {
    if (finding.kind === "cross-boundary-cycle") {
      return {
        findingId: finding.id,
        suggestion: "Break the cycle with dependency surfacing or a narrow boundary adapter before moving runtime behavior.",
        validation: "Run the focused tests for the involved runtime, scene, UI or world modules plus `npm run build`."
      };
    }

    if (finding.kind === "bidirectional-dependency") {
      return {
        findingId: finding.id,
        suggestion: "Extract the shared data or pure helper used by both modules into a third module, then point both directions at that helper.",
        validation: "Run the unit tests covering both modules named in the finding."
      };
    }

    if (finding.kind === "sensitive-game-boundary") {
      return {
        findingId: finding.id,
        suggestion: "Introduce an explicit input/config parameter at the boundary instead of importing sensitive runtime behavior from reusable logic.",
        validation: "Run targeted tests around camera, render frame, input or scene behavior before any broader e2e check."
      };
    }

    return {
      findingId: finding.id,
      suggestion: "Reduce hub pressure by extracting stable constants or pure helpers first, leaving orchestration behavior in place.",
      validation: "Run the smallest tests that cover callers of the hub module, then `npm run build`."
    };
  });
}

function mermaidId(node) {
  return `n_${node.replace(/[^A-Za-z0-9_]/g, "_")}`;
}

function renderMermaid(nodes, edges) {
  const lines = ["```mermaid", "flowchart TD"];
  for (const node of nodes) {
    lines.push(`  ${mermaidId(node)}["${node}"]`);
  }
  for (const edge of edges) {
    lines.push(`  ${mermaidId(edge.source)} --> ${mermaidId(edge.target)}`);
  }
  lines.push("```");
  return lines.join("\n");
}

function renderList(items, formatter, emptyText) {
  if (items.length === 0) {
    return `- ${emptyText}`;
  }
  return items.map(formatter).join("\n");
}

function renderReport(graph, cycles, findings, recommendations) {
  const isAcyclic = cycles.length === 0;
  const edgeCount = graph.edges.length;

  return `# Architecture Cycle Graph

Generated by \`npm run architecture:graph\`.

## Summary

- Nodes: ${graph.nodes.length}
- Directed edges: ${edgeCount}
- Directed cycles: ${cycles.length}
- DAG status: ${isAcyclic ? "acyclic" : "cyclic, so this is not a DAG yet"}
- Dangerous coupling findings: ${findings.length}

## Graph

${renderMermaid(graph.nodes, graph.edges)}

## Directed Edges

${renderList(
  graph.edges,
  (edge) => `- \`${edge.source} -> ${edge.target}\` (${edge.kinds.join(", ")})`,
  "No directed edges found."
)}

## Directed Cycles

${renderList(
  cycles,
  (cycle) => `- \`${cycle.id}\` ${cycle.type}: ${cycle.path.map((node) => `\`${node}\``).join(" -> ")}`,
  "No directed cycles found. The scoped graph is acyclic."
)}

## Dangerous Coupling

${renderList(
  findings,
  (finding) =>
    `- \`${finding.id}\` ${finding.severity} ${finding.kind}: ${finding.rationale}${
      finding.edges.length ? ` Edges: ${finding.edges.map((edge) => `\`${edge}\``).join(", ")}.` : ""
    }`,
  "No dangerous coupling findings found."
)}

## Refactor Suggestions

${renderList(
  recommendations,
  (recommendation) =>
    `- \`${recommendation.findingId}\`: ${recommendation.suggestion} Validation: ${recommendation.validation}`,
  "No refactor suggestions emitted."
)}

## External Imports

${renderList(
  graph.externalImports,
  ([specifier, count]) => `- \`${specifier}\` (${count})`,
  "No external package imports found in the scoped graph."
)}

## Warnings

${renderList(graph.warnings, (warning) => `- ${warning}`, "No unresolved or out-of-scope imports found.")}
`;
}

function main() {
  const files = collectScopeFiles();
  const graph = buildGraph(files);
  const cycles = detectCycles(graph.nodes, graph.edges);
  const findings = classifyFindings(graph.nodes, graph.edges, cycles);
  const recommendations = buildRecommendations(findings);
  const report = renderReport(graph, cycles, findings, recommendations);

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, report);

  console.log(`Wrote ${toProjectPath(OUTPUT_PATH)}`);
  console.log(
    `${graph.nodes.length} nodes, ${graph.edges.length} edges, ${cycles.length} cycles, ${findings.length} findings`
  );
}

main();
