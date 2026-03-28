import { DEFAULT_STATE } from "./state.js";

const KEY = "radio_state_v3";

export async function loadPersistedState() {
  const result = await chrome.storage.local.get(KEY);
  return { ...DEFAULT_STATE, ...(result[KEY] || {}) };
}

export async function savePersistedState(state) {
  const toPersist = {
    region: state.region,
    currentStation: state.currentStation,
    favorites: state.favorites,
    volume: state.volume,
    shouldBePlaying: state.shouldBePlaying,
  };
  await chrome.storage.local.set({ [KEY]: toPersist });
}
