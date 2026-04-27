const dependencySurfacingPattern = {
  id: "dependency-surfacing",
  name: "Dependency-Injection Surfacing",
  description:
    "Function shows high global state coupling and should surface those dependencies explicitly.",
  detect: {
    anyOf: [
      {
        externalReadsCountMin: 4
      },
      {
        externalCouplingCountMin: 6
      },
      {
        allOf: [
          { externalReadsCountMin: 2 },
          { hiddenInputsCountMin: 2 }
        ]
      }
    ],
    not: {
      anyOf: [
        { hiddenInputsCountMin: 4 },
        { externalReadsCountMin: 8 },
        {
          allOf: [
            { roleEquals: "Action Handler" },
            { hiddenInputsCountMin: 2 },
            { externalReadsCountMin: 6 }
          ]
        }
      ]
    }
  },
  intervention: "Dependency-injection surfacing",
  pipeline: "dependency-injection-surfacing",
  executionBatch: "extract-first",
  transformation: "turn hidden reads into explicit inputs before deeper extraction",
  problemKey: "external-dependency-load",
  problemName: "High global state coupling",
  priority: 5,
  getScore(signals) {
    return (
      10 +
      Number(signals?.externalReadsCount || 0) * 3 +
      Number(signals?.hiddenInputsCount || 0) * 2 +
      Number(signals?.externalCouplingCount || 0)
    );
  },
  getReason(signals) {
    return signals?.externalReadsCount >= 7
      ? `leituras externas altas (${signals.externalReadsCount})`
      : `external coupling ${signals?.externalCoupling?.level || "low"} (${signals?.externalCoupling?.reads?.length || 0} reads, ${signals?.externalCoupling?.calls?.length || 0} calls, ${signals?.externalCoupling?.constants?.length || 0} constants)`;
  }
};

export default dependencySurfacingPattern;
