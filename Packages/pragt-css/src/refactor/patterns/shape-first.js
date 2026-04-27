const shapeFirstPattern = {
  id: "shape-first",
  name: "Input Normalization",
  description:
    "Function uses conditional logic based on object structure and performs implicit type inference from object structure.",
  detect: {
    sameParamMemberAccessMin: 3,
    runtimeDependenciesCountMax: 0,
    externalWritesCountMax: 0
  },
  intervention: "Input normalization (descriptor extraction)",
  pipeline: "input-normalization",
  executionBatch: "shape-first",
  transformation: "Introduce intermediate representation and apply conditional normalization.",
  problemKey: "shape-based-conditional-logic",
  problemName: "Shape-based conditional logic",
  priority: 7,
  getScore(signals) {
    return (
      16 +
      Number(signals?.sameParamMemberAccess || 0) * 4 +
      Math.max(
        0,
        Number(signals?.hiddenInputsCount || 0) - Number(signals?.sameParamMemberAccess || 0)
      )
    );
  },
  getReason(signals) {
    return signals?.hiddenInputShape?.dominantRoot
      ? `conditional logic based on the structure of ${signals.hiddenInputShape.dominantRoot} (${signals.sameParamMemberAccess} member access points)`
      : `implicit type inference from object structure (${signals?.sameParamMemberAccess || 0} member access points)`;
  },
  getActionLabel() {
    return "Normalize input before the main logic";
  },
  getRationale() {
    return "the function infers cases from the structure of the same input object";
  }
};

export default shapeFirstPattern;
