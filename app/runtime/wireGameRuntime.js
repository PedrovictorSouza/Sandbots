export function wireGameRuntime({
  windowRef = window,
  renderFrameController,
  stageRuntimeController
} = {}) {
  function syncFrameLayout() {
    const frame = renderFrameController.sync();
    stageRuntimeController.syncUiScale(frame);
    return frame;
  }

  windowRef.addEventListener("resize", syncFrameLayout);

  return {
    syncFrameLayout,
    initialFrame: syncFrameLayout(),
    dispose() {
      windowRef.removeEventListener("resize", syncFrameLayout);
    }
  };
}
