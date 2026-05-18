export const DEFAULT_GAME_HUD_INITIAL_STATUS = "Initializing scene...";

export type GameHudControllerConfig = {
  initialStatus?: string;
};

export function resolveGameHudInitialStatus({
  initialStatus
}: GameHudControllerConfig = {}): string {
  return initialStatus ?? DEFAULT_GAME_HUD_INITIAL_STATUS;
}
