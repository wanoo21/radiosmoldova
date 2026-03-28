import { CHANNEL, TYPE } from "../shared/messages.js";

const els = {
  panelHeading: document.getElementById("panelHeading"),
  playPause: document.getElementById("playPause"),
  playPauseIcon: document.getElementById("playPauseIcon"),
  playPauseIconUse: document.getElementById("playPauseIconUse"),
  searchLabel: document.getElementById("searchLabel"),
  title: document.getElementById("title"),
  status: document.getElementById("status"),
  volume: document.getElementById("volume"),
  search: document.getElementById("search"),
  searchHint: document.getElementById("searchHint"),
  favoriteTabButton: document.getElementById("favoriteTabButton"),
  regionMdButton: document.getElementById("regionMdButton"),
  regionRoButton: document.getElementById("regionRoButton"),
  regionUaButton: document.getElementById("regionUaButton"),
  stations: document.getElementById("stations"),
  regionButtons: Array.from(document.querySelectorAll(".regions button")),
};

let appState = null;
let stationList = [];
let stationRenderKey = "";
let pendingStationUrl = null;
let eventsWired = false;

function t(key, fallback = "") {
  const value = chrome.i18n?.getMessage?.(key);
  return value || fallback;
}

function localizeStaticUi() {
  document.title = t("defaultTitle", document.title);
  els.playPause.setAttribute("aria-label", t("playPauseAria", "Play or pause"));
  els.searchLabel.textContent = t("searchLabel", "Search radio stations");
  els.search.placeholder = t("searchPlaceholder", "Search stations");
  els.searchHint.textContent = t(
    "searchHint",
    "Type to filter stations. Press Slash to focus and Escape to clear.",
  );
  els.favoriteTabButton.setAttribute(
    "aria-label",
    t("favoriteTabAria", "Favorite stations"),
  );
  els.regionMdButton.textContent = t("regionMoldova", "Moldova");
  els.regionRoButton.textContent = t("regionRomania", "Romania");
  els.regionUaButton.textContent = t("regionUkraine", "Ukraine");
}

function send(type, payload = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { channel: CHANNEL.POPUP, type, ...payload },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!response?.ok) {
          reject(new Error(response?.error || "Unknown popup command error."));
          return;
        }
        resolve(response);
      },
    );
  });
}

function isFavorite(station) {
  return appState.favorites.some((item) => item.url === station.url);
}

function getStatusKind() {
  if (!appState.currentStation) return "idle";
  if (appState.lastError) return "error";
  if (appState.isPlaying) return "playing";
  if (appState.isLoading) return "loading";
  return "paused";
}

function statusText(kind) {
  if (kind === "idle") return t("statusIdle", "Idle");
  if (kind === "error") return t("statusPlaybackError", "Playback error");
  if (kind === "playing") return t("statusPlaying", "Playing");
  if (kind === "loading") return t("statusLoading", "Loading...");
  return t("statusPaused", "Paused");
}

function renderPlayer() {
  els.title.textContent = appState.currentStation?.name || t("popupSelectStation", "Choose a station from the list");
  const kind = getStatusKind();
  els.status.textContent = statusText(kind);
  els.playPauseIcon.classList.remove("is-spinning");
  if (!appState.currentStation) {
    els.playPauseIconUse.setAttribute("href", "#icon-play");
    els.playPause.disabled = true;
  } else if (kind === "error") {
    els.playPauseIconUse.setAttribute("href", "#icon-error");
    els.playPause.disabled = true;
  } else if (kind === "loading") {
    els.playPauseIconUse.setAttribute("href", "#icon-spinner");
    els.playPauseIcon.classList.add("is-spinning");
    els.playPause.disabled = true;
  } else if (kind === "playing") {
    els.playPauseIconUse.setAttribute("href", "#icon-stop");
    els.playPause.disabled = false;
  } else {
    els.playPauseIconUse.setAttribute("href", "#icon-play");
    els.playPause.disabled = false;
  }

  const volumePercent = Math.round((appState.volume || 0.3) * 100);
  els.volume.value = String(volumePercent);
  els.volume.style.setProperty("--volume-pos", `${volumePercent}%`);
  els.panelHeading.classList.toggle("eq-active", appState.isPlaying || appState.isLoading);

  els.regionButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.region === appState.region);
  });
}

function renderStations() {
  const q = els.search.value.trim().toLowerCase();
  const filtered = stationList.filter((station) =>
    station.name.toLowerCase().includes(q),
  );

  els.stations.innerHTML = filtered
    .map((station) => {
      const active = appState.currentStation?.url === station.url;
      const fav = isFavorite(station);
      return `
        <div class="station ${active ? "active" : ""}" data-url="${station.url}">
          <span>${station.name}</span>
          <button class="fav ${fav ? "active" : ""}" data-fav-url="${station.url}" title="${t("favoriteActionTitle", "Favorite")}">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <use href="${fav ? "#icon-star-filled" : "#icon-star-outline"}"></use>
            </svg>
          </button>
        </div>
      `;
    })
    .join("");
}

function computeStationRenderKey(state, list, query) {
  const favoriteKey = (state.favorites || [])
    .map((item) => item.url)
    .sort()
    .join("|");
  return [
    query || "",
    state.region || "",
    state.currentStation?.url || "",
    favoriteKey,
    list.length,
  ].join("::");
}

function renderStationsIfNeeded() {
  const query = els.search.value.trim().toLowerCase();
  const key = computeStationRenderKey(appState, stationList, query);
  if (key === stationRenderKey) return;
  stationRenderKey = key;
  renderStations();
}

async function loadRegionStations(region) {
  if (region === "favorite") {
    stationList = [...appState.favorites];
    stationRenderKey = "";
    renderStationsIfNeeded();
    return;
  }

  const url = chrome.runtime.getURL(`data/radiolist-${region}.json`);
  const response = await fetch(url);
  const data = await response.json();
  stationList = data.filter((item) => !!item.url && item.disable !== true);
  stationRenderKey = "";
  renderStationsIfNeeded();
}

function wireEvents() {
  if (eventsWired) return;
  eventsWired = true;

  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && document.activeElement !== els.search) {
      event.preventDefault();
      els.search.focus();
      return;
    }
    if (event.key === "Escape" && document.activeElement === els.search) {
      if (els.search.value) {
        els.search.value = "";
        renderStationsIfNeeded();
      }
      els.search.blur();
    }
  });

  els.playPause.addEventListener("click", async () => {
    await send(TYPE.TOGGLE_PLAYBACK);
  });

  els.volume.addEventListener("input", async (event) => {
    const volume = Number(event.target.value) / 100;
    event.target.style.setProperty("--volume-pos", `${event.target.value}%`);
    await send(TYPE.SET_VOLUME, { volume });
  });

  els.search.addEventListener("input", () => renderStationsIfNeeded());

  els.regionButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const region = button.dataset.region;
      const response = await send(TYPE.SET_REGION, { region });
      appState = response.state;
      renderPlayer();
      await loadRegionStations(appState.region);
    });
  });

  els.stations.addEventListener("click", async (event) => {
    const favButton = event.target.closest("[data-fav-url]");
    if (favButton) {
      const url = favButton.dataset.favUrl;
      const station = stationList.find((item) => item.url === url);
      if (!station) return;
      const response = await send(TYPE.TOGGLE_FAVORITE, { station });
      appState = response.state;
      renderPlayer();
      renderStationsIfNeeded();
      return;
    }

    const row = event.target.closest(".station[data-url]");
    if (!row) return;
    const station = stationList.find((item) => item.url === row.dataset.url);
    if (!station) return;

    // Optimistic UI: mark the clicked station active immediately.
    appState = {
      ...appState,
      currentStation: station,
      isLoading: true,
      isPlaying: false,
      lastError: null,
    };
    renderPlayer();
    renderStationsIfNeeded();

    try {
      pendingStationUrl = station.url;
      const response = await send(TYPE.SET_STATION, { station, autoplay: true });
      pendingStationUrl = null;
      appState = response.state;
      renderPlayer();
      renderStationsIfNeeded();
    } catch (error) {
      if (/request aborted/i.test(String(error?.message || ""))) {
        return;
      }
      console.error("SET_STATION failed:", error);
      pendingStationUrl = null;
      appState = {
        ...appState,
        isLoading: false,
        isPlaying: false,
        lastError: error.message,
      };
      renderPlayer();
    }
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.channel !== CHANNEL.STATE || message.type !== TYPE.STATE_UPDATED) {
      return false;
    }
    if (pendingStationUrl && message.state?.currentStation?.url !== pendingStationUrl) {
      appState = { ...message.state, currentStation: appState.currentStation };
    } else {
      if (pendingStationUrl && message.state?.currentStation?.url === pendingStationUrl) {
        pendingStationUrl = null;
      }
      appState = message.state;
    }
    renderPlayer();
    renderStationsIfNeeded();
    return false;
  });
}

async function init() {
  localizeStaticUi();
  appState = {
    region: "md",
    currentStation: null,
    favorites: [],
    volume: 0.3,
    isPlaying: false,
    isLoading: false,
    currentTime: 0,
    lastError: null,
  };
  renderPlayer();
  wireEvents();

  // Load station list immediately; do not block on service worker handshake.
  await loadRegionStations(appState.region);
  renderStationsIfNeeded();

  const response = await send(TYPE.GET_STATE);
  appState = response.state;
  renderPlayer();
  await loadRegionStations(appState.region);
  renderStationsIfNeeded();
}

init().catch((error) => {
  console.error("Popup init failed:", error);
  els.status.textContent = "Playback error";
});
