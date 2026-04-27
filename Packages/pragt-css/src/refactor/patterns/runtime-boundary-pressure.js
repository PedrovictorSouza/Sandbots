const runtimeBoundaryPressurePattern = {
  id: "runtime-boundary-pressure",
  name: "Runtime Boundary Pressure",
  description: "Function leans on runtime APIs or browser boundaries that should be protected before deeper refactors.",
  detect: {
    runtimeDependenciesCountMin: 1
  },
  intervention: "Preserve boundary",
  pipeline: "boundary-first",
  executionBatch: "extract-first",
  transformation: "stabilize the boundary before moving logic across it",
  problemKey: "runtime-boundary-pressure",
  problemName: "Runtime boundary pressure",
  priority: 8,
  getScore(signals) {
    return (
      18 +
      Number(signals?.runtimeDependenciesCount || 0) * 4 +
      Number(signals?.externalCallsCount || 0) * 2 +
      Number(signals?.externalWritesCount || 0) * 3 +
      (signals?.runtimeDirect?.level === "high" ? 4 : 0)
    );
  },
  getReason(signals) {
    const dependencies = Array.isArray(signals?.runtimeDependencies)
      ? signals.runtimeDependencies
      : [];

    return `runtime direto ${signals?.runtimeDirect?.level || "low"} (${dependencies.join(", ")})`;
  },
  getIntervention(signals) {
    return Number(signals?.externalWritesCount || 0) > 0 ||
      Number(signals?.externalCallsCount || 0) >= 4 ||
      Number(signals?.hiddenInputsCount || 0) >= 3
      ? "Preserve boundary"
      : "Refactor behind boundary";
  }
};

export default runtimeBoundaryPressurePattern;
