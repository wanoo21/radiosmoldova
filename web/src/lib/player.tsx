import {
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
  useContext,
  type JSX,
} from "solid-js";
import { isServer } from "solid-js/web";
import type { Station } from "~/lib/stations";

type PlayerContextValue = {
  currentStation: () => Station | null;
  isPlaying: () => boolean;
  isLoading: () => boolean;
  error: () => string;
  volume: () => number;
  reactiveAvailable: () => boolean;
  reactiveEnergy: () => number;
  reactiveBass: () => number;
  reactiveMid: () => number;
  reactiveTreble: () => number;
  playStation: (station: Station) => Promise<void>;
  togglePlayback: () => Promise<void>;
  setVolume: (value: number) => void;
};

const PlayerContext = createContext<PlayerContextValue>();

export function PlayerProvider(props: { children: JSX.Element }) {
  const [currentStation, setCurrentStation] = createSignal<Station | null>(null);
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [volume, setVolumeSignal] = createSignal(0.3);
  const [audio, setAudio] = createSignal<HTMLAudioElement | null>(null);
  const [reactiveAvailable, setReactiveAvailable] = createSignal(false);
  const [reactiveEnergy, setReactiveEnergy] = createSignal(0);
  const [reactiveBass, setReactiveBass] = createSignal(0);
  const [reactiveMid, setReactiveMid] = createSignal(0);
  const [reactiveTreble, setReactiveTreble] = createSignal(0);
  let analyserContext: AudioContext | null = null;

  onMount(() => {
    if (isServer) return;

    const element = new Audio();
    element.preload = "none";
    element.crossOrigin = "anonymous";
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let buffer: Uint8Array | null = null;
    let rafId = 0;

    const avgRange = (fromHz: number, toHz: number) => {
      if (!audioContext || !analyser || !buffer) return 0;
      const nyquist = audioContext.sampleRate / 2;
      const binCount = buffer.length;
      const fromIndex = Math.max(0, Math.floor((fromHz / nyquist) * binCount));
      const toIndex = Math.min(
        binCount - 1,
        Math.ceil((toHz / nyquist) * binCount),
      );
      if (toIndex <= fromIndex) return 0;
      let sum = 0;
      for (let i = fromIndex; i <= toIndex; i += 1) {
        sum += buffer[i];
      }
      return sum / (toIndex - fromIndex + 1) / 255;
    };

    const tickAnalyser = () => {
      if (analyser && buffer) {
        analyser.getByteFrequencyData(buffer);
        const bass = avgRange(40, 180);
        const mid = avgRange(180, 2000);
        const treble = avgRange(2000, 9000);
        const energy = bass * 0.45 + mid * 0.35 + treble * 0.2;

        setReactiveBass(bass);
        setReactiveMid(mid);
        setReactiveTreble(treble);
        setReactiveEnergy(energy);
      }
      rafId = requestAnimationFrame(tickAnalyser);
    };

    try {
      audioContext = new AudioContext();
      analyserContext = audioContext;
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.82;

      const source = audioContext.createMediaElementSource(element);
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      buffer = new Uint8Array(analyser.frequencyBinCount);
      setReactiveAvailable(true);
      rafId = requestAnimationFrame(tickAnalyser);
    } catch {
      setReactiveAvailable(false);
    }

    const savedVolume = Number(localStorage.getItem("radio-volume"));
    if (!Number.isNaN(savedVolume)) {
      const normalized = Math.max(0, Math.min(1, savedVolume));
      setVolumeSignal(normalized);
      element.volume = normalized;
    } else {
      element.volume = 0.3;
    }

    element.addEventListener("loadstart", () => {
      setIsLoading(true);
      setError("");
    });
    element.addEventListener("playing", () => {
      setIsPlaying(true);
      setIsLoading(false);
      setError("");
    });
    element.addEventListener("pause", () => {
      setIsPlaying(false);
      setIsLoading(false);
    });
    element.addEventListener("error", () => {
      setIsPlaying(false);
      setIsLoading(false);
      setError("Stream failed to play in this browser.");
    });

    setAudio(element);

    onCleanup(() => {
      element.pause();
      setAudio(null);
      if (rafId) cancelAnimationFrame(rafId);
      if (audioContext) {
        audioContext.close().catch(() => undefined);
      }
      analyserContext = null;
    });
  });

  createEffect(() => {
    const element = audio();
    if (!element) return;
    element.volume = volume();
  });

  const playStation = async (station: Station) => {
    const element = audio();
    if (!element) return;

    const changed = currentStation()?.url !== station.url;
    setCurrentStation(station);
    setError("");

    if (changed) {
      element.src = station.url;
      element.load();
    }

    try {
      if (analyserContext?.state === "suspended") {
        // Resume after user gesture so analyser graph can produce data.
        await analyserContext.resume();
      }
      setIsLoading(true);
      await element.play();
    } catch (e) {
      setIsPlaying(false);
      setIsLoading(false);
      setError(e instanceof Error ? e.message : "Unable to start playback.");
    }
  };

  const togglePlayback = async () => {
    const element = audio();
    if (!element || !currentStation()) return;

    if (isPlaying()) {
      element.pause();
      return;
    }

    try {
      if (analyserContext?.state === "suspended") {
        await analyserContext.resume();
      }
      setIsLoading(true);
      await element.play();
    } catch (e) {
      setIsPlaying(false);
      setIsLoading(false);
      setError(e instanceof Error ? e.message : "Unable to resume playback.");
    }
  };

  const setVolume = (value: number) => {
    const normalized = Math.max(0, Math.min(1, value));
    setVolumeSignal(normalized);
    if (!isServer) {
      localStorage.setItem("radio-volume", String(normalized));
    }
  };

  return (
    <PlayerContext.Provider
      value={{
        currentStation,
        isPlaying,
        isLoading,
        error,
        volume,
        reactiveAvailable,
        reactiveEnergy,
        reactiveBass,
        reactiveMid,
        reactiveTreble,
        playStation,
        togglePlayback,
        setVolume,
      }}
    >
      {props.children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error("usePlayer must be used inside PlayerProvider");
  }
  return ctx;
}
