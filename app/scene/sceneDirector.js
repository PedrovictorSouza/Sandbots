export function createSceneDirector({ flowController, scenes } = {}) {
  if (!flowController) {
    throw new Error("Scene director requires a flow controller.");
  }

  if (!scenes || typeof scenes !== "object") {
    throw new Error("Scene director requires a scene map.");
  }

  function getSceneDefinition(sceneId) {
    const sceneDefinition = scenes[sceneId];

    if (!sceneDefinition) {
      throw new Error(`Scene not registered: ${sceneId}`);
    }

    return sceneDefinition;
  }

  function enterScene(sceneId, context) {
    getSceneDefinition(sceneId).enter?.(context);
  }

  function exitScene(sceneId, context) {
    getSceneDefinition(sceneId).exit?.(context);
  }

  enterScene(flowController.getCurrent(), {
    previousSceneId: null,
    reason: "initial"
  });

  return {
    getCurrent() {
      return flowController.getCurrent();
    },
    is(sceneId) {
      return flowController.is(sceneId);
    },
    canTransition(sceneId) {
      return flowController.canTransition(sceneId);
    },
    blocksGameplayInput() {
      return Boolean(getSceneDefinition(flowController.getCurrent()).blocksGameplayInput);
    },
    transition(nextSceneId, context = {}) {
      const currentSceneId = flowController.getCurrent();

      if (nextSceneId === currentSceneId) {
        return currentSceneId;
      }

      if (!flowController.canTransition(nextSceneId)) {
        throw new Error(`Invalid scene transition: ${currentSceneId} -> ${nextSceneId}`);
      }

      exitScene(currentSceneId, {
        ...context,
        nextSceneId
      });
      flowController.transition(nextSceneId);
      enterScene(nextSceneId, {
        ...context,
        previousSceneId: currentSceneId
      });
      return nextSceneId;
    },
    handleKeydown(event) {
      return Boolean(getSceneDefinition(flowController.getCurrent()).handleKeydown?.(event));
    },
    handleKeyup(event) {
      return Boolean(getSceneDefinition(flowController.getCurrent()).handleKeyup?.(event));
    }
  };
}
