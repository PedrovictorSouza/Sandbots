import { createFrameSnapshotController } from "./frameSnapshotController.js";
import { createCameraZoomPresetController } from "./cameraZoomPresetController.js";
import {
  getPlayerDustBillboards,
  updatePlayerDustParticles
} from "../session/playerDustParticles.js";
import {
  getNatureRevivalBillboards,
  getNatureRevivalScale,
  updateNatureRevivalEffects
} from "../session/natureRevivalEffects.js";
import { updateIntroRoomFrame } from "../scenes/introRoom/introRoomSequence.js";
import { updateChopperNpcActor } from "../session/chopperNpcActor.js";

export function startGameLoop({
  camera,
  mount,
  worldCanvas,
  worldRenderer,
  worldSpeech,
  groundCellHighlight,
  gameplayDialogue,
  dialogueCamera,
  gameFlowValues,
  isGameFlow,
  actTwoSequence,
  actTwoTutorial,
  session,
  pokedexUiState,
  controls,
  cameraOrbit,
  cameraZoomPresets = [],
  gameplay,
  hud,
  rendering
}) {
  let previousTime = performance.now();
  const frameSnapshotController = createFrameSnapshotController({
    camera,
    mount,
    worldRenderer,
    worldSpeech,
    groundCellHighlight,
    actTwoTutorial,
    hud
  });
  const cameraZoomPresetController = createCameraZoomPresetController({
    camera,
    presets: cameraZoomPresets
  });

  function updateBulbasaurEncounter(deltaTime) {
    const encounter = session.bulbasaurEncounter;

    if (!encounter?.visible || !encounter.position) {
      return;
    }

    if (encounter.jumpTimer <= 0 || !encounter.originPosition || !encounter.landingPosition) {
      encounter.jumpTimer = 0;
      encounter.position = encounter.landingPosition ? [...encounter.landingPosition] : encounter.position;
      return;
    }

    encounter.jumpTimer = Math.max(0, encounter.jumpTimer - deltaTime);
    const progress = 1 - encounter.jumpTimer / encounter.jumpDuration;
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    const arcHeight = Math.sin(progress * Math.PI) * 0.92;

    encounter.position = [
      encounter.originPosition[0] +
        (encounter.landingPosition[0] - encounter.originPosition[0]) * easedProgress,
      encounter.originPosition[1] +
        (encounter.landingPosition[1] - encounter.originPosition[1]) * progress +
        arcHeight,
      encounter.originPosition[2] +
        (encounter.landingPosition[2] - encounter.originPosition[2]) * easedProgress
    ];
  }

  function frame(now) {
    const nextFrame = frameSnapshotController.beginFrame();
    const deltaTime = Math.min(0.033, (now - previousTime) / 1000);
    previousTime = now;
    let cinematicActive = isGameFlow(gameFlowValues.CINEMATIC);
    const introActive = isGameFlow(gameFlowValues.INTRO);
    let tutorialActive = isGameFlow(gameFlowValues.TUTORIAL);
    const tutorialMovementLocked = tutorialActive ? actTwoTutorial.isMovementLocked() : false;
    const pokedexModalOpen = pokedexUiState.open;
    const dialogueActive = gameplayDialogue.isActive();
    const tutorialCameraFocus = tutorialActive ? actTwoTutorial.getCameraFocusTarget() : null;

    if (session.actTwoRepairPlant && actTwoTutorial.isRepairPlantFixed()) {
      session.actTwoRepairPlant.fixed = true;
    }

    controls.updateGamepads?.(deltaTime);

    if (controls.isPaused?.()) {
      controls.clearPendingActions();
      controls.clearMovementInput();
      requestAnimationFrame(frame);
      return;
    }

    camera.resizeCanvases();
    camera.update(deltaTime);

    if (
      introActive &&
      updateIntroRoomFrame({
        introRoomScene: session.introRoomScene,
        camera,
        worldCanvas,
        frame: nextFrame,
        deltaTime
      })
    ) {
      frameSnapshotController.commitFrame();
      requestAnimationFrame(frame);
      return;
    }

    if (tutorialActive || pokedexModalOpen) {
      controls.clearPendingActions();
    }

    if (tutorialMovementLocked || pokedexModalOpen || dialogueActive) {
      controls.clearMovementInput();
    }

    const canRotateCamera =
      session.playerCharacter &&
      !cinematicActive &&
      !controls.isBuilderPanelOpen() &&
      !pokedexModalOpen &&
      !dialogueActive &&
      actTwoTutorial.allowsCameraLook();
    const canCycleCameraZoom =
      session.playerCharacter &&
      !cinematicActive &&
      !tutorialActive &&
      !controls.isBuilderPanelOpen() &&
      !pokedexModalOpen &&
      !dialogueActive;

    while (controls.consumeCameraZoomCycleRequest?.()) {
      if (canCycleCameraZoom) {
        cameraZoomPresetController.cycle();
      }
    }

    const cameraTurnDirection =
      (controls.cameraTurnKeys.has("ArrowRight") ? 1 : 0) -
      (controls.cameraTurnKeys.has("ArrowLeft") ? 1 : 0);
    const cameraLookDelta = controls.consumeCameraLookDelta?.() || { yaw: 0, pitch: 0 };
    const keyboardCameraYaw = cameraTurnDirection * deltaTime * cameraOrbit.turnSpeed;
    const hasCameraLookInput =
      keyboardCameraYaw !== 0 ||
      Math.abs(cameraLookDelta.yaw) > 0.0001 ||
      Math.abs(cameraLookDelta.pitch) > 0.0001;

    if (canRotateCamera && hasCameraLookInput) {
      cameraOrbit.rotate(keyboardCameraYaw + cameraLookDelta.yaw, cameraLookDelta.pitch);
      if (tutorialActive) {
        actTwoTutorial.registerCameraLook();
      }
    } else if (!canRotateCamera) {
      controls.clearCameraLookInput?.();
    }

    if (
      session.playerCharacter &&
      !cinematicActive &&
      !tutorialMovementLocked &&
      !pokedexModalOpen &&
      !dialogueActive
    ) {
      session.playerCharacter.update(deltaTime);
    }

    updatePlayerDustParticles(session.playerDust, {
      deltaTime,
      playerPosition: session.playerCharacter?.getPosition?.() || null,
      active: Boolean(session.playerCharacter) &&
        !cinematicActive &&
        !tutorialMovementLocked &&
        !pokedexModalOpen &&
        !dialogueActive
    });
    updateNatureRevivalEffects(session.natureRevivalEffects, deltaTime);

    function performHarvestAction(playerPosition) {
      gameplay.performHarvestAction({
        playerPosition,
        palmModel: session.palmModel,
        palmInstances: session.palmInstances,
        resourceNodes: session.resourceNodes,
        inventory: controls.inventory,
        canPurifyGround: Boolean(controls.playerSkills?.waterGun),
        groundDeadInstances: session.groundDeadInstances,
        groundFlowerPatches: session.groundFlowerPatches,
        groundGrassPatches: session.groundGrassPatches,
        groundPurifiedInstances: session.groundPurifiedInstances,
        storyState: controls.storyState,
        woodDrops: session.woodDrops
      });
    }

    const harvestRequested = controls.consumeHarvestRequest();

    if (
      harvestRequested &&
      session.playerCharacter &&
      !cinematicActive &&
      !tutorialActive
    ) {
      const playerPosition = session.playerCharacter.getPosition();
      const primaryInteractTarget =
        !dialogueActive ?
          gameplay.findNearbyInteractable(
            playerPosition,
            session.npcActors,
            session.interactables,
            controls.storyState,
            session.groundGrassPatches
          ) :
          null;

      if (primaryInteractTarget?.target) {
        gameplay.performInteractAction({
          playerPosition,
          npcActors: session.npcActors,
          interactables: session.interactables,
          storyState: controls.storyState,
          inventory: controls.inventory,
          groundGrassPatches: session.groundGrassPatches,
          onNpcInteractionStart({ targetId, playerPosition, npcActors, interactables }) {
            dialogueCamera?.focusNpcConversation({
              targetId,
              playerPosition,
              npcActors,
              interactables
            });
          }
        });
      } else if (!dialogueActive) {
        performHarvestAction(playerPosition);
      }
    } else if (
      controls.isPrimaryActionActive?.() &&
      controls.playerSkills?.waterGun &&
      session.playerCharacter &&
      !cinematicActive &&
      !tutorialActive &&
      !pokedexModalOpen &&
      !dialogueActive
    ) {
      const playerPosition = session.playerCharacter.getPosition();
      const waterGunTarget = gameplay.findNearbyActionTarget({
        playerPosition,
        palmModel: session.palmModel,
        palmInstances: session.palmInstances,
        resourceNodes: session.resourceNodes,
        storyState: controls.storyState,
        groundDeadInstances: session.groundDeadInstances,
        canPurifyGround: true
      });

      if (waterGunTarget?.groundCell) {
        performHarvestAction(playerPosition);
      }
    }

    if (
      controls.consumeInteractRequest() &&
      session.playerCharacter &&
      !cinematicActive &&
      !tutorialActive &&
      !dialogueActive
    ) {
      gameplay.performInteractAction({
        playerPosition: session.playerCharacter.getPosition(),
        npcActors: session.npcActors,
        interactables: session.interactables,
        storyState: controls.storyState,
        inventory: controls.inventory,
        groundGrassPatches: session.groundGrassPatches,
        onNpcInteractionStart({ targetId, playerPosition, npcActors, interactables }) {
          dialogueCamera?.focusNpcConversation({
            targetId,
            playerPosition,
            npcActors,
            interactables
          });
        }
      });
    }

    hud.updateTransientNotice(deltaTime);
    gameplay.updatePalmShake(deltaTime, session.palmInstances);
    gameplay.updateResourceNodes(deltaTime, session.resourceNodes);
    updateChopperNpcActor(session.chopperNpcActor, {
      deltaTime,
      storyState: controls.storyState,
      isNpcActive: rendering.isNpcActive
    });
    updateBulbasaurEncounter(deltaTime);

    if (cinematicActive) {
      actTwoSequence.update(deltaTime);
      cinematicActive = isGameFlow(gameFlowValues.CINEMATIC);
      tutorialActive = isGameFlow(gameFlowValues.TUTORIAL);
    }

    if (session.playerCharacter && !cinematicActive) {
      if (!tutorialActive && !pokedexModalOpen) {
        const collectedWoodCount = gameplay.collectWoodDrops(
          session.playerCharacter.getPosition(),
          session.woodDrops,
          controls.inventory
        );

        if (collectedWoodCount > 0) {
          hud.syncInventoryUi(controls.inventory);
          hud.pushNotice(`+${collectedWoodCount} Wood`);
        }
      }

      if (tutorialCameraFocus) {
        camera.setPose({
          target: [tutorialCameraFocus[0], 1.25, tutorialCameraFocus[2]],
          direction: cameraOrbit.getDirection(),
          zoom: 3.95,
          distance: 7.35
        });
      } else if (!dialogueActive && !camera.isTargetTransitionActive()) {
        camera.follow(session.playerCharacter.getPosition());
      }
    }

    const nearbyHarvestTarget =
      session.playerCharacter && !cinematicActive && !tutorialActive ?
        gameplay.findNearbyActionTarget({
          playerPosition: session.playerCharacter.getPosition(),
          palmModel: session.palmModel,
          palmInstances: session.palmInstances,
          resourceNodes: session.resourceNodes,
          storyState: controls.storyState,
          groundDeadInstances: session.groundDeadInstances,
          canPurifyGround: Boolean(controls.playerSkills?.waterGun)
        }) :
        null;
    const nearbyInteractable =
      session.playerCharacter && !cinematicActive && !tutorialActive ?
        gameplay.findNearbyInteractable(
          session.playerCharacter.getPosition(),
          session.npcActors,
          session.interactables,
          controls.storyState,
          session.groundGrassPatches
        ) :
        null;
    const activeQuest = gameplay.getActiveQuest(controls.storyState);
    const promptCopy = cinematicActive || tutorialActive ?
      "" :
      gameplay.buildNearbyPrompt({
        harvestTarget: nearbyHarvestTarget,
        interactTarget: nearbyInteractable,
        quest: activeQuest,
        transientMessage: hud.getNoticeMessage(),
        getItemLabel: gameplay.getItemLabel
      });
    const shouldShowGroundCellHighlight =
      !cinematicActive &&
      !tutorialActive &&
      !pokedexModalOpen &&
      !gameplayDialogue.isActive() &&
      Boolean(nearbyHarvestTarget?.groundCell);

    if (!cinematicActive && !tutorialActive && !pokedexModalOpen) {
      nextFrame.hud.active = true;
      nextFrame.hud.storyState = controls.storyState;
      nextFrame.hud.inventory = controls.inventory;
      nextFrame.hud.playerPosition = session.playerCharacter?.getPosition() || [0, 0, 0];
      nextFrame.hud.promptCopy = promptCopy;
      nextFrame.hud.statusMessage = promptCopy;
    }

    const followedViewProjection = camera.getViewProjection(
      worldCanvas.width,
      worldCanvas.height
    );
    nextFrame.render.viewProjection = followedViewProjection;
    nextFrame.render.sceneObjects = session.sceneObjects;

    const tangrowthActor = session.npcActors.find((npcActor) => npcActor.id === "tangrowth");
    const tangrowthPosition =
      tangrowthActor?.character?.getPosition?.() ||
      null;
    const shouldShowTangrowthSpeech =
      !cinematicActive &&
      !tutorialActive &&
      !pokedexModalOpen &&
      !gameplayDialogue.isActive() &&
      activeQuest?.id === "meetTangrowth" &&
      tangrowthPosition;

    if (shouldShowTangrowthSpeech) {
      nextFrame.worldSpeech.visible = true;
      nextFrame.worldSpeech.text = gameplay.tangrowthOpeningLine;
      nextFrame.worldSpeech.worldPosition = tangrowthPosition;
    }

    if (
      shouldShowTangrowthSpeech &&
      nearbyInteractable?.target?.id === "tangrowth" &&
      session.playerCharacter
    ) {
      nextFrame.worldPrompt.visible = true;
      nextFrame.worldPrompt.text = "Press X";
      nextFrame.worldPrompt.worldPosition = session.playerCharacter.getPosition();
    }

    if (shouldShowGroundCellHighlight) {
      nextFrame.groundCellHighlight.visible = true;
      nextFrame.groundCellHighlight.groundCell = nearbyHarvestTarget.groundCell;
    }

    for (const groundGrassPatch of session.groundGrassPatches) {
      const shouldRustle =
        groundGrassPatch.cellId === controls.storyState.flags.rustlingGrassCellId &&
        controls.storyState.flags.tangrowthTallGrassCommentSeen &&
        !controls.storyState.flags.bulbasaurRevealed &&
        groundGrassPatch.state === "alive";
      const rustleOffset = shouldRustle ? Math.sin(now * 0.024) * 0.11 : 0;

      nextFrame.render.grassBillboards.push({
        texture: groundGrassPatch.state === "alive" ?
          session.greenGrassTexture :
          session.deadGrassTexture,
        position: [
          groundGrassPatch.position[0] + rustleOffset,
          groundGrassPatch.position[1],
          groundGrassPatch.position[2]
        ],
        size: groundGrassPatch.size.map((value) => {
          return value * getNatureRevivalScale(session.natureRevivalEffects, groundGrassPatch.id);
        })
      });
    }

    for (const groundFlowerPatch of session.groundFlowerPatches) {
      const flowerRevivalScale = getNatureRevivalScale(
        session.natureRevivalEffects,
        groundFlowerPatch.id
      );
      nextFrame.render.flowerBillboards.push({
        texture: groundFlowerPatch.state === "alive" ?
          session.greenFlowerTexture :
          session.deadFlowerTexture,
        position: groundFlowerPatch.position,
        size: groundFlowerPatch.size.map((value) => value * flowerRevivalScale)
      });
    }

    if (!cinematicActive && !tutorialActive) {
      nextFrame.render.worldMarkers = {
        storyState: controls.storyState,
        resourceNodes: session.resourceNodes,
        npcActors: session.npcActors,
        interactables: session.interactables,
        markerTextures: session.markerTextures,
        worldMarkerHeight: rendering.worldMarkerHeight,
        worldMarkerSize: rendering.worldMarkerSize,
        npcMarkerOffset: rendering.npcMarkerOffset,
        npcMarkerSize: rendering.npcMarkerSize,
        fullUvRect: rendering.fullUvRect,
        isNpcActive: rendering.isNpcActive,
        isInteractableActive: rendering.isInteractableActive,
        isResourceNodeActive: rendering.isResourceNodeActive
      };
    }

    nextFrame.render.woodTexture = session.woodTexture;
    nextFrame.render.woodDrops = session.woodDrops;
    nextFrame.render.genericBillboards.push({
      texture: session.actTwoPokedexCache?.texture || null,
      position: session.actTwoPokedexCache?.position || null,
      size: session.actTwoPokedexCache?.size || null,
      uvRect: rendering.fullUvRect
    });

    if (session.actTwoRepairPlant) {
      const repairPlantTexture = session.actTwoRepairPlant.fixed ?
        session.repairPlantFixedTexture :
        session.repairPlantBrokenTexture;

      nextFrame.render.genericBillboards.push({
        texture: repairPlantTexture,
        position: session.actTwoRepairPlant.position,
        size: session.actTwoRepairPlant.size,
        uvRect: rendering.fullUvRect
      });
    }

    const visibleActTwoSquirtle =
      actTwoTutorial.hasStarted() || controls.storyState.questIndex >= 1 ?
        session.actTwoSquirtle :
        null;
    nextFrame.render.genericBillboards.push({
      texture: visibleActTwoSquirtle?.texture || null,
      position: visibleActTwoSquirtle?.position || null,
      size: visibleActTwoSquirtle?.size || null,
      uvRect: rendering.fullUvRect
    });
    nextFrame.render.genericBillboards.push({
      texture: session.bulbasaurEncounter?.visible ? session.bulbasaurEncounter.texture : null,
      position: session.bulbasaurEncounter?.visible ? session.bulbasaurEncounter.position : null,
      size: session.bulbasaurEncounter?.visible ? session.bulbasaurEncounter.size : null,
      uvRect: rendering.fullUvRect
    });
    nextFrame.render.genericBillboards.push(
      ...getPlayerDustBillboards(session.playerDust, session.playerDustTexture, rendering.fullUvRect)
    );
    nextFrame.render.genericBillboards.push(
      ...getNatureRevivalBillboards(
        session.natureRevivalEffects,
        session.natureRevivalSparkTexture,
        rendering.fullUvRect
      )
    );
    nextFrame.render.characters = {
      storyState: controls.storyState,
      playerCharacter: session.playerCharacter,
      npcActors: session.npcActors,
      characterTextures: session.characterTextures,
      isNpcActive: rendering.isNpcActive
    };

    nextFrame.tutorial.active = true;
    nextFrame.tutorial.playerPosition = session.playerCharacter?.getPosition() || null;
    nextFrame.tutorial.deltaTime = deltaTime;
    frameSnapshotController.commitFrame();
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
