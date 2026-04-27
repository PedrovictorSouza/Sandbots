const pureExtractionPattern = {
  id: "pure-extraction",
  name: "Pure Extraction",
  description: "Function stays locally bounded and still exposes a good pure seam for extraction.",
  detect: {
    runtimeDependenciesCountMax: 0,
    externalWritesCountMax: 0,
    externalCallsCountMax: 0,
    hiddenInputsCountMax: 1,
    externalReadsCountMax: 2,
    anyOf: [
      { functionSourceSpanMin: 400 },
      { localCallsCountMin: 2 },
      { callsCountMin: 4 }
    ]
  },
  intervention: "Pure extraction",
  pipeline: "pure-extraction",
  executionBatch: "extract-first",
  transformation: "split local logic into smaller pure helpers",
  problemKey: "large-local-logic",
  problemName: "Large local logic block",
  priority: 2,
  getScore(signals) {
    return (
      6 +
      Math.min(Number(signals?.localCallsCount || 0), 4) * 3 +
      Math.min(Number(signals?.callsCount || 0), 5) +
      (Number(signals?.functionSourceSpan || 0) >= 400 ? 6 : 0)
    );
  },
  getReason() {
    return "superficie externa baixa, mas o bloco local ainda esta grande";
  }
};

export default pureExtractionPattern;
