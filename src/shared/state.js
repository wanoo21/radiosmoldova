export const DEFAULT_STATE = {
  region: "md",
  currentStation: null,
  favorites: [],
  volume: 0.3,
  isPlaying: false,
  shouldBePlaying: false,
  isLoading: false,
  currentTime: 0,
  lastError: null,
};

export function mergeState(prev, patch) {
  return { ...prev, ...patch };
}
