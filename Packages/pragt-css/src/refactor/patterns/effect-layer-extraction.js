const effectLayerExtractionPattern = {
  id: "effect-layer-extraction",
  name: "Side-Effect Isolation",
  description: "Function mixes decision logic with external effects and should separate them.",
  detect: {
    externalWritesCountMin: 1,
    anyOf: [
      { externalReadsCountMin: 1 },
      { hiddenInputsCountMin: 1 },
      { localCallsCountMin: 1 },
      { externalCallsCountMin: 1 }
    ]
  },
  intervention: "Side-effect isolation",
  pipeline: "side-effect-isolation",
  executionBatch: "extract-first",
  transformation: "separate decision logic from effect application",
  problemKey: "logic-effect-mixing",
  problemName: "Logic/effect mixing",
  priority: 4,
  getScore(signals) {
    return (
      12 +
      Number(signals?.externalWritesCount || 0) * 4 +
      Number(signals?.localCallsCount || 0) +
      Number(signals?.externalCallsCount || 0) +
      (Number(signals?.externalReadsCount || 0) > 0 || Number(signals?.hiddenInputsCount || 0) > 0
        ? 4
        : 0)
    );
  },
  getReason(signals) {
    return `mistura decisao local com ${signals?.externalWritesCount || 0} escrita(s) externa(s)`;
  }
};

export default effectLayerExtractionPattern;
