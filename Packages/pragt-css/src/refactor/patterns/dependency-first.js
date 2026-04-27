const dependencyFirstPattern = {
  id: "dependency-first",
  name: "Dependency-Injection Surfacing",
  description:
    "Function carries enough high global state coupling that the first safe move is to surface dependencies explicitly.",
  detect: {
    anyOf: [
      {
        hiddenInputsCountMin: 4
      },
      {
        externalReadsCountMin: 8
      },
      {
        allOf: [
          { roleEquals: "Action Handler" },
          { hiddenInputsCountMin: 2 },
          { externalReadsCountMin: 6 }
        ]
      }
    ]
  },
  intervention: "Dependency-injection surfacing",
  pipeline: "dependency-injection-surfacing",
  executionBatch: "dependency-first",
  transformation: "surface external reads and hidden inputs before extraction",
  problemKey: "external-dependency-load",
  problemName: "High global state coupling",
  priority: 6,
  getScore(signals) {
    return (
      18 +
      Number(signals?.externalReadsCount || 0) * 3 +
      Number(signals?.hiddenInputsCount || 0) * 3 +
      Number(signals?.externalCouplingCount || 0)
    );
  },
  getReason(signals) {
    return signals?.externalReadsCount >= 8
      ? `leituras externas altas (${signals.externalReadsCount})`
      : "hidden e reads altos antes da primeira extracao";
  },
  getActionLabel() {
    return "Surface dependencies before extraction";
  },
  getRationale() {
    return "hidden e reads altos antes da primeira extracao";
  }
};

export default dependencyFirstPattern;
