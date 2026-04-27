import {
  CAMERA_LOOK_COMPLETE_DELAY,
  FOLLOW_SPEED,
  INSPECT_DISTANCE,
  NAME_CHAR_LIMIT,
  NAME_KEYBOARD_ROWS,
  OPENING_LINE,
  REPAIR_DISTANCE,
  SQUIRTLE_HELP_LINE,
  SQUIRTLE_NOTICE_DISTANCE,
  SQUIRTLE_TALK_DISTANCE,
  TALK_DISTANCE,
  getActTwoTutorialConversation,
  getActTwoTutorialFollowTarget
} from "./tutorial/actTwoTutorialContent.js";
import { renderActTwoTutorialMarkup } from "./tutorial/actTwoTutorialRenderers.js";
import { createDialogueTypewriter } from "./app/ui/dialogueTypewriter.js";

function isMoveKey(key) {
  return ["w", "a", "s", "d"].includes(key);
}

function isCameraLookKey(code) {
  return code === "ArrowLeft" || code === "ArrowRight";
}

function clampIndex(index, length) {
  return Math.max(0, Math.min(length - 1, index));
}

function normalizeNameChar(key) {
  if (!key || key.length !== 1) {
    return "";
  }

  if (/^[a-zA-Z]$/.test(key)) {
    return key.toUpperCase();
  }

  if (/^[#\[\]\$%\^&*()_@;"<>+=-]$/.test(key)) {
    return key;
  }

  if (key === "'" || key === ".") {
    return key;
  }

  return "";
}

function moveTowards2D(current, target, distance) {
  const dx = target[0] - current[0];
  const dz = target[2] - current[2];
  const length = Math.hypot(dx, dz);

  if (length <= distance || length === 0) {
    return {
      position: [target[0], current[1], target[2]],
      reached: true,
    };
  }

  const step = distance / length;
  return {
    position: [
      current[0] + dx * step,
      current[1],
      current[2] + dz * step,
    ],
    reached: false,
  };
}

export function createActTwoTutorial({
  root,
  uiLayer,
  onComplete = () => {},
  onAbilityUnlock = () => {},
  onSquirtleHeal = () => {},
  onPokedexReveal = () => {},
} = {}) {
  if (!(root instanceof HTMLElement)) {
    throw new Error("Act two tutorial root invalido.");
  }

  const state = {
    started: false,
    active: false,
    phase: "approach",
    conversationId: null,
    dialogueIndex: 0,
    selectedChoice: 0,
    monsterPosition: [0, 0, 0],
    squirtlePosition: [0, 0, 0],
    inspectablePosition: [0, 0, 0],
    repairPlantPosition: [0, 0, 0],
    followTargetId: null,
    followTargetReached: false,
    playerPosition: [0, 0, 0],
    playerNearMonster: false,
    playerNearSquirtleNotice: false,
    playerNearSquirtleTalk: false,
    playerNearInspectable: false,
    playerNearRepairPlant: false,
    squirtleDiscoveryTriggered: false,
    squirtleHealed: false,
    playerIdeaVisible: false,
    cameraLookRegistered: false,
    cameraDismissElapsed: 0,
    playerName: "",
    repairPlantFixed: false,
    waterGunLearned: false,
    pokedexRecovered: false,
    responses: {
      humanClaim: null,
      pokedexReaction: null,
      pokedexChoice: null,
      trainerLookChoice: null,
      playerName: "",
      nameConfirmation: null,
      worldQuestion: null,
    },
    visibleDialogueText: ""
  };

  let refs = null;
  const typewriter = createDialogueTypewriter({
    onTick: ({ visibleText }) => {
      state.visibleDialogueText = visibleText;
      render();
    }
  });

  function syncUiMode() {
    if (uiLayer instanceof HTMLElement) {
      uiLayer.dataset.mode = state.active ? "tutorial" : "game";
    }
  }

  function getFollowTarget() {
    return getActTwoTutorialFollowTarget(state);
  }

  function unlockAbility(abilityId) {
    if (!abilityId) {
      return;
    }

    if (abilityId === "waterGun" && state.waterGunLearned) {
      return;
    }

    if (abilityId === "waterGun") {
      state.waterGunLearned = true;
    }

    onAbilityUnlock(abilityId);
  }

  function getConversation(conversationId) {
    return getActTwoTutorialConversation(conversationId, state);
  }

  function getCurrentConversation() {
    return getConversation(state.conversationId);
  }

  function getCurrentLine() {
    return getCurrentConversation()[state.dialogueIndex] || null;
  }

  function getCurrentChoices() {
    if (!typewriter.isComplete()) {
      return null;
    }

    return getCurrentLine()?.choices || null;
  }

  function render() {
    syncUiMode();
    root.hidden = !state.active;
    root.innerHTML = renderActTwoTutorialMarkup({
      state,
      openingLine: OPENING_LINE,
      squirtleHelpLine: SQUIRTLE_HELP_LINE,
      currentLine: state.phase === "conversation" && getCurrentLine()
        ? { ...getCurrentLine(), text: state.visibleDialogueText }
        : getCurrentLine(),
      choices: getCurrentChoices(),
      followTarget: getFollowTarget(),
      nameCharLimit: NAME_CHAR_LIMIT,
      nameKeyboardRows: NAME_KEYBOARD_ROWS
    });

    refs = state.active
      ? {
          speech: root.querySelector("#act-two-speech"),
          squirtleSpeech: root.querySelector("#act-two-squirtle-speech"),
          playerThought: root.querySelector("#act-two-player-thought"),
        }
      : null;
  }

  function resetTutorialCursor() {
    state.conversationId = null;
    state.dialogueIndex = 0;
    state.selectedChoice = 0;
  }

  function beginPhase(phase, configure = () => {}) {
    typewriter.stop();
    state.visibleDialogueText = "";
    state.phase = phase;
    resetTutorialCursor();
    configure();
    render();
  }

  /*
  PRAGT
  tornar dependencies implicitas explicitas.
  */
  function finish() {
    typewriter.stop();
    state.visibleDialogueText = "";
    state.active = false;
    state.playerIdeaVisible = false;
    render();
    onComplete({
      humanClaim: state.responses.humanClaim,
      pokedexReaction: state.responses.pokedexReaction,
      pokedexChoice: state.responses.pokedexChoice,
      trainerLookChoice: state.responses.trainerLookChoice,
      playerName: state.responses.playerName,
      nameConfirmation: state.responses.nameConfirmation,
      worldQuestion: state.responses.worldQuestion,
      foundPokedex: state.pokedexRecovered || Boolean(state.responses.pokedexChoice),
      repairPlantFixed: state.repairPlantFixed,
      learnedWaterGun: state.waterGunLearned,
      unlockedDexEntry: state.repairPlantFixed,
    });
  }

  function startConversation(conversationId) {
    state.phase = "conversation";
    state.dialogueIndex = 0;
    state.selectedChoice = 0;
    state.conversationId = conversationId;
    if (conversationId !== "transformUnlock") {
      state.playerIdeaVisible = false;
    }
    typewriter.start(getCurrentLine()?.text || "");
    render();
  }

  function beginSquirtleDiscovery() {
    beginPhase("squirtle-discovery");
  }

  function beginSquirtleHint() {
    beginPhase("squirtle-hint");
  }

  function beginTransformMoment() {
    state.playerIdeaVisible = true;
    unlockAbility("transform");
    unlockAbility("waterGun");
    startConversation("transformUnlock");
  }

  function beginWaterGunPrompt() {
    beginPhase("squirtle-ability");
  }

  function beginPokedexReveal() {
    beginPhase("pokedex-reveal", () => {
      state.pokedexRecovered = true;
    });
    onPokedexReveal();
  }

  function beginCameraPrompt() {
    beginPhase("camera", () => {
      state.cameraLookRegistered = false;
      state.cameraDismissElapsed = 0;
    });
  }

  function beginInspectPrompt() {
    beginPhase("inspect");
  }

  function beginNameEntry() {
    beginPhase("name-entry", () => {
      state.playerName = state.responses.playerName || "";
    });
  }

  function beginFollow(followTargetId) {
    beginPhase("follow", () => {
      state.followTargetId = followTargetId;
      state.followTargetReached = false;
    });
  }

  function beginRepairPrompt() {
    beginPhase("repair");
  }

  function setPlayerName(nextValue) {
    if (state.playerName === nextValue) {
      return;
    }

    state.playerName = nextValue.slice(0, NAME_CHAR_LIMIT);
    render();
  }

  function appendNameChar(character) {
    if (state.phase !== "name-entry" || state.playerName.length >= NAME_CHAR_LIMIT) {
      return;
    }

    if (character === " ") {
      if (!state.playerName.length || state.playerName.endsWith(" ")) {
        return;
      }
      setPlayerName(`${state.playerName} `);
      return;
    }

    setPlayerName(`${state.playerName}${character}`);
  }

  function deleteNameChar() {
    if (state.phase !== "name-entry" || !state.playerName.length) {
      return;
    }

    setPlayerName(state.playerName.slice(0, -1));
  }

  function submitPlayerName() {
    if (state.phase !== "name-entry") {
      return;
    }

    const trimmedName = state.playerName.trim();
    if (!trimmedName) {
      return;
    }

    state.playerName = trimmedName;
    state.responses.playerName = trimmedName;
    startConversation("nameConfirm");
  }

  function resolveConversationChoice(choiceId) {
    const currentLine = getCurrentLine();
    if (!currentLine?.responseKey) {
      return;
    }

    state.responses[currentLine.responseKey] = choiceId;

    if (state.conversationId === "intro") {
      startConversation("reveal");
      return;
    }

    if (state.conversationId === "afterPokedexIntro") {
      startConversation("afterPokedexHope");
      return;
    }

    if (state.conversationId === "pokedex") {
      startConversation("trainerMemory");
      return;
    }

    if (state.conversationId === "trainerMemory") {
      startConversation("trainerMemoryFinale");
      return;
    }

    if (state.conversationId === "nameConfirm") {
      startConversation("worldQuestion");
      return;
    }

    if (state.conversationId === "worldQuestion") {
      startConversation("comeWithMe");
    }
  }

  function advanceConversation() {
    const conversation = getCurrentConversation();
    if (!conversation.length) {
      return;
    }

    if (state.dialogueIndex < conversation.length - 1) {
      state.dialogueIndex += 1;
      state.selectedChoice = 0;
      typewriter.start(getCurrentLine()?.text || "");
      render();
      return;
    }

    if (state.conversationId === "reveal") {
      beginSquirtleDiscovery();
      return;
    }

    if (state.conversationId === "squirtleDiscovery") {
      beginSquirtleHint();
      return;
    }

    if (state.conversationId === "squirtleHelp") {
      beginTransformMoment();
      return;
    }

    if (state.conversationId === "transformUnlock") {
      startConversation("waterGunPrompt");
      return;
    }

    if (state.conversationId === "waterGunPrompt") {
      beginWaterGunPrompt();
      return;
    }

    if (state.conversationId === "squirtleSaved") {
      beginPokedexReveal();
      return;
    }

    if (state.conversationId === "afterPokedexHope") {
      startConversation("squirtlePast");
      return;
    }

    if (state.conversationId === "squirtlePast") {
      startConversation("wastelandReply");
      return;
    }

    if (state.conversationId === "wastelandReply") {
      startConversation("groundGreening");
      return;
    }

    if (state.conversationId === "groundGreening") {
      startConversation("waterRequest");
      return;
    }

    if (state.conversationId === "waterRequest") {
      startConversation("squirtleAgreement");
      return;
    }

    if (state.conversationId === "squirtleAgreement") {
      finish();
      return;
    }

    if (state.conversationId === "trainerMemoryFinale") {
      startConversation("namePrompt");
      return;
    }

    if (state.conversationId === "namePrompt") {
      beginNameEntry();
      return;
    }

    if (state.conversationId === "comeWithMe") {
      beginFollow("overlook");
      return;
    }

    if (state.conversationId === "overlookInfo") {
      startConversation("goSee");
      return;
    }

    if (state.conversationId === "goSee") {
      beginFollow("plant");
      return;
    }

    if (state.conversationId === "repairIntro") {
      beginRepairPrompt();
    }
  }

  function setSelectedChoice(index) {
    const choices = getCurrentChoices();
    if (!choices?.length) {
      return;
    }

    const nextIndex = clampIndex(index, choices.length);
    if (nextIndex === state.selectedChoice) {
      return;
    }

    state.selectedChoice = nextIndex;
    render();
  }

  function confirmSelectedChoice() {
    const choices = getCurrentChoices();
    if (!choices?.length) {
      return;
    }

    const choice = choices[state.selectedChoice] || choices[0];
    resolveConversationChoice(choice.id);
  }

  function setPlayerNearMonster(nextValue) {
    if (state.playerNearMonster === nextValue) {
      return;
    }

    state.playerNearMonster = nextValue;
    if (state.phase === "approach" || state.phase === "follow") {
      render();
    }
  }

  function setPlayerNearSquirtleNotice(nextValue) {
    if (state.playerNearSquirtleNotice === nextValue) {
      return;
    }

    state.playerNearSquirtleNotice = nextValue;
  }

  function setPlayerNearSquirtleTalk(nextValue) {
    if (state.playerNearSquirtleTalk === nextValue) {
      return;
    }

    state.playerNearSquirtleTalk = nextValue;
    if (state.phase === "squirtle-hint") {
      render();
    }
  }

  function setPlayerNearInspectable(nextValue) {
    if (state.playerNearInspectable === nextValue) {
      return;
    }

    state.playerNearInspectable = nextValue;
    if (state.phase === "inspect") {
      render();
    }
  }

  function setPlayerNearRepairPlant(nextValue) {
    if (state.playerNearRepairPlant === nextValue) {
      return;
    }

    state.playerNearRepairPlant = nextValue;
    if (state.phase === "repair") {
      render();
    }
  }

  root.addEventListener("click", (event) => {
    if (state.active && state.phase === "name-entry") {
      const keyButton = event.target.closest("[data-name-key]");
      if (keyButton) {
        appendNameChar(keyButton.dataset.nameKey || "");
        return;
      }

      const actionButton = event.target.closest("[data-name-action]");
      if (actionButton) {
        const action = actionButton.dataset.nameAction;
        if (action === "space") {
          appendNameChar(" ");
          return;
        }
        if (action === "delete") {
          deleteNameChar();
          return;
        }
        if (action === "submit") {
          submitPlayerName();
        }
        return;
      }
    }

    const choiceButton = event.target.closest("[data-choice-index]");
    if (!choiceButton || !state.active || state.phase !== "conversation") {
      return;
    }

    setSelectedChoice(Number(choiceButton.dataset.choiceIndex));
    confirmSelectedChoice();
  });

  return {
    isActive() {
      return state.active;
    },
    isMovementLocked() {
      return state.active && !["approach", "squirtle-discovery", "squirtle-hint", "squirtle-ability", "camera", "inspect", "follow", "repair"].includes(state.phase);
    },
    hasStarted() {
      return state.started;
    },
    allowsCameraLook() {
      return !state.active || ["approach", "squirtle-discovery", "squirtle-hint", "squirtle-ability", "camera", "inspect", "follow", "repair"].includes(state.phase);
    },
    getMonsterPosition() {
      return [...state.monsterPosition];
    },
    getCameraFocusTarget() {
      const currentLine = getCurrentLine();
      if (!state.active || state.phase !== "conversation" || currentLine?.cameraFocusTarget !== "repairPlant") {
        return null;
      }

      return [...state.repairPlantPosition];
    },
    isRepairPlantFixed() {
      return state.repairPlantFixed;
    },
    registerCameraLook() {
      if (!state.active || state.phase !== "camera" || state.cameraLookRegistered) {
        return;
      }

      state.cameraLookRegistered = true;
      state.cameraDismissElapsed = 0;
      render();
    },
    start({ monsterPosition, squirtlePosition, inspectablePosition, repairPlantPosition }) {
      state.started = true;
      state.active = true;
      state.phase = "approach";
      state.conversationId = null;
      state.dialogueIndex = 0;
      state.selectedChoice = 0;
      state.monsterPosition = [...monsterPosition];
      state.squirtlePosition = squirtlePosition ? [...squirtlePosition] : [monsterPosition[0] + 5.6, monsterPosition[1], monsterPosition[2] - 1.4];
      state.inspectablePosition = [...inspectablePosition];
      state.repairPlantPosition = [...repairPlantPosition];
      state.followTargetId = null;
      state.followTargetReached = false;
      state.playerPosition = [0, 0, 0];
      state.playerNearMonster = false;
      state.playerNearSquirtleNotice = false;
      state.playerNearSquirtleTalk = false;
      state.playerNearInspectable = false;
      state.playerNearRepairPlant = false;
      state.squirtleDiscoveryTriggered = false;
      state.squirtleHealed = false;
      state.playerIdeaVisible = false;
      state.cameraLookRegistered = false;
      state.cameraDismissElapsed = 0;
      state.playerName = "";
      state.repairPlantFixed = false;
      state.waterGunLearned = false;
      state.pokedexRecovered = false;
      state.responses.humanClaim = null;
      state.responses.pokedexReaction = null;
      state.responses.pokedexChoice = null;
      state.responses.trainerLookChoice = null;
      state.responses.playerName = "";
      state.responses.nameConfirmation = null;
      state.responses.worldQuestion = null;
      render();
    },
    update(camera, viewportWidth, viewportHeight, playerPosition, deltaTime = 0) {
      if (!state.active) {
        return;
      }

      if (playerPosition) {
        state.playerPosition = [...playerPosition];

        const monsterDistance = Math.hypot(
          state.playerPosition[0] - state.monsterPosition[0],
          state.playerPosition[2] - state.monsterPosition[2]
        );
        setPlayerNearMonster(monsterDistance <= TALK_DISTANCE);

        const squirtleDistance = Math.hypot(
          state.playerPosition[0] - state.squirtlePosition[0],
          state.playerPosition[2] - state.squirtlePosition[2]
        );
        setPlayerNearSquirtleNotice(squirtleDistance <= SQUIRTLE_NOTICE_DISTANCE);
        setPlayerNearSquirtleTalk(squirtleDistance <= SQUIRTLE_TALK_DISTANCE);

        const inspectDistance = Math.hypot(
          state.playerPosition[0] - state.inspectablePosition[0],
          state.playerPosition[2] - state.inspectablePosition[2]
        );
        setPlayerNearInspectable(inspectDistance <= INSPECT_DISTANCE);

        const repairDistance = Math.hypot(
          state.playerPosition[0] - state.repairPlantPosition[0],
          state.playerPosition[2] - state.repairPlantPosition[2]
        );
        setPlayerNearRepairPlant(repairDistance <= REPAIR_DISTANCE);
      }

      if (state.phase === "camera" && state.cameraLookRegistered) {
        state.cameraDismissElapsed += deltaTime;
        if (state.cameraDismissElapsed >= CAMERA_LOOK_COMPLETE_DELAY) {
          beginInspectPrompt();
          return;
        }
      }

      if (state.phase === "squirtle-discovery" && state.playerNearSquirtleNotice && !state.squirtleDiscoveryTriggered) {
        state.squirtleDiscoveryTriggered = true;
        startConversation("squirtleDiscovery");
        return;
      }

      if (state.phase === "follow") {
        const followTarget = getFollowTarget();
        if (followTarget) {
          const step = moveTowards2D(state.monsterPosition, followTarget.destination, FOLLOW_SPEED * deltaTime);
          state.monsterPosition = step.position;
          state.followTargetReached = step.reached;

          if (state.followTargetReached && state.playerNearMonster) {
            startConversation(followTarget.nextConversation);
            return;
          }
        }
      }

      if (refs?.speech) {
        const projected = camera.project(
          [state.monsterPosition[0], state.monsterPosition[1] + 2.35, state.monsterPosition[2]],
          viewportWidth,
          viewportHeight
        );

        refs.speech.style.left = `${projected.x}px`;
        refs.speech.style.top = `${projected.y}px`;
        refs.speech.style.opacity = projected.depth > 1 ? "0" : "1";
      }

      if (refs?.squirtleSpeech) {
        const projected = camera.project(
          [state.squirtlePosition[0], state.squirtlePosition[1] + 1.95, state.squirtlePosition[2]],
          viewportWidth,
          viewportHeight
        );

        refs.squirtleSpeech.style.left = `${projected.x}px`;
        refs.squirtleSpeech.style.top = `${projected.y}px`;
        refs.squirtleSpeech.style.opacity = projected.depth > 1 ? "0" : "1";
      }

      if (refs?.playerThought) {
        const projected = camera.project(
          [state.playerPosition[0], state.playerPosition[1] + 2.35, state.playerPosition[2]],
          viewportWidth,
          viewportHeight
        );

        refs.playerThought.style.left = `${projected.x}px`;
        refs.playerThought.style.top = `${projected.y}px`;
        refs.playerThought.style.opacity = projected.depth > 1 ? "0" : "1";
      }
    },
    handleKeydown(event) {
      if (!state.active) {
        return false;
      }

      const key = event.key.toLowerCase();

      if (state.phase === "approach") {
        if (isMoveKey(key)) {
          return false;
        }

        if (event.code === "Space") {
          if (state.playerNearMonster) {
            startConversation("intro");
          }
          event.preventDefault();
          return true;
        }

        if (
          isCameraLookKey(event.code) ||
          event.code === "KeyE" ||
          event.code === "KeyM" ||
          event.code === "Escape" ||
          event.code === "Enter"
        ) {
          event.preventDefault();
          return true;
        }

        return false;
      }

      if (state.phase === "squirtle-discovery") {
        if (isMoveKey(key) || isCameraLookKey(event.code)) {
          return false;
        }

        if (
          event.code === "Space" ||
          event.code === "KeyE" ||
          event.code === "KeyM" ||
          event.code === "Escape" ||
          event.code === "Enter"
        ) {
          event.preventDefault();
          return true;
        }

        return false;
      }

      if (state.phase === "squirtle-hint") {
        if (isMoveKey(key) || isCameraLookKey(event.code)) {
          return false;
        }

        if (event.code === "KeyE") {
          if (state.playerNearSquirtleTalk) {
            startConversation("squirtleHelp");
          }
          event.preventDefault();
          return true;
        }

        if (
          event.code === "Space" ||
          event.code === "KeyM" ||
          event.code === "Escape" ||
          event.code === "Enter"
        ) {
          event.preventDefault();
          return true;
        }

        return false;
      }

      if (state.phase === "squirtle-ability") {
        if (isMoveKey(key) || isCameraLookKey(event.code)) {
          return false;
        }

        if (event.code === "KeyE") {
          if (state.playerNearSquirtleTalk && !state.squirtleHealed) {
            state.squirtleHealed = true;
            onSquirtleHeal();
            startConversation("squirtleSaved");
          }
          event.preventDefault();
          return true;
        }

        if (
          event.code === "Space" ||
          event.code === "KeyM" ||
          event.code === "Escape" ||
          event.code === "Enter"
        ) {
          event.preventDefault();
          return true;
        }

        return false;
      }

      if (state.phase === "camera") {
        if (isMoveKey(key) || isCameraLookKey(event.code)) {
          return false;
        }

        if (
          event.code === "Space" ||
          event.code === "KeyE" ||
          event.code === "KeyM" ||
          event.code === "Escape" ||
          event.code === "Enter"
        ) {
          event.preventDefault();
          return true;
        }

        return false;
      }

      if (state.phase === "inspect") {
        if (isMoveKey(key) || isCameraLookKey(event.code)) {
          return false;
        }

        if (event.code === "KeyE") {
          if (state.playerNearInspectable) {
            startConversation("pokedex");
          }
          event.preventDefault();
          return true;
        }

        if (
          event.code === "Space" ||
          event.code === "KeyM" ||
          event.code === "Escape" ||
          event.code === "Enter"
        ) {
          event.preventDefault();
          return true;
        }

        return false;
      }

      if (state.phase === "follow") {
        if (isMoveKey(key) || isCameraLookKey(event.code)) {
          return false;
        }

        if (
          event.code === "Space" ||
          event.code === "KeyE" ||
          event.code === "KeyM" ||
          event.code === "Escape" ||
          event.code === "Enter"
        ) {
          event.preventDefault();
          return true;
        }

        return false;
      }

      if (state.phase === "repair") {
        if (isMoveKey(key) || isCameraLookKey(event.code)) {
          return false;
        }

        if (event.code === "KeyE") {
          if (state.playerNearRepairPlant) {
            state.repairPlantFixed = true;
            finish();
          }
          event.preventDefault();
          return true;
        }

        if (
          event.code === "Space" ||
          event.code === "KeyM" ||
          event.code === "Escape" ||
          event.code === "Enter"
        ) {
          event.preventDefault();
          return true;
        }

        return false;
      }

      if (state.phase === "name-entry") {
        if (event.code === "Backspace") {
          deleteNameChar();
          event.preventDefault();
          return true;
        }

        if (event.code === "Enter") {
          submitPlayerName();
          event.preventDefault();
          return true;
        }

        if (event.code === "Space") {
          appendNameChar(" ");
          event.preventDefault();
          return true;
        }

        if (!event.ctrlKey && !event.metaKey && !event.altKey) {
          const normalized = normalizeNameChar(event.key);
          if (normalized) {
            appendNameChar(normalized);
            event.preventDefault();
            return true;
          }

          if (event.key.length === 1) {
            event.preventDefault();
            return true;
          }
        }

        if (
          event.code === "Escape" ||
          event.code === "KeyM" ||
          isCameraLookKey(event.code)
        ) {
          event.preventDefault();
          return true;
        }

        return false;
      }

      const choices = getCurrentChoices();
      if (!typewriter.isComplete()) {
        if (event.code === "Space" || event.code === "Enter" || event.code === "KeyE") {
          typewriter.complete();
          event.preventDefault();
          return true;
        }

        if (
          isMoveKey(key) ||
          isCameraLookKey(event.code) ||
          event.code === "KeyM" ||
          event.code === "Escape"
        ) {
          event.preventDefault();
          return true;
        }
      }

      if (choices?.length) {
        if (key === "w" || event.code === "ArrowUp") {
          setSelectedChoice(state.selectedChoice - 1);
          event.preventDefault();
          return true;
        }

        if (key === "s" || event.code === "ArrowDown") {
          setSelectedChoice(state.selectedChoice + 1);
          event.preventDefault();
          return true;
        }

        if (event.code === "Space" || event.code === "Enter") {
          confirmSelectedChoice();
          event.preventDefault();
          return true;
        }
      } else if (event.code === "Space" || event.code === "Enter") {
        advanceConversation();
        event.preventDefault();
        return true;
      }

      if (
        isMoveKey(key) ||
        isCameraLookKey(event.code) ||
        event.code === "KeyE" ||
        event.code === "KeyM" ||
        event.code === "Escape"
      ) {
        event.preventDefault();
        return true;
      }

      return false;
    },
    notifyPokedexClosed() {
      if (!state.active || state.phase !== "pokedex-reveal") {
        return;
      }

      startConversation("afterPokedexIntro");
    },
    __debugStartConversation(conversationId) {
      if (!state.started || !state.active) {
        return;
      }

      if (conversationId === "name-entry") {
        beginNameEntry();
        return;
      }

      startConversation(conversationId);
    },
    handleKeyup(event) {
      if (!state.active) {
        return false;
      }

      if (!this.isMovementLocked()) {
        return false;
      }

      if (isMoveKey(event.key.toLowerCase()) || isCameraLookKey(event.code)) {
        event.preventDefault();
        return true;
      }

      return false;
    },
  };
}
