export function createPokedexRuntime({
  createLazyUiModule,
  root,
  alertButton,
  clearGameFlowInput,
  isBuilderPanelOpen = () => false,
  closeBuilderPanel = () => {},
  loadPokedexOverlay,
  onScriptedClose = () => {}
}) {
  const state = {
    unlocked: false,
    open: false,
    seen: false,
    scripted: false
  };
  let runtime = null;

  const entryModule = createLazyUiModule(async () => {
    const { createPokedexOverlay } = await loadPokedexOverlay();
    return createPokedexOverlay({
      root,
      onClose: () => {
        runtime?.closeFromUser();
      }
    });
  });

  const entry = {
    preload() {
      return entryModule.preload();
    },
    setOpen(open, options) {
      return entryModule.invoke("setOpen", [open, options], {
        replayIfUnloaded: true
      });
    },
    handleKeydown(event) {
      return entryModule.invoke("handleKeydown", [event], {
        defaultValue: false
      });
    }
  };

  function syncUi() {
    if (alertButton) {
      alertButton.hidden = !state.unlocked;
      alertButton.dataset.pulse = state.unlocked && !state.seen ? "true" : "false";
    }
  }

  function setOpen(
    open,
    {
      force = false,
      markSeen = true,
      scripted = false,
      entryId = null,
      page = "details",
      requestId = null
    } = {}
  ) {
    if (open && !state.unlocked && !force) {
      return;
    }

    state.open = open;
    state.scripted = open ? scripted : false;
    if (open) {
      if (markSeen) {
        state.seen = true;
      }
      if (isBuilderPanelOpen()) {
        closeBuilderPanel();
      }
    }

    clearGameFlowInput();
    const openOptions = { page, entryId };
    if (requestId) {
      openOptions.requestId = requestId;
    }

    entry.setOpen(
      open,
      open ? openOptions : { preservePage: true }
    );
    syncUi();
  }

  function unlock() {
    state.unlocked = true;
    syncUi();
  }

  function setSeen(seen) {
    state.seen = seen;
    syncUi();
  }

  function closeFromUser() {
    const shouldResumeTutorial = state.scripted;
    setOpen(false);
    if (shouldResumeTutorial) {
      onScriptedClose();
    }
  }

  if (alertButton) {
    alertButton.addEventListener("click", () => {
      setOpen(true);
    });
  }

  runtime = {
    state,
    entry,
    syncUi,
    setOpen,
    unlock,
    setSeen,
    closeFromUser
  };

  return runtime;
}
