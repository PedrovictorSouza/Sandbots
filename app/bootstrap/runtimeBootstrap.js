export function markAppReady(appRoot, state, launchMode) {
  appRoot.dataset.appReady = state;
  appRoot.dataset.bootMode = launchMode;
}
