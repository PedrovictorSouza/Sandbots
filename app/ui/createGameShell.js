
const GAME_SHELL_HTML = `<div class="game-stage" id="game-stage">
  <section class="start-overlay" id="start-overlay" aria-label="Start screen"></section>
  <section class="intro-overlay" id="intro-overlay" hidden aria-label="Intro sequence"></section>
  <section class="intro-room-debug-root" id="intro-room-debug-root" hidden aria-label="Intro room debug tools"></section>
  <section class="pause-overlay" id="pause-overlay" hidden aria-label="Pause screen">
    <div class="pause-overlay__label">PAUSE</div>
  </section>
  <div class="render-frame" id="render-frame">
        <canvas id="viewport" class="layer" width="426" height="240"></canvas>
        <div id="warm-overlay" aria-hidden="true"></div>
        <canvas id="sprite-layer" class="layer" width="426" height="240"></canvas>
        <div class="ui-layer" id="ui-layer">
          <div class="scene-transition-veil" id="scene-transition-veil" hidden aria-hidden="true"></div>
          <section class="cinematic-overlay" id="cinematic-overlay" hidden aria-label="Act two cinematic"></section>
          <section class="tutorial-overlay" id="tutorial-overlay" hidden aria-label="Act two tutorial"></section>
          <section class="pokedex-overlay" id="pokedex-overlay" hidden aria-label="Pokedex entry">
            <article class="pokedex-entry">
              <div class="pokedex-entry__details">
                <header class="pokedex-entry__heading">
                  <span data-pokedex-field="number">No. 007</span>
                  <strong data-pokedex-field="name">Squirtle</strong>
                </header>
                <div class="pokedex-entry__tabs" aria-label="Pokedex sections">
                  <button class="pokedex-entry__nav" data-pokedex-action="prev" type="button" aria-label="Previous page">L</button>
                  <button class="pokedex-entry__tab" data-pokedex-page-target="details" data-active="true" type="button" aria-label="Details">&#9675;</button>
                  <button class="pokedex-entry__tab" data-pokedex-page-target="where-to-find" data-active="false" type="button" aria-label="Where to Find">&#9632;</button>
                  <button class="pokedex-entry__tab" data-pokedex-page-target="specialties" data-active="false" type="button" aria-label="Specialties and Likes">&hearts;</button>
                  <button class="pokedex-entry__nav" data-pokedex-action="next" type="button" aria-label="Next page">R</button>
                </div>
                <section class="pokedex-entry__page" data-pokedex-page-panel="details">
                  <div class="pokedex-entry__eyebrow" data-pokedex-field="details-eyebrow">Details</div>
                  <div class="pokedex-entry__species" data-pokedex-field="species">Tiny Turtle Pokemon</div>
                  <p class="pokedex-entry__description" data-pokedex-field="description">
                    Shoots water at prey while in the water. Withdraws into its shell when in danger.
                  </p>
                  <div class="pokedex-entry__stats">
                    <div class="pokedex-entry__stat">
                      <span data-pokedex-field="detail-stat-label-0">Height</span>
                      <strong data-pokedex-field="detail-stat-value-0">1'8"</strong>
                    </div>
                    <div class="pokedex-entry__stat">
                      <span data-pokedex-field="detail-stat-label-1">Weight</span>
                      <strong data-pokedex-field="detail-stat-value-1">19.8 lbs.</strong>
                    </div>
                    <div class="pokedex-entry__stat">
                      <span data-pokedex-field="detail-stat-label-2">Type</span>
                      <div class="pokedex-entry__type-badge">
                        <div class="pokedex-entry__type-icon" data-pokedex-field="detail-type-icon">&#128167;</div>
                        <strong data-pokedex-field="detail-type-label">Water</strong>
                      </div>
                    </div>
                  </div>
                </section>
                <section class="pokedex-entry__page pokedex-entry__page--where" data-pokedex-page-panel="where-to-find" hidden>
                  <div class="pokedex-entry__eyebrow" data-pokedex-field="where-eyebrow">Where to Find</div>
                  <div class="pokedex-entry__where-body">
                    <div class="pokedex-entry__where-visual">
                      <span class="pokedex-entry__where-arrow" aria-hidden="true">&#9664;</span>
                      <div class="pokedex-entry__where-marker">
                        <span class="pokedex-entry__where-pin" data-pokedex-field="where-pin">???</span>
                        <div class="pokedex-entry__where-island" data-pokedex-field="where-island">?</div>
                      </div>
                      <span class="pokedex-entry__where-arrow" aria-hidden="true">&#9654;</span>
                    </div>
                    <div class="pokedex-entry__where-count" data-pokedex-field="where-count">1/2</div>
                    <div class="pokedex-entry__where-stats">
                      <div class="pokedex-entry__where-stat">
                        <span data-pokedex-field="where-stat-label-0">Time</span>
                        <strong data-pokedex-field="where-stat-value-0">???</strong>
                      </div>
                      <div class="pokedex-entry__where-stat">
                        <span data-pokedex-field="where-stat-label-1">Weather</span>
                        <strong data-pokedex-field="where-stat-value-1">???</strong>
                      </div>
                    </div>
                  </div>
                </section>
                <section class="pokedex-entry__page pokedex-entry__page--specialties" data-pokedex-page-panel="specialties" hidden>
                  <div class="pokedex-entry__eyebrow" data-pokedex-field="specialties-eyebrow">Specialties &amp; Likes</div>
                  <div class="pokedex-entry__specialties-grid">
                    <section class="pokedex-entry__info-card">
                      <h3 data-pokedex-field="specialty-title">Specialties</h3>
                      <div class="pokedex-entry__specialty-badge">
                        <span aria-hidden="true" data-pokedex-field="specialty-icon">&#128167;</span>
                        <strong data-pokedex-field="specialty-label">Water</strong>
                      </div>
                    </section>
                    <section class="pokedex-entry__info-card pokedex-entry__info-card--favorites">
                      <h3 data-pokedex-field="favorites-title">Favorites</h3>
                      <ul class="pokedex-entry__favorites" data-pokedex-field="favorites-list">
                        <li>Lots of water</li>
                        <li>Cleanliness</li>
                        <li>Healing</li>
                        <li>Cute stuff</li>
                        <li>Group activities</li>
                        <li>Sweet flavors</li>
                      </ul>
                    </section>
                    <section class="pokedex-entry__info-card">
                      <h3 data-pokedex-field="habitat-title">Ideal Habitat</h3>
                      <p data-pokedex-field="habitat-copy">Humid</p>
                    </section>
                  </div>
                </section>
              </div>
              <div class="pokedex-entry__art" aria-hidden="true">
                <div class="pokedex-entry__glow"></div>
                <div class="pokedex-entry__creature" data-pokedex-art-scene="squirtle">
                  <div class="pokedex-entry__creature-head"></div>
                  <div class="pokedex-entry__creature-shell"></div>
                  <div class="pokedex-entry__creature-limb pokedex-entry__creature-limb--arm-left"></div>
                  <div class="pokedex-entry__creature-limb pokedex-entry__creature-limb--arm-right"></div>
                  <div class="pokedex-entry__creature-limb pokedex-entry__creature-limb--leg-left"></div>
                  <div class="pokedex-entry__creature-limb pokedex-entry__creature-limb--leg-right"></div>
                </div>
                <div class="pokedex-entry__flower-scene" data-pokedex-art-scene="flower-bed" hidden>
                  <div class="pokedex-entry__flower-card">
                    <strong data-pokedex-field="art-card-title">???</strong>
                    <div class="pokedex-entry__flower-card-row">
                      <span>Time</span>
                      <strong data-pokedex-field="art-time">Day</strong>
                    </div>
                    <div class="pokedex-entry__flower-card-rarity" data-pokedex-field="art-rarity">Common</div>
                  </div>
                  <div class="pokedex-entry__flower-window">
                    <div class="pokedex-entry__flower-cloud pokedex-entry__flower-cloud--one"></div>
                    <div class="pokedex-entry__flower-cloud pokedex-entry__flower-cloud--two"></div>
                    <div class="pokedex-entry__flower-cloud pokedex-entry__flower-cloud--three"></div>
                    <div class="pokedex-entry__flower-tree pokedex-entry__flower-tree--left"></div>
                    <div class="pokedex-entry__flower-tree pokedex-entry__flower-tree--right"></div>
                    <div class="pokedex-entry__flower-hill"></div>
                    <div class="pokedex-entry__flower-bed">
                      <span class="pokedex-entry__flower-cluster pokedex-entry__flower-cluster--one"></span>
                      <span class="pokedex-entry__flower-cluster pokedex-entry__flower-cluster--two"></span>
                      <span class="pokedex-entry__flower-cluster pokedex-entry__flower-cluster--three"></span>
                      <span class="pokedex-entry__flower-cluster pokedex-entry__flower-cluster--four"></span>
                    </div>
                  </div>
                </div>
                <div class="pokedex-entry__flower-scene" data-pokedex-art-scene="tall-grass" hidden>
                  <div class="pokedex-entry__flower-card">
                    <strong data-pokedex-field="art-card-title">???</strong>
                    <div class="pokedex-entry__flower-card-row">
                      <span>Time</span>
                      <strong data-pokedex-field="art-time">Day</strong>
                    </div>
                    <div class="pokedex-entry__flower-card-rarity" data-pokedex-field="art-rarity">Common</div>
                  </div>
                  <div class="pokedex-entry__flower-window">
                    <div class="pokedex-entry__flower-cloud pokedex-entry__flower-cloud--one"></div>
                    <div class="pokedex-entry__flower-cloud pokedex-entry__flower-cloud--two"></div>
                    <div class="pokedex-entry__flower-cloud pokedex-entry__flower-cloud--three"></div>
                    <div class="pokedex-entry__flower-tree pokedex-entry__flower-tree--left"></div>
                    <div class="pokedex-entry__flower-tree pokedex-entry__flower-tree--right"></div>
                    <div class="pokedex-entry__flower-hill"></div>
                    <div class="pokedex-entry__tall-grass-bed">
                      <span class="pokedex-entry__tall-grass-tuft pokedex-entry__tall-grass-tuft--one"></span>
                      <span class="pokedex-entry__tall-grass-tuft pokedex-entry__tall-grass-tuft--two"></span>
                      <span class="pokedex-entry__tall-grass-tuft pokedex-entry__tall-grass-tuft--three"></span>
                      <span class="pokedex-entry__tall-grass-tuft pokedex-entry__tall-grass-tuft--four"></span>
                    </div>
                  </div>
                </div>
                <div class="pokedex-entry__bulbasaur-scene" data-pokedex-art-scene="bulbasaur" hidden>
                  <div class="pokedex-entry__bulbasaur-platform"></div>
                  <div class="pokedex-entry__bulbasaur">
                    <div class="pokedex-entry__bulbasaur-bulb"></div>
                    <div class="pokedex-entry__bulbasaur-body"></div>
                    <div class="pokedex-entry__bulbasaur-head">
                      <div class="pokedex-entry__bulbasaur-smile"></div>
                    </div>
                    <div class="pokedex-entry__bulbasaur-leg pokedex-entry__bulbasaur-leg--back-left"></div>
                    <div class="pokedex-entry__bulbasaur-leg pokedex-entry__bulbasaur-leg--back-right"></div>
                    <div class="pokedex-entry__bulbasaur-leg pokedex-entry__bulbasaur-leg--front-left"></div>
                    <div class="pokedex-entry__bulbasaur-leg pokedex-entry__bulbasaur-leg--front-right"></div>
                  </div>
                </div>
              </div>
              <div class="pokedex-entry__drawer" aria-hidden="true">
                <div class="pokedex-entry__drawer-sheet">
                  <div class="pokedex-entry__drawer-item">
                    <span class="pokedex-entry__drawer-icon" data-pokedex-field="drawer-icon">✿</span>
                    <strong class="pokedex-entry__drawer-label" data-pokedex-field="drawer-label">Grass</strong>
                    <span class="pokedex-entry__drawer-count" data-pokedex-field="drawer-count">x2</span>
                  </div>
                </div>
              </div>
              <button class="pokedex-entry__close" id="pokedex-overlay-close" data-pokedex-action="close" type="button">X / Enter Close</button>
            </article>
          </section>
          <aside class="nearby-habitats-panel" aria-label="Nearby habitats">
            <div class="nearby-habitats-panel__header">Nearby Habitats</div>
            <div class="nearby-habitats-panel__value" id="nearby-habitats-value"></div>
          </aside>
          <aside class="quest-focus-panel" id="quest-focus-panel" aria-label="Current quest">
            <div class="quest-focus-panel__title" id="quest-focus-title"></div>
            <div class="quest-focus-panel__body" id="quest-focus-body"></div>
          </aside>
          <aside class="bag-onboarding-panel" aria-label="Bag onboarding">
            <div class="bag-onboarding-panel__title" id="bag-onboarding-title"></div>
            <div class="bag-onboarding-panel__body" id="bag-onboarding-body"></div>
          </aside>
          <aside class="bag-details-panel" aria-label="Bag details">
            <div class="bag-details-panel__header">
              <div class="bag-details-panel__item">
                <span class="bag-details-panel__icon" id="bag-details-icon" aria-hidden="true"></span>
                <span class="bag-details-panel__name" id="bag-details-name"></span>
              </div>
              <span class="bag-details-panel__count" id="bag-details-count"></span>
            </div>
            <div class="bag-details-panel__body" id="bag-details-description"></div>
          </aside>
          <div class="hud" id="hud-panel">
            <span id="hud-instructions">Use WASD ou o analogico esquerdo para falar com Chopper. Ele te orientara no que fazer.</span>
            <div class="hud-context" id="hud-context" aria-live="polite"></div>
            <div class="hud-checklist" id="hud-checklist" aria-label="Quest checks"></div>
            <span id="hud-meta"></span>
            <div class="hud__signals">
              <button class="hud-alert" id="pokedex-alert" type="button" hidden data-pulse="false">Pokedex Signal</button>
            </div>
            <div class="hud-control">
              <label for="jitter-slider">
                <span>3D Jitter</span>
                <output id="jitter-value" for="jitter-slider">0%</output>
              </label>
              <input id="jitter-slider" type="range" min="0" max="100" step="1" value="0" />
            </div>
          </div>
          <aside class="missions-panel" id="missions-panel" aria-label="Missoes">
            <div class="missions-header">Missoes</div>
            <div class="missions-stack" id="missions-stack"></div>
          </aside>
          <div class="skills-panel" id="skills-panel" aria-label="Habilidades" hidden>
            <strong>Moves</strong>
            <div class="skills-grid" id="skills-grid"></div>
          </div>
          <div class="inventory" id="inventory-panel" aria-label="Inventario">
            <strong>Supplies</strong>
            <div class="inventory-grid" id="inventory-grid"></div>
          </div>
          <section class="builder-panel" id="builder-panel" hidden aria-label="Winter Burrow handbook"></section>
          <div class="status" id="status">Inicializando cena...</div>
        </div>
        </div>
</div>`;

const GAME_STAGE_ID = "game-stage";
const RENDER_FRAME_ID = "render-frame";

function getElement(documentRef, id) {
  return documentRef.getElementById(id);
}

function getOrCreateMain(documentRef) {
  const existingMain = documentRef.querySelector("main");

  if (existingMain) {
    return existingMain;
  }

  const main = documentRef.createElement("main");
  documentRef.body.appendChild(main);
  return main;
}

function mountGameShell(documentRef) {
  const main = getOrCreateMain(documentRef);

  if (!getElement(documentRef, GAME_STAGE_ID)) {
    main.innerHTML = GAME_SHELL_HTML;
  }

  return main;
}

function resolveGameShellNodes(documentRef, main) {
  const appRoot = documentRef.documentElement;

  return {
    appRoot,
    rootStyle: appRoot.style,
    main,
    gameStage: getElement(documentRef, GAME_STAGE_ID),
    renderFrame: getElement(documentRef, RENDER_FRAME_ID)
  };
}

export function createGameShell({ documentRef = document } = {}) {
  const main = mountGameShell(documentRef);
  return resolveGameShellNodes(documentRef, main);
}
