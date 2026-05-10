export const FIRST_CHOPPER_CINEMATIC_FLAG = "firstChopperCinematicSeen";

export function shouldPlayFirstChopperCinematic(storyState, {
  targetId = null,
  dialogueId = null
} = {}) {
  return Boolean(
    targetId === "tangrowth" &&
    dialogueId === "onboarding" &&
    !storyState?.flags?.[FIRST_CHOPPER_CINEMATIC_FLAG]
  );
}

export async function playFirstChopperCinematic({
  storyState,
  targetId,
  dialogueId,
  transitionVeil = null,
  focusConversation = () => {},
  openConversation = () => false,
  clearGameFlowInput = () => {}
} = {}) {
  if (!shouldPlayFirstChopperCinematic(storyState, { targetId, dialogueId })) {
    return openConversation();
  }

  storyState.flags ||= {};
  storyState.flags[FIRST_CHOPPER_CINEMATIC_FLAG] = true;
  clearGameFlowInput();

  await transitionVeil?.show?.();
  focusConversation();
  await transitionVeil?.hide?.();

  return openConversation();
}
