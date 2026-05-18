export const PLAYER_DISPLAY_NAME_FALLBACK = "Operator";

export function createPlayerProfileState(overrides = {}) {
  return {
    gender: null,
    confirmation: null,
    trainer: null,
    humanClaim: null,
    pokedexReaction: null,
    pokedexChoice: null,
    foundPokedex: false,
    trainerLookChoice: null,
    playerName: "",
    nameConfirmation: null,
    worldQuestion: null,
    ...overrides
  };
}

export function normalizePlayerName(value) {
  return String(value || "").trim().slice(0, 12);
}

export function getPlayerDisplayName(profile = {}) {
  return normalizePlayerName(profile.playerName) || PLAYER_DISPLAY_NAME_FALLBACK;
}

export function formatBuilderCallsignRegisteredNotice(profile = {}) {
  return `Chopper will call you ${getPlayerDisplayName(profile)}.`;
}

export function formatBuilderCallsignAcknowledgement(profile = {}) {
  return `Logged, ${getPlayerDisplayName(profile)}. I will pretend the registry always said that.`;
}

export function formatHouseRegisteredNotice(profile = {}) {
  return `${getPlayerDisplayName(profile)}'s first house is registered.`;
}

export function hasConfirmedPlayerName(profile = {}) {
  return Boolean(normalizePlayerName(profile.playerName) && profile.nameConfirmation);
}

export function confirmPlayerName(profile, {
  playerName,
  nameConfirmation = "yes"
} = {}) {
  if (!profile) {
    return false;
  }

  const normalizedName = normalizePlayerName(playerName);
  if (!normalizedName) {
    profile.playerName = "";
    profile.nameConfirmation = null;
    return false;
  }

  profile.playerName = normalizedName;
  profile.nameConfirmation = nameConfirmation || "yes";
  return true;
}

export function clonePlayerProfileState(profile = {}) {
  return createPlayerProfileState({
    gender: profile.gender || null,
    confirmation: profile.confirmation || null,
    trainer: profile.trainer || null,
    humanClaim: profile.humanClaim || null,
    pokedexReaction: profile.pokedexReaction || null,
    pokedexChoice: profile.pokedexChoice || null,
    foundPokedex: Boolean(profile.foundPokedex),
    trainerLookChoice: profile.trainerLookChoice || null,
    playerName: normalizePlayerName(profile.playerName),
    nameConfirmation: profile.nameConfirmation || null,
    worldQuestion: profile.worldQuestion || null
  });
}

export function applySavedPlayerProfile(profile, savedProfile) {
  if (!profile || !savedProfile || typeof savedProfile !== "object") {
    return false;
  }

  Object.assign(profile, clonePlayerProfileState(savedProfile));
  return true;
}
