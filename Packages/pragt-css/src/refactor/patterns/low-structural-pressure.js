const lowStructuralPressurePattern = {
  id: "low-structural-pressure",
  name: "Low Structural Pressure",
  description: "Function does not currently expose a dominant structural obstacle.",
  detect: {},
  intervention: "Keep as is",
  pipeline: "low-structural-pressure",
  executionBatch: "extract-first",
  transformation: "preserve the contract until a clearer seam appears",
  problemKey: "low-structural-pressure",
  problemName: "Low structural pressure",
  priority: 0,
  getScore() {
    return 1;
  },
  getReason() {
    return "superficie estrutural enxuta para o tamanho atual";
  }
};

export default lowStructuralPressurePattern;
