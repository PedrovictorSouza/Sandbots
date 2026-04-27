const autoSafePattern = {
  id: "auto-safe",
  name: "Auto-safe",
  description: "Function is already structurally light and safe for low-review automation.",
  detect: {
    categoryEquals: "puras",
    runtimeDependenciesCountMax: 0,
    externalWritesCountMax: 0,
    hiddenInputsCountMax: 0,
    riskScoreMax: 18
  },
  intervention: "Keep as is",
  pipeline: "auto-safe",
  executionBatch: "auto-safe",
  transformation: "keep the contract stable and only extract when batching benefits justify it",
  problemKey: "low-structural-pressure",
  problemName: "Low structural pressure",
  priority: 10,
  getScore(signals) {
    return 28 + Math.max(0, 18 - Number(signals?.riskScore || 0));
  },
  getReason() {
    return "superficie pura e pequena";
  },
  getActionLabel() {
    return "Pode entrar em lote com revisao leve";
  },
  getRationale() {
    return "superficie pura e pequena";
  }
};

export default autoSafePattern;
