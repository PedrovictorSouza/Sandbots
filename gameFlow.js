export const GAME_FLOW = Object.freeze({
  START: "start",
  INTRO: "intro",
  CINEMATIC: "cinematic",
  TUTORIAL: "tutorial",
  GAMEPLAY: "gameplay",
});

const GAME_FLOW_TRANSITIONS = Object.freeze({
  [GAME_FLOW.START]: new Set([GAME_FLOW.INTRO, GAME_FLOW.GAMEPLAY]),
  [GAME_FLOW.INTRO]: new Set([GAME_FLOW.CINEMATIC]),
  [GAME_FLOW.CINEMATIC]: new Set([GAME_FLOW.TUTORIAL, GAME_FLOW.GAMEPLAY]),
  [GAME_FLOW.TUTORIAL]: new Set([GAME_FLOW.GAMEPLAY]),
  [GAME_FLOW.GAMEPLAY]: new Set(),
});

function isKnownFlow(flow) {
  return Object.values(GAME_FLOW).includes(flow);
}

export function createGameFlowController({ initialFlow = GAME_FLOW.START, onChange = () => {} } = {}) {
  if (!isKnownFlow(initialFlow)) {
    throw new Error(`Fluxo inicial invalido: ${initialFlow}`);
  }

  let currentFlow = initialFlow;
  onChange({ previous: null, current: currentFlow });

  return {
    getCurrent() {
      return currentFlow;
    },
    is(flow) {
      return currentFlow === flow;
    },
    canTransition(nextFlow) {
      if (!isKnownFlow(nextFlow)) {
        return false;
      }

      if (nextFlow === currentFlow) {
        return true;
      }

      return GAME_FLOW_TRANSITIONS[currentFlow].has(nextFlow);
    },
    transition(nextFlow) {
      if (!isKnownFlow(nextFlow)) {
        throw new Error(`Fluxo desconhecido: ${nextFlow}`);
      }

      if (nextFlow === currentFlow) {
        return currentFlow;
      }

      if (!GAME_FLOW_TRANSITIONS[currentFlow].has(nextFlow)) {
        throw new Error(`Transicao de fluxo invalida: ${currentFlow} -> ${nextFlow}`);
      }

      const previous = currentFlow;
      currentFlow = nextFlow;
      onChange({ previous, current: currentFlow });
      return currentFlow;
    },
  };
}
