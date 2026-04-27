const orchestrationOverloadPattern = {
  id: "orchestration-overload",
  name: "Orchestration Overload",
  description: "Function coordinates too many local and external steps in one place.",
  detect: {
    anyOf: [
      { localCallsCountMin: 4 },
      { externalCallsCountMin: 3 },
      {
        allOf: [
          { localCallsCountMin: 1 },
          { externalCallsCountMin: 1 },
          { callsCountMin: 6 }
        ]
      }
    ]
  },
  intervention: "Orchestration split",
  pipeline: "orchestration-split",
  executionBatch: "extract-first",
  transformation: "separate sequencing from subsystem work",
  problemKey: "orchestration-overload",
  problemName: "Orchestration overload",
  priority: 3,
  getScore(signals) {
    return (
      8 +
      Number(signals?.localCallsCount || 0) * 3 +
      Number(signals?.externalCallsCount || 0) * 4 +
      (Number(signals?.localCallsCount || 0) > 0 && Number(signals?.externalCallsCount || 0) > 0
        ? 5
        : 0)
    );
  },
  getReason(signals) {
    return `coordena ${signals?.localCallsCount || 0} chamada(s) locais e ${signals?.externalCallsCount || 0} externa(s)`;
  }
};

export default orchestrationOverloadPattern;
