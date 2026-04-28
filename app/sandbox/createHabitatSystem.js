function getEventKey(event) {
  return `${event.type}:${event.targetId || "*"}`;
}

function getRequirementProgress(requirement, eventTotals) {
  return eventTotals[`${requirement.type}:${requirement.targetId || "*"}`] || 0;
}

function isHabitatDiscovered(habitat, discoveredHabitatIds) {
  return discoveredHabitatIds.includes(habitat.id);
}

function habitatRequirementsMet(habitat, eventTotals) {
  if (!Array.isArray(habitat.requirements) || !habitat.requirements.length) {
    return false;
  }

  return habitat.requirements.every((requirement) => {
    return getRequirementProgress(requirement, eventTotals) >= requirement.required;
  });
}

export function createHabitatSystem({
  habitats = [],
  storyState,
  onDiscover = () => {}
} = {}) {
  if (!storyState?.flags) {
    throw new Error("HabitatSystem requires storyState.flags.");
  }

  storyState.flags.habitatEventTotals ||= {};
  storyState.flags.discoveredHabitatIds ||= [];

  function ensureHabitatState() {
    storyState.flags.habitatEventTotals ||= {};
    storyState.flags.discoveredHabitatIds ||= [];
    return {
      eventTotals: storyState.flags.habitatEventTotals,
      discoveredHabitatIds: storyState.flags.discoveredHabitatIds
    };
  }

  function getDiscoveredHabitats() {
    const { discoveredHabitatIds } = ensureHabitatState();
    return habitats.filter((habitat) => {
      return isHabitatDiscovered(habitat, discoveredHabitatIds);
    });
  }

  function getDiscoveredLabels() {
    return getDiscoveredHabitats().map((habitat) => habitat.label);
  }

  function discoverHabitat(habitat, context = {}) {
    const { discoveredHabitatIds } = ensureHabitatState();

    if (isHabitatDiscovered(habitat, discoveredHabitatIds)) {
      return false;
    }

    discoveredHabitatIds.push(habitat.id);

    if (habitat.reveals?.flag) {
      storyState.flags[habitat.reveals.flag] = true;
    }

    onDiscover({
      habitat,
      discoveredHabitats: getDiscoveredHabitats(),
      context
    });
    return true;
  }

  function recordEvent(event) {
    if (!event?.type) {
      return [];
    }

    const amount = Math.max(1, Number(event.amount || 1));
    const eventKey = getEventKey(event);
    const { eventTotals, discoveredHabitatIds } = ensureHabitatState();
    eventTotals[eventKey] = (eventTotals[eventKey] || 0) + amount;

    const newlyDiscovered = [];
    for (const habitat of habitats) {
      if (
        isHabitatDiscovered(habitat, discoveredHabitatIds) ||
        !habitatRequirementsMet(habitat, eventTotals)
      ) {
        continue;
      }

      if (discoverHabitat(habitat, { event })) {
        newlyDiscovered.push(habitat);
      }
    }

    return newlyDiscovered;
  }

  return {
    discoverHabitat,
    getDiscoveredHabitats,
    getDiscoveredLabels,
    recordEvent
  };
}
