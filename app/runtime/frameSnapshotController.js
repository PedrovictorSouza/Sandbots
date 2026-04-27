function createFrameSnapshot() {
  return {
    hud: {
      active: false,
      storyState: null,
      inventory: null,
      playerPosition: null,
      promptCopy: "",
      statusMessage: ""
    },
    worldSpeech: {
      visible: false,
      text: "",
      worldPosition: null
    },
    worldPrompt: {
      visible: false,
      text: "",
      worldPosition: null
    },
    groundCellHighlight: {
      visible: false,
      groundCell: null
    },
    render: {
      viewProjection: null,
      sceneObjects: null,
      grassBillboards: [],
      flowerBillboards: [],
      worldMarkers: null,
      woodTexture: null,
      woodDrops: null,
      genericBillboards: [],
      characters: null
    },
    tutorial: {
      active: false,
      playerPosition: null,
      deltaTime: 0
    }
  };
}

function resetFrameSnapshot(snapshot) {
  snapshot.hud.active = false;
  snapshot.hud.storyState = null;
  snapshot.hud.inventory = null;
  snapshot.hud.playerPosition = null;
  snapshot.hud.promptCopy = "";
  snapshot.hud.statusMessage = "";

  snapshot.worldSpeech.visible = false;
  snapshot.worldSpeech.text = "";
  snapshot.worldSpeech.worldPosition = null;

  snapshot.worldPrompt.visible = false;
  snapshot.worldPrompt.text = "";
  snapshot.worldPrompt.worldPosition = null;

  snapshot.groundCellHighlight.visible = false;
  snapshot.groundCellHighlight.groundCell = null;

  snapshot.render.viewProjection = null;
  snapshot.render.sceneObjects = null;
  snapshot.render.grassBillboards.length = 0;
  snapshot.render.flowerBillboards.length = 0;
  snapshot.render.worldMarkers = null;
  snapshot.render.woodTexture = null;
  snapshot.render.woodDrops = null;
  snapshot.render.genericBillboards.length = 0;
  snapshot.render.characters = null;

  snapshot.tutorial.active = false;
  snapshot.tutorial.playerPosition = null;
  snapshot.tutorial.deltaTime = 0;

  return snapshot;
}

function commitHud(hudController, snapshot) {
  if (!snapshot.hud.active) {
    return;
  }

  hudController.syncQuestFocus?.(snapshot.hud.storyState);
  hudController.syncHudMeta(
    snapshot.hud.storyState,
    snapshot.hud.inventory,
    snapshot.hud.playerPosition || [0, 0, 0]
  );
  hudController.syncHudInstructions(snapshot.hud.storyState, snapshot.hud.promptCopy);
  hudController.renderMissionCards(
    snapshot.hud.storyState,
    snapshot.hud.inventory,
    snapshot.hud.promptCopy
  );
  hudController.setStatus(snapshot.hud.statusMessage);
}

function commitWorldSpeech(worldSpeechController, snapshot, previousSnapshot) {
  if (!snapshot.worldSpeech.visible) {
    if (previousSnapshot.worldSpeech.visible) {
      worldSpeechController.hide();
    }
    return;
  }

  const shouldRefreshSpeech =
    !previousSnapshot.worldSpeech.visible ||
    previousSnapshot.worldSpeech.text !== snapshot.worldSpeech.text;

  if (shouldRefreshSpeech) {
    worldSpeechController.show({
      text: snapshot.worldSpeech.text,
      worldPosition: snapshot.worldSpeech.worldPosition
    });
    return;
  }

  worldSpeechController.setWorldPosition(snapshot.worldSpeech.worldPosition);
}

function commitWorldPrompt(worldSpeechController, snapshot, previousSnapshot) {
  if (!snapshot.worldPrompt.visible) {
    if (previousSnapshot.worldPrompt.visible) {
      worldSpeechController.hidePrompt?.();
    }
    return;
  }

  const needsShow =
    !previousSnapshot.worldPrompt.visible ||
    previousSnapshot.worldPrompt.text !== snapshot.worldPrompt.text;

  if (needsShow) {
    worldSpeechController.showPrompt?.({
      text: snapshot.worldPrompt.text,
      worldPosition: snapshot.worldPrompt.worldPosition,
      anchorHeight: 1.95
    });
    return;
  }

  worldSpeechController.setPromptWorldPosition?.(snapshot.worldPrompt.worldPosition);
}

function commitGroundCellHighlight(highlightController, snapshot, previousSnapshot) {
  if (!snapshot.groundCellHighlight.visible) {
    if (previousSnapshot.groundCellHighlight.visible) {
      highlightController.hide();
    }
    return;
  }

  if (
    !previousSnapshot.groundCellHighlight.visible ||
    previousSnapshot.groundCellHighlight.groundCell !== snapshot.groundCellHighlight.groundCell
  ) {
    highlightController.show({
      groundCell: snapshot.groundCellHighlight.groundCell
    });
    return;
  }

  highlightController.setGroundCell(snapshot.groundCellHighlight.groundCell);
}

function commitRender(worldRenderer, snapshot) {
  const { render } = snapshot;
  const viewProjection = render.viewProjection;

  if (!viewProjection) {
    return;
  }

  worldRenderer.drawScene(viewProjection, render.sceneObjects || []);
  worldRenderer.drawBillboards(viewProjection, render.grassBillboards);
  worldRenderer.drawBillboards(viewProjection, render.flowerBillboards);

  if (render.worldMarkers) {
    worldRenderer.drawWorldMarkers(viewProjection, render.worldMarkers);
  }

  worldRenderer.drawWoodDrops(viewProjection, render.woodTexture, render.woodDrops || []);

  for (const billboard of render.genericBillboards) {
    worldRenderer.drawBillboard(
      viewProjection,
      billboard.texture,
      billboard.position,
      billboard.size,
      billboard.uvRect
    );
  }

  if (render.characters) {
    worldRenderer.drawCharacters(viewProjection, render.characters);
  }
}

function commitProjectedOverlays({
  camera,
  mount,
  worldSpeechController,
  highlightController,
  actTwoTutorial,
  snapshot
}) {
  if (snapshot.worldSpeech.visible) {
    worldSpeechController.update(camera, mount.clientWidth, mount.clientHeight);
  }

  if (snapshot.worldPrompt.visible) {
    worldSpeechController.updatePrompt?.(camera, mount.clientWidth, mount.clientHeight);
  }

  if (snapshot.groundCellHighlight.visible) {
    highlightController.update(camera, mount.clientWidth, mount.clientHeight);
  }

  if (snapshot.tutorial.active) {
    actTwoTutorial.update(
      camera,
      mount.clientWidth,
      mount.clientHeight,
      snapshot.tutorial.playerPosition,
      snapshot.tutorial.deltaTime
    );
  }
}

export function createFrameSnapshotController({
  camera,
  mount,
  worldRenderer,
  worldSpeech,
  groundCellHighlight,
  actTwoTutorial,
  hud
}) {
  let frontBuffer = createFrameSnapshot();
  let backBuffer = createFrameSnapshot();

  return {
    beginFrame() {
      return resetFrameSnapshot(backBuffer);
    },

    commitFrame() {
      const previousSnapshot = frontBuffer;
      frontBuffer = backBuffer;
      backBuffer = previousSnapshot;

      commitHud(hud, frontBuffer);
      commitWorldSpeech(worldSpeech, frontBuffer, previousSnapshot);
      commitWorldPrompt(worldSpeech, frontBuffer, previousSnapshot);
      commitGroundCellHighlight(groundCellHighlight, frontBuffer, previousSnapshot);
      commitRender(worldRenderer, frontBuffer);
      commitProjectedOverlays({
        camera,
        mount,
        worldSpeechController: worldSpeech,
        highlightController: groundCellHighlight,
        actTwoTutorial,
        snapshot: frontBuffer
      });
    }
  };
}
