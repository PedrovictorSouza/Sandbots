const manualSupervisionPattern = {
  id: "manual-supervision",
  name: "Manual Supervision",
  description: "Function touches a sensitive runtime boundary and should be planned under manual review.",
  detect: {
    manualSupervisionReasonsCountMin: 1
  },
  intervention: "Preserve boundary",
  pipeline: "manual-supervision",
  executionBatch: "manual-supervision",
  transformation: "protect the boundary first and avoid blind automation",
  problemKey: "runtime-boundary-pressure",
  problemName: "Runtime boundary pressure",
  priority: 9,
  getScore(signals) {
    return (
      24 +
      Number(signals?.manualSupervisionReasonsCount || 0) * 8 +
      Number(signals?.runtimeDependenciesCount || 0) * 3 +
      Number(signals?.externalWritesCount || 0) * 2
    );
  },
  getReason(signals) {
    const reasons = Array.isArray(signals?.manualSupervisionReasons)
      ? signals.manualSupervisionReasons
      : [];

    return reasons.length ? `sensivel por ${reasons.join(", ")}` : "borda sensivel pede revisao manual";
  },
  getActionLabel() {
    return "Planejar apenas e revisar manualmente";
  },
  getRationale(signals) {
    const reasons = Array.isArray(signals?.manualSupervisionReasons)
      ? signals.manualSupervisionReasons
      : [];

    return reasons.length ? `sensivel por ${reasons.join(", ")}` : "borda sensivel pede revisao manual";
  }
};

export default manualSupervisionPattern;
