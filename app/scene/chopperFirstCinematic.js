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
  focusGuideTarget = null,
  performGuideAction = null,
  openConversation = () => false,
  clearGameFlowInput = () => {}
} = {}) {
  if (!shouldPlayFirstChopperCinematic(storyState, { targetId, dialogueId })) {
    return openConversation();
  }

  storyState.flags ||= {};
  storyState.flags[FIRST_CHOPPER_CINEMATIC_FLAG] = true;
  clearGameFlowInput();

  const hasGuideBeat =
    typeof focusGuideTarget === "function" ||
    typeof performGuideAction === "function";

  await transitionVeil?.show?.();
  if (hasGuideBeat) {
    focusGuideTarget?.();
  } else {
    focusConversation();
  }
  await transitionVeil?.hide?.();

  if (hasGuideBeat) {
    await performGuideAction?.();
    focusConversation();
  }

  return openConversation();
}
