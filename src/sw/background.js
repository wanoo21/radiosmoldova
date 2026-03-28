import { CHANNEL, TYPE } from "../shared/messages.js";
import { DEFAULT_STATE, mergeState } from "../shared/state.js";
import { loadPersistedState, savePersistedState } from "../shared/storage.js";

let state = { ...DEFAULT_STATE };
let initialized = false;
let initPromise = null;
let offscreenReadyPromise = null;
let stationSwitchController = null;

const OFFSCREEN_URL = "src/offscreen/offscreen.html";
const MESSAGE_TIMEOUT_MS = 5000;
const OFFSCREEN_RETRIES = 4;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function abortError() {
  const error = new Error("Request aborted");
  error.name = "AbortError";
  return error;
}

function throwIfAborted(signal) {
  if (signal?.aborted) throw abortError();
}

function withTimeout(promise, timeoutMs, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

async function hasOffscreenContext() {
  if (!chrome.runtime.getContexts) return false;
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN_URL)],
  });
  return contexts.length > 0;
}

async function ensureOffscreenInternal() {
  if (await hasOffscreenContext()) return;

  await chrome.offscreen.createDocument({
    url: OFFSCREEN_URL,
    reasons: ["AUDIO_PLAYBACK"],
    justification: "Play radio streams while popup is closed.",
  });
}

async function ensureOffscreen() {
  if (offscreenReadyPromise) {
    return offscreenReadyPromise;
  }

  offscreenReadyPromise = (async () => {
    let lastError = null;
    for (let attempt = 1; attempt <= OFFSCREEN_RETRIES; attempt += 1) {
      try {
        await ensureOffscreenInternal();
        return;
      } catch (error) {
        lastError = error;
        // Duplicate create from racing calls is safe.
        if (String(error?.message || "").includes("Only a single offscreen")) {
          return;
        }
        await delay(150 * attempt);
      }
    }
    throw lastError || new Error("Failed to create offscreen document.");
  })();

  try {
    await offscreenReadyPromise;
  } finally {
    offscreenReadyPromise = null;
  }
}

async function sendToOffscreen(type, payload = {}) {
  const sendOnce = async () => {
    await ensureOffscreen();
    const response = await withTimeout(
      new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { channel: CHANNEL.AUDIO, type, ...payload },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            resolve(response || { ok: false, error: "No response received." });
          },
        );
      }),
      MESSAGE_TIMEOUT_MS,
      `Offscreen message (${type})`,
    );
    if (response?.ok === false) {
      throw new Error(response.error || `Offscreen request failed: ${type}`);
    }
    return response;
  };

  try {
    return await sendOnce();
  } catch (error) {
    // Offscreen may have been torn down between calls; retry once after recreate.
    offscreenReadyPromise = null;
    await delay(150);
    return sendOnce();
  }
}

function broadcastState() {
  chrome.runtime.sendMessage({
    channel: CHANNEL.STATE,
    type: TYPE.STATE_UPDATED,
    state,
  });
}

async function setState(patch, persist = false) {
  state = mergeState(state, patch);
  if (persist) {
    await savePersistedState(state);
  }
  broadcastState();
}

async function init() {
  if (initialized) return state;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    state = await loadPersistedState();
    await ensureOffscreen();
    await sendToOffscreen(TYPE.AUDIO_SET_VOLUME, { volume: state.volume });
    if (state.currentStation?.url) {
      await sendToOffscreen(TYPE.AUDIO_LOAD, { station: state.currentStation });
      if (state.shouldBePlaying) {
        await sendToOffscreen(TYPE.AUDIO_PLAY);
      }
    }
    initialized = true;
    return state;
  })();

  try {
    return await initPromise;
  } finally {
    initPromise = null;
  }
}

chrome.runtime.onInstalled.addListener(() => {
  init();
});

chrome.runtime.onStartup.addListener(() => {
  init();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // Offscreen -> SW events
  if (message.channel === CHANNEL.AUDIO && message.type) {
    if (message.type === TYPE.AUDIO_LOADSTART || message.type === TYPE.AUDIO_WAITING) {
      setState({ isLoading: true, lastError: null });
      return false;
    }
    if (message.type === TYPE.AUDIO_PLAYING) {
      setState({ isPlaying: true, isLoading: false, lastError: null });
      return false;
    }
    if (message.type === TYPE.AUDIO_PAUSED) {
      setState({ isPlaying: false, isLoading: false });
      return false;
    }
    if (message.type === TYPE.AUDIO_TIMEUPDATE) {
      setState({ currentTime: Number(message.currentTime || 0) });
      return false;
    }
    if (message.type === TYPE.AUDIO_ERROR) {
      setState({ isPlaying: false, isLoading: false, lastError: message.lastError || "Audio error" });
      return false;
    }
    return false;
  }

  // Popup -> SW commands
  if (message.channel !== CHANNEL.POPUP) return false;

  let responded = false;
  const safeSendResponse = (payload) => {
    if (responded) return;
    responded = true;
    try {
      sendResponse(payload);
    } catch {
      // Ignore send failures when popup closes before response arrives.
    }
  };
  const responseGuard = setTimeout(() => {
    safeSendResponse({ ok: false, error: "Background request timed out." });
  }, MESSAGE_TIMEOUT_MS + 1500);

  (async () => {
    await init();

    switch (message.type) {
      case TYPE.GET_STATE: {
        const audioState = await sendToOffscreen(TYPE.AUDIO_GET_STATE);
        if (audioState?.ok && audioState.snapshot) {
          await setState(
            {
              isPlaying: !!audioState.snapshot.isPlaying,
              isLoading: !!audioState.snapshot.isLoading,
              currentTime: Number(audioState.snapshot.currentTime || 0),
              volume: Number(audioState.snapshot.volume ?? state.volume),
              currentStation: audioState.snapshot.currentStation || state.currentStation,
            },
            false,
          );
        }
        // Consistency recovery: if user expected playback, ensure it resumes.
        if (state.shouldBePlaying && state.currentStation?.url && !state.isPlaying) {
          await sendToOffscreen(TYPE.AUDIO_PLAY);
        }
        safeSendResponse({ ok: true, state });
        return;
      }
      case TYPE.SET_REGION: {
        await setState({ region: message.region || "md" }, true);
        safeSendResponse({ ok: true, state });
        return;
      }
      case TYPE.SET_STATION: {
        if (stationSwitchController) stationSwitchController.abort();
        const controller = new AbortController();
        stationSwitchController = controller;
        const signal = controller.signal;

        const station = message.station || null;
        await setState(
          {
            currentStation: station,
            isLoading: true,
            isPlaying: false,
            currentTime: 0,
            shouldBePlaying: !!message.autoplay,
            lastError: null,
          },
          true,
        );

        throwIfAborted(signal);
        await sendToOffscreen(TYPE.AUDIO_LOAD, { station });
        throwIfAborted(signal);
        if (message.autoplay) {
          await sendToOffscreen(TYPE.AUDIO_PLAY);
          throwIfAborted(signal);
        }
        if (stationSwitchController === controller) {
          stationSwitchController = null;
        }
        safeSendResponse({ ok: true, state });
        return;
      }
      case TYPE.TOGGLE_PLAYBACK: {
        if (state.isPlaying) {
          await sendToOffscreen(TYPE.AUDIO_PAUSE);
          await setState({ shouldBePlaying: false }, true);
        } else if (state.currentStation?.url) {
          await sendToOffscreen(TYPE.AUDIO_PLAY);
          await setState({ shouldBePlaying: true }, true);
        }
        safeSendResponse({ ok: true, state });
        return;
      }
      case TYPE.SET_VOLUME: {
        const volume = Math.max(0, Math.min(1, Number(message.volume ?? 0.3)));
        await sendToOffscreen(TYPE.AUDIO_SET_VOLUME, { volume });
        await setState({ volume }, true);
        safeSendResponse({ ok: true, state });
        return;
      }
      case TYPE.TOGGLE_FAVORITE: {
        const station = message.station;
        if (!station?.url) {
          safeSendResponse({ ok: false, error: "Invalid station." });
          return;
        }
        const exists = state.favorites.some((item) => item.url === station.url);
        const favorites = exists
          ? state.favorites.filter((item) => item.url !== station.url)
          : [...state.favorites, station];
        await setState({ favorites }, true);
        safeSendResponse({ ok: true, state });
        return;
      }
      default:
        safeSendResponse({ ok: false, error: "Unknown popup message type." });
    }
  })().catch(async (error) => {
    if (error?.name === "AbortError" || /request aborted/i.test(String(error?.message || ""))) {
      safeSendResponse({ ok: false, error: "Request aborted" });
      return;
    }
    try {
      await setState({
        isLoading: false,
        isPlaying: false,
        lastError: error.message || "Unknown background error.",
      });
    } catch {
      // Ignore secondary state update errors and still respond.
    }
    safeSendResponse({ ok: false, error: error.message });
  }).finally(() => {
    clearTimeout(responseGuard);
  });

  return true;
});
