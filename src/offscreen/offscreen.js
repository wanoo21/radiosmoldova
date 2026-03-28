import { CHANNEL, TYPE } from "../shared/messages.js";

const audio = new Audio();
audio.preload = "none";

let currentStation = null;
let isLoading = false;
const PLAY_RESPONSE_TIMEOUT_MS = 5000;
let playAbortController = null;

function abortPendingPlay() {
  if (playAbortController) {
    playAbortController.abort();
    playAbortController = null;
  }
}

function send(type, patch = {}) {
  chrome.runtime.sendMessage({
    channel: CHANNEL.AUDIO,
    type,
    ...patch,
  });
}

audio.addEventListener("loadstart", () => {
  isLoading = true;
  send(TYPE.AUDIO_LOADSTART);
});
audio.addEventListener("waiting", () => {
  isLoading = true;
  send(TYPE.AUDIO_WAITING);
});
audio.addEventListener("playing", () => {
  isLoading = false;
  send(TYPE.AUDIO_PLAYING);
});
audio.addEventListener("pause", () => {
  isLoading = false;
  send(TYPE.AUDIO_PAUSED);
});
audio.addEventListener("timeupdate", () =>
  send(TYPE.AUDIO_TIMEUPDATE, { currentTime: audio.currentTime }),
);
audio.addEventListener("error", () => {
  isLoading = false;
  send(TYPE.AUDIO_ERROR, { lastError: "Audio stream failed to load." });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.channel !== CHANNEL.AUDIO) return false;

  switch (message.type) {
    case TYPE.AUDIO_LOAD:
      abortPendingPlay();
      currentStation = message.station || null;
      if (currentStation?.url) {
        isLoading = true;
        audio.src = currentStation.url;
        audio.load();
      }
      sendResponse({ ok: true });
      return false;
    case TYPE.AUDIO_PLAY:
      {
        abortPendingPlay();
        const controller = new AbortController();
        const { signal } = controller;
        playAbortController = controller;
        let responded = false;
        const done = (payload) => {
          if (responded) return;
          responded = true;
          if (playAbortController === controller) {
            playAbortController = null;
          }
          sendResponse(payload);
        };
        signal.addEventListener(
          "abort",
          () => done({ ok: false, error: "Request aborted" }),
          { once: true },
        );
        setTimeout(() => {
          done({ ok: false, error: "AUDIO_PLAY timed out." });
        }, PLAY_RESPONSE_TIMEOUT_MS);
        audio
          .play()
          .then(() => {
            if (signal.aborted) return;
            done({ ok: true });
          })
          .catch((error) => done({ ok: false, error: error.message }));
      }
      return true;
    case TYPE.AUDIO_PAUSE:
      abortPendingPlay();
      isLoading = false;
      audio.pause();
      sendResponse({ ok: true });
      return false;
    case TYPE.AUDIO_SET_VOLUME:
      audio.volume = Math.max(0, Math.min(1, Number(message.volume ?? 0.3)));
      sendResponse({ ok: true });
      return false;
    case TYPE.AUDIO_GET_STATE:
      sendResponse({
        ok: true,
        snapshot: {
          currentTime: audio.currentTime || 0,
          isPlaying: !audio.paused,
          isLoading: !!isLoading,
          volume: audio.volume,
          currentStation,
        },
      });
      return false;
    default:
      sendResponse({ ok: false, error: "Unknown audio message type." });
      return false;
  }
});
