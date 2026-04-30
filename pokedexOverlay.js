import { getPokedexEntry, SQUIRTLE_POKEDEX_ENTRY_ID } from "./pokedexEntries.js";
import { getPokedexRequest } from "./pokedexRequests.js";

const POKEDEX_PAGE_ORDER = ["details", "where-to-find", "specialties", "requests"];

function isValidPage(page) {
  return POKEDEX_PAGE_ORDER.includes(page);
}

export function createPokedexOverlay({ root, onClose = () => {} } = {}) {
  if (!(root instanceof HTMLElement)) {
    throw new Error("Pokedex overlay root invalido.");
  }

  const state = {
    open: !root.hidden,
    page: "details",
    entryId: SQUIRTLE_POKEDEX_ENTRY_ID,
    requestId: null
  };

  const entryElement = root.querySelector(".pokedex-entry");

  function setText(field, value) {
    const elements = root.querySelectorAll(`[data-pokedex-field="${field}"]`);
    for (const element of elements) {
      element.textContent = value ?? "";
    }
  }

  function setHtml(field, value) {
    const elements = root.querySelectorAll(`[data-pokedex-field="${field}"]`);
    for (const element of elements) {
      element.innerHTML = value ?? "";
    }
  }

  function setFieldValue(field, value, html = false) {
    if (html) {
      setHtml(field, value);
      return;
    }

    setText(field, value);
  }

  function getPageButtons() {
    return [...root.querySelectorAll("[data-pokedex-page-target]")];
  }

  function getPanels() {
    return [...root.querySelectorAll("[data-pokedex-page-panel]")];
  }

  function syncEntry() {
    const entry = getPokedexEntry(state.entryId);

    root.dataset.entryId = entry.id;
    if (entryElement) {
      entryElement.dataset.pokedexTheme = entry.theme;
      entryElement.dataset.pokedexArt = entry.artVariant;
      entryElement.dataset.pokedexDrawer = entry.drawer ? "visible" : "hidden";
    }

    setText("number", entry.number);
    setText("name", entry.name);
    setText("details-eyebrow", entry.details.eyebrow);
    setText("species", entry.details.species);
    setHtml("description", entry.details.descriptionHtml);
    setText("detail-stat-label-0", entry.details.stats[0].label);
    setText("detail-stat-value-0", entry.details.stats[0].value);
    setText("detail-stat-label-1", entry.details.stats[1].label);
    setText("detail-stat-value-1", entry.details.stats[1].value);
    setText("detail-stat-label-2", entry.details.stats[2].label);
    setText("detail-type-icon", entry.details.stats[2].badgeIcon);
    setText("detail-type-label", entry.details.stats[2].badgeLabel);

    setText("where-eyebrow", entry.whereToFind.eyebrow);
    setFieldValue("where-pin", entry.whereToFind.pinHtml || entry.whereToFind.pin, Boolean(entry.whereToFind.pinHtml));
    setFieldValue(
      "where-island",
      entry.whereToFind.islandHtml || entry.whereToFind.island,
      Boolean(entry.whereToFind.islandHtml)
    );
    setText("where-count", entry.whereToFind.count);
    setText("where-stat-label-0", entry.whereToFind.stats[0].label);
    setFieldValue(
      "where-stat-value-0",
      entry.whereToFind.stats[0].valueHtml || entry.whereToFind.stats[0].value,
      Boolean(entry.whereToFind.stats[0].valueHtml)
    );
    setText("where-stat-label-1", entry.whereToFind.stats[1].label);
    setFieldValue(
      "where-stat-value-1",
      entry.whereToFind.stats[1].valueHtml || entry.whereToFind.stats[1].value,
      Boolean(entry.whereToFind.stats[1].valueHtml)
    );

    setText("specialties-eyebrow", entry.specialties.eyebrow);
    setText("specialty-title", entry.specialties.specialtyTitle);
    setText("specialty-icon", entry.specialties.specialtyIcon);
    setText("specialty-label", entry.specialties.specialtyLabel);
    setText("favorites-title", entry.specialties.favoritesTitle);
    setText("habitat-title", entry.specialties.habitatTitle);
    setText("habitat-copy", entry.specialties.habitatCopy);

    const favoritesList = root.querySelector('[data-pokedex-field="favorites-list"]');
    if (favoritesList) {
      favoritesList.innerHTML = entry.specialties.favorites
        .map((favorite) => `<li>${favorite}</li>`)
        .join("");
    }

    setText("art-card-title", entry.artCard.title);
    setText("art-time", entry.artCard.time);
    setText("art-rarity", entry.artCard.rarity);
    setText("drawer-icon", entry.drawer?.icon || "");
    setText("drawer-label", entry.drawer?.label || "");
    setText("drawer-count", entry.drawer?.count || "");

    for (const artScene of root.querySelectorAll("[data-pokedex-art-scene]")) {
      artScene.hidden = artScene.dataset.pokedexArtScene !== entry.artVariant;
    }
  }

  function syncRequest() {
    const request = getPokedexRequest(state.requestId);

    setText("request-status", request?.status || "No Active Request");
    setText("request-giver", request?.giver || "Pokedex");
    setText("request-title", request?.title || "No requests yet");
    setText(
      "request-description",
      request?.description || "Keep restoring habitats and checking in with Pokemon."
    );
    setText("request-objective", request?.objective || "No objective tracked.");
    setText("request-reward", request?.reward || "No reward listed.");
  }

  function sync() {
    root.hidden = !state.open;
    root.dataset.page = state.page;
    syncEntry();
    syncRequest();

    for (const button of getPageButtons()) {
      button.dataset.active = button.dataset.pokedexPageTarget === state.page ? "true" : "false";
    }

    for (const panel of getPanels()) {
      panel.hidden = panel.dataset.pokedexPagePanel !== state.page;
    }
  }

  function setPage(page) {
    if (!isValidPage(page) || state.page === page) {
      return;
    }

    state.page = page;
    sync();
  }

  function cyclePage(direction) {
    const currentIndex = POKEDEX_PAGE_ORDER.indexOf(state.page);
    const nextIndex = (currentIndex + direction + POKEDEX_PAGE_ORDER.length) % POKEDEX_PAGE_ORDER.length;
    setPage(POKEDEX_PAGE_ORDER[nextIndex]);
  }

  root.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-pokedex-action]");
    if (actionButton) {
      const action = actionButton.dataset.pokedexAction;
      if (action === "prev") {
        cyclePage(-1);
        return;
      }
      if (action === "next") {
        cyclePage(1);
        return;
      }
      if (action === "close") {
        onClose();
      }
      return;
    }

    const pageButton = event.target.closest("[data-pokedex-page-target]");
    if (pageButton) {
      setPage(pageButton.dataset.pokedexPageTarget || "details");
    }
  });

  sync();

  return {
    isOpen() {
      return state.open;
    },
    getPage() {
      return state.page;
    },
    getEntryId() {
      return state.entryId;
    },
    setEntry(entryId) {
      state.entryId = getPokedexEntry(entryId).id;
      sync();
    },
    setPage,
    nextPage() {
      cyclePage(1);
    },
    prevPage() {
      cyclePage(-1);
    },
    setOpen(open, { page = "details", preservePage = false, entryId = null, requestId = null } = {}) {
      state.open = open;
      if (open && !preservePage) {
        state.page = isValidPage(page) ? page : "details";
      }
      if (open && entryId) {
        state.entryId = getPokedexEntry(entryId).id;
      }
      if (open && requestId) {
        state.requestId = requestId;
      }
      sync();
    },
    handleKeydown(event) {
      if (!state.open) {
        return false;
      }

      if (event.code === "ArrowLeft") {
        cyclePage(-1);
        event.preventDefault();
        return true;
      }

      if (event.code === "ArrowRight") {
        cyclePage(1);
        event.preventDefault();
        return true;
      }

      if (
        event.code === "Escape" ||
        event.code === "KeyB" ||
        event.code === "KeyX" ||
        event.code === "Enter" ||
        event.code === "Space"
      ) {
        onClose();
        event.preventDefault();
        return true;
      }

      return false;
    }
  };
}
