function applyElementStyles(element, styles) {
  Object.assign(element.style, styles);
}

function createElement(documentRef, tagName, className, text = "") {
  const element = documentRef.createElement(tagName);
  if (className) {
    element.className = className;
  }
  if (text) {
    element.textContent = text;
  }
  return element;
}

function ensureModalStyles(documentRef) {
  if (!documentRef || documentRef.getElementById("leafage-object-modal-animation")) {
    return;
  }

  const style = documentRef.createElement("style");
  style.id = "leafage-object-modal-animation";
  style.textContent = `
@keyframes leafageObjectModalCloseHintBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.28; }
}`;
  documentRef.head?.append(style);
}

export function createLeafageObjectModalController({
  mount,
  clearGameFlowInput
}) {
  let root = null;
  let options = [];
  let selectedIndex = 0;
  let selectedId = "tallGrass";
  let onSelect = null;
  let open = false;

  function getDocument() {
    return mount?.ownerDocument || globalThis.document || null;
  }

  function ensureRoot() {
    const documentRef = getDocument();
    if (root || !mount || !documentRef) {
      return root;
    }

    root = createElement(documentRef, "section", "leafage-object-modal");
    root.hidden = true;
    root.setAttribute("aria-label", "Leafage object selector");
    root.setAttribute("role", "dialog");
    applyElementStyles(root, {
      position: "absolute",
      inset: "0",
      zIndex: "18",
      display: "none",
      placeItems: "center",
      pointerEvents: "auto",
      background: "rgba(6, 7, 12, 0.34)",
      imageRendering: "pixelated"
    });
    mount.append(root);
    return root;
  }

  function close() {
    if (!root) {
      return;
    }

    root.hidden = true;
    root.style.display = "none";
    root.replaceChildren();
    options = [];
    selectedIndex = 0;
    onSelect = null;
    open = false;
    clearGameFlowInput?.();
  }

  function selectIndex(index) {
    if (!options.length) {
      selectedIndex = 0;
      return;
    }

    selectedIndex = (index + options.length) % options.length;
    selectedId = options[selectedIndex]?.id || selectedId;
  }

  function moveSelection(direction) {
    if (options.length <= 1) {
      return;
    }

    selectIndex(selectedIndex + direction);
    render();
  }

  function confirm() {
    const option = options[selectedIndex] || null;
    if (!open || !option || typeof onSelect !== "function") {
      return false;
    }

    selectedId = option.id;
    onSelect(option);
    close();
    return true;
  }

  function render() {
    const documentRef = getDocument();
    const currentRoot = ensureRoot();
    if (!documentRef || !currentRoot || !options.length) {
      return;
    }

    ensureModalStyles(documentRef);
    currentRoot.replaceChildren();

    const selectedOption = options[selectedIndex] || options[0];
    const panel = createElement(documentRef, "div", "leafage-object-modal__panel");
    applyElementStyles(panel, {
      position: "relative",
      width: "min(760px, 90%)",
      border: "4px solid #f5c16a",
      boxShadow: "0 0 0 4px #2b202c, 0 18px 0 rgba(0, 0, 0, 0.28)",
      background: "#15101a",
      color: "#fff1cf",
      padding: "22px 24px",
      fontFamily: "var(--game-ui-font, monospace)",
      letterSpacing: "0",
      textTransform: "uppercase"
    });

    const header = createElement(documentRef, "div", "leafage-object-modal__header");
    applyElementStyles(header, {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: "18px",
      marginBottom: "14px"
    });

    const title = createElement(documentRef, "strong", "leafage-object-modal__title", "Leafage");
    applyElementStyles(title, {
      display: "block",
      color: "#ffffff",
      fontSize: "36px",
      lineHeight: "1"
    });
    const selectHint = createElement(documentRef, "span", "leafage-object-modal__hint-select", "Left/Right Select");
    applyElementStyles(selectHint, {
      display: "block",
      color: "#d6b68a",
      fontSize: "20px",
      lineHeight: "1",
      whiteSpace: "nowrap"
    });
    header.append(title, selectHint);

    const grid = createElement(documentRef, "div", "leafage-object-modal__grid");
    applyElementStyles(grid, {
      width: "100%",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
      gap: "24px",
      alignItems: "stretch"
    });

    options.forEach((option, index) => {
      const selected = index === selectedIndex;
      const card = createElement(documentRef, "button", "leafage-object-modal__option");
      card.type = "button";
      card.dataset.selected = selected ? "true" : "false";
      card.dataset.optionId = option.id;
      applyElementStyles(card, {
        width: "100%",
        minHeight: "clamp(220px, 32vw, 312px)",
        display: "grid",
        gridTemplateColumns: "1fr",
        gridTemplateRows: "minmax(156px, 1fr) auto",
        gap: "0",
        alignItems: "stretch",
        border: selected ? "5px solid rgb(137 255 0)" : "5px solid #f5c16a",
        backgroundColor: selected ? "#4b3740" : "#3b2a30",
        backgroundImage: option.artworkUrl ? `url("${option.artworkUrl}")` : "none",
        backgroundSize: option.artworkUrl ? "cover" : "auto",
        backgroundPosition: option.artworkUrl ? "center" : "initial",
        backgroundRepeat: "no-repeat",
        color: "#fff1cf",
        padding: "0",
        textAlign: "left",
        font: "inherit",
        cursor: "pointer",
        overflow: "hidden"
      });

      const art = createElement(documentRef, "span", "leafage-object-modal__art");
      applyElementStyles(art, {
        display: "block",
        minHeight: "clamp(152px, 24vw, 236px)"
      });
      const copy = createElement(documentRef, "span", "leafage-object-modal__copy");
      applyElementStyles(copy, {
        display: "block",
        padding: "18px",
        background: "none",
        visibility: selected ? "visible" : "hidden",
        opacity: selected ? "1" : "0"
      });
      const name = createElement(documentRef, "span", "leafage-object-modal__name", option.label);
      applyElementStyles(name, {
        display: "block",
        color: "#ffffff",
        fontSize: "28px",
        lineHeight: "1"
      });
      const status = createElement(
        documentRef,
        "span",
        "leafage-object-modal__status",
        selected ? "Selected" : "Available"
      );
      applyElementStyles(status, {
        display: "block",
        color: selected ? "#03A9F4" : "#b89c76",
        fontSize: "20px",
        lineHeight: "1.1",
        marginTop: "7px"
      });
      copy.append(name, status);
      card.append(art, copy);

      card.addEventListener("click", () => {
        selectIndex(index);
        confirm();
      });
      grid.append(card);
    });

    const hint = createElement(documentRef, "p", "leafage-object-modal__hint");
    applyElementStyles(hint, {
      margin: "14px 0 0",
      color: "#ffffff",
      fontSize: "24px",
      lineHeight: "1"
    });
    hint.textContent = `X Choose ${selectedOption?.label || "Object"}`;

    const closeHint = createElement(documentRef, "span", "leafage-object-modal__hint-close", "B Close");
    applyElementStyles(closeHint, {
      position: "absolute",
      right: "24px",
      bottom: "18px",
      color: "#ff4d4d",
      textShadow: "0 0 0 #2b0505, 0 2px 0 #2b0505",
      animation: "leafageObjectModalCloseHintBlink 0.9s steps(2, end) infinite"
    });

    panel.append(header, grid, hint, closeHint);
    currentRoot.append(panel);
  }

  return {
    open({
      options: nextOptions = [],
      selectedId: nextSelectedId = "tallGrass",
      onSelect: nextOnSelect = null
    } = {}) {
      options = nextOptions.filter(Boolean);
      if (!options.length) {
        return false;
      }

      selectedId = nextSelectedId || selectedId;
      selectedIndex = Math.max(0, options.findIndex((option) => option.id === selectedId));
      if (selectedIndex < 0) {
        selectedIndex = 0;
      }
      onSelect = nextOnSelect;
      open = true;
      render();

      if (root) {
        root.hidden = false;
        root.style.display = "grid";
      }
      clearGameFlowInput?.();
      return true;
    },
    close,
    handleKeydown(event) {
      if (!open) {
        return false;
      }

      if (event.code === "KeyX" || event.code === "Enter") {
        confirm();
        return true;
      }

      if (event.code === "ArrowRight" || event.code === "ArrowDown") {
        moveSelection(1);
        return true;
      }

      if (event.code === "ArrowLeft" || event.code === "ArrowUp") {
        moveSelection(-1);
        return true;
      }

      if (event.code === "KeyB" || event.code === "Space" || event.code === "Escape") {
        close();
        return true;
      }

      return true;
    },
    isOpen() {
      return open;
    }
  };
}
