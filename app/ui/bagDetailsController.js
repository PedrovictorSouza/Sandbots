export function createBagDetailsController({
  iconElement,
  nameElement,
  countElement,
  descriptionElement,
  getItemPurpose = null
} = {}) {
  function getDescriptionCopy(item) {
    const description = item?.description || "";
    const purpose = typeof getItemPurpose === "function" ?
      getItemPurpose(item.id, item) :
      item?.purpose || item?.playerFacingPurpose || "";

    return [
      description,
      purpose ? `Purpose: ${purpose}` : ""
    ].filter(Boolean).join("\n");
  }

  function setItem(item = null, count = 0) {
    if (!item) {
      if (iconElement) {
        iconElement.textContent = "";
        iconElement.style.setProperty("--bag-icon-color", "transparent");
        iconElement.style.setProperty("--bag-icon-ink", "transparent");
      }
      if (nameElement) {
        nameElement.textContent = "";
      }
      if (countElement) {
        countElement.textContent = "";
      }
      if (descriptionElement) {
        descriptionElement.textContent = "";
      }
      return;
    }

    if (iconElement) {
      iconElement.textContent = item.glyph || "?";
      iconElement.style.setProperty("--bag-icon-color", item.color || "#ffffff");
      iconElement.style.setProperty("--bag-icon-ink", item.ink || "#111111");
    }

    if (nameElement) {
      nameElement.textContent = item.bagLabel || item.label || item.id || "";
    }

    if (countElement) {
      countElement.textContent = `x ${count}`;
    }

    if (descriptionElement) {
      descriptionElement.textContent = getDescriptionCopy(item);
    }
  }

  return {
    setItem
  };
}
