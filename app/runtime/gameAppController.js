export function createGameAppController({
  createGameSession,
  sessionConfig,
  startGameLoop,
  loopConfig,
  onSessionReady
}) {
  return {
    async start() {
      const session = await createGameSession(sessionConfig);
      onSessionReady?.(session);
      startGameLoop({
        ...loopConfig,
        session
      });
      return session;
    }
  };
}
