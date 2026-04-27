export function createLazyModuleHandle(loadFactory, { onError = console.error } = {}) {
  let instance = null;
  let pendingLoad = null;
  let queuedCalls = [];

  async function ensureLoaded() {
    if (instance) {
      return instance;
    }

    if (!pendingLoad) {
      pendingLoad = Promise.resolve()
        .then(() => loadFactory())
        .then((loadedInstance) => {
          instance = loadedInstance;
          pendingLoad = null;

          const callsToReplay = queuedCalls;
          queuedCalls = [];

          for (const call of callsToReplay) {
            loadedInstance?.[call.methodName]?.(...call.args);
          }

          return loadedInstance;
        })
        .catch((error) => {
          pendingLoad = null;
          queuedCalls = [];
          onError(error);
          throw error;
        });
    }

    return pendingLoad;
  }

  function invoke(methodName, args = [], { defaultValue, replayIfUnloaded = false } = {}) {
    if (instance) {
      return instance?.[methodName]?.(...args);
    }

    if (replayIfUnloaded) {
      queuedCalls.push({ methodName, args });
    }

    void ensureLoaded();
    return typeof defaultValue === "function" ? defaultValue() : defaultValue;
  }

  return {
    preload: ensureLoaded,
    isLoaded() {
      return Boolean(instance);
    },
    getInstance() {
      return instance;
    },
    invoke
  };
}
