import {
  SMALL_ISLAND_STORY_BEATS,
  STORY_BEAT_EFFECT
} from "./storyBeatData.js";
import { getPlayerDisplayName } from "../player/playerProfile.js";

const PLAYER_NAME_TOKEN = /\{\{\s*playerName\s*\}\}/g;

function findPokedexEntryIdFromHabitats(habitats = []) {
  return habitats.find((habitat) => habitat?.pokedexEntryId)?.pokedexEntryId || null;
}

function normalizeFallbackLines(lines) {
  if (!Array.isArray(lines)) {
    return [];
  }

  return lines.map((line) => ({ ...line }));
}

function getInterpolationPlayerName(context = {}, playerProfile = null) {
  if (Object.prototype.hasOwnProperty.call(context, "playerName")) {
    return getPlayerDisplayName({ playerName: context.playerName });
  }

  return getPlayerDisplayName(
    context.playerProfile ||
    context.playerMemory ||
    playerProfile ||
    {}
  );
}

export function interpolateDialogueLine(line, context = {}, playerProfile = null) {
  if (!line || typeof line.text !== "string") {
    return { ...line };
  }

  return {
    ...line,
    text: line.text.replace(
      PLAYER_NAME_TOKEN,
      getInterpolationPlayerName(context, playerProfile)
    )
  };
}

function interpolateDialogueLines(lines, context = {}, playerProfile = null) {
  return normalizeFallbackLines(lines).map((line) => (
    interpolateDialogueLine(line, context, playerProfile)
  ));
}

export function createStoryBeatSystem({
  beats = SMALL_ISLAND_STORY_BEATS,
  dialogueSystem,
  gameplayDialogue,
  storyState,
  playerProfile = null,
  questSystem = null,
  pokedexRuntime = null,
  trackFieldTask = () => {},
  unlockPlayerSkill = () => {},
  pushNotice = () => {},
  effectHandlers = {}
} = {}) {
  if (!storyState?.flags) {
    throw new Error("StoryBeatSystem requires storyState.flags.");
  }

  function getBeat(beatId) {
    return beats[beatId] || null;
  }

  function getDialogueLines(beatId, context = {}) {
    const beat = getBeat(beatId);

    if (!beat) {
      return [];
    }

    const dialogueLines = beat.dialogueId ?
      dialogueSystem?.getConversation?.(beat.dialogueId) || [] :
      [];

    if (typeof beat.buildLines === "function") {
      return interpolateDialogueLines(
        beat.buildLines(context, { dialogueLines }),
        context,
        playerProfile
      );
    }

    return interpolateDialogueLines(
      dialogueLines.length ? dialogueLines : beat.fallbackLines,
      context,
      playerProfile
    );
  }

  function hasCompleted(beatId) {
    const beat = getBeat(beatId);

    return Boolean(beat?.onceFlag && storyState.flags[beat.onceFlag]);
  }

  function markCompleted(beatId) {
    const beat = getBeat(beatId);

    if (!beat?.onceFlag) {
      return false;
    }

    storyState.flags[beat.onceFlag] = true;
    return true;
  }

  function openPokedexEntry(entryId, options = {}) {
    if (!entryId) {
      return false;
    }

    pokedexRuntime?.unlock?.();
    pokedexRuntime?.setOpen?.(true, {
      markSeen: true,
      entryId,
      ...options
    });
    return true;
  }

  function openPokedexEntryForDiscoveredHabitat(habitats = [], options = {}) {
    return openPokedexEntry(findPokedexEntryIdFromHabitats(habitats), options);
  }

  function applyEffect(effect, context, beat) {
    if (!effect?.type) {
      return false;
    }

    if (effect.type === STORY_BEAT_EFFECT.QUEST_EVENT) {
      questSystem?.emit?.({
        ...effect.event,
        ...(effect.amount ? { amount: effect.amount } : {})
      });
      return true;
    }

    if (effect.type === STORY_BEAT_EFFECT.TRACK_FIELD_TASK) {
      trackFieldTask(effect.taskId);
      return true;
    }

    if (effect.type === STORY_BEAT_EFFECT.SET_FLAG) {
      storyState.flags[effect.flag] = Object.prototype.hasOwnProperty.call(effect, "value") ?
        effect.value :
        true;
      return true;
    }

    if (effect.type === STORY_BEAT_EFFECT.OPEN_POKEDEX_ENTRY) {
      return openPokedexEntry(
        effect.entryId || context?.entryId || context?.pokedexEntryId,
        effect.options || {}
      );
    }

    if (effect.type === STORY_BEAT_EFFECT.OPEN_DISCOVERED_HABITAT_POKEDEX) {
      return openPokedexEntryForDiscoveredHabitat(
        context?.discoveredHabitats || context?.newlyDiscoveredHabitats || [],
        effect.options || {}
      );
    }

    if (effect.type === STORY_BEAT_EFFECT.REGISTER_POKEDEX_REQUEST) {
      storyState.flags.pokedexRequestIds ||= [];
      const requestId = effect.requestId || context?.requestId;

      if (requestId && !storyState.flags.pokedexRequestIds.includes(requestId)) {
        storyState.flags.pokedexRequestIds.push(requestId);
      }

      return Boolean(requestId);
    }

    if (effect.type === STORY_BEAT_EFFECT.OPEN_POKEDEX_REQUEST) {
      const requestId = effect.requestId || context?.requestId;
      const entryId = effect.entryId || context?.entryId || context?.pokedexEntryId;

      if (!requestId) {
        return false;
      }

      pokedexRuntime?.unlock?.();
      pokedexRuntime?.setOpen?.(true, {
        markSeen: true,
        page: "requests",
        entryId,
        requestId
      });
      return true;
    }

    if (effect.type === STORY_BEAT_EFFECT.UNLOCK_SKILL) {
      unlockPlayerSkill(effect.skillId, effect.options || {});
      return true;
    }

    if (effect.type === STORY_BEAT_EFFECT.PUSH_NOTICE) {
      pushNotice(effect.message, effect.duration);
      return true;
    }

    if (effect.type === STORY_BEAT_EFFECT.CUSTOM) {
      effectHandlers[effect.handler]?.({
        beat,
        context,
        effect
      });
      return true;
    }

    return false;
  }

  function complete(beatId, context = {}) {
    const beat = getBeat(beatId);

    if (!beat) {
      return false;
    }

    markCompleted(beatId);

    for (const effect of beat.effects || []) {
      applyEffect(effect, context, beat);
    }

    return true;
  }

  function playDialogue(beatId, {
    context = {},
    onLineChange,
    onBeforeCompleteEffects,
    onComplete
  } = {}) {
    const lines = getDialogueLines(beatId, context);
    let finished = false;

    const finish = () => {
      if (finished) {
        return;
      }

      finished = true;
      onBeforeCompleteEffects?.();
      complete(beatId, context);
      onComplete?.();
    };

    const opened = gameplayDialogue?.openConversation?.({
      lines,
      onLineChange,
      onComplete: finish
    });

    if (!opened) {
      finish();
    }

    return Boolean(opened);
  }

  return {
    complete,
    getBeat,
    getDialogueLines,
    hasCompleted,
    markCompleted,
    openPokedexEntry,
    openPokedexEntryForDiscoveredHabitat,
    playDialogue
  };
}
