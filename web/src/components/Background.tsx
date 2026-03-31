import { createSignal, onCleanup, onMount } from "solid-js";
import { isServer } from "solid-js/web";
import { usePlayer } from "~/lib/player";

export default function Background() {
  const player = usePlayer();

  // Smoothed reactive signals — each band drives one blob
  const [bass, setBass] = createSignal(0);
  const [mid, setMid] = createSignal(0);
  const [treble, setTreble] = createSignal(0);
  const [energy, setEnergy] = createSignal(0);
  const [beat, setBeat] = createSignal(0);     // transient flash on sharp bass attack
  const [hue, setHue] = createSignal(0);       // global disco colour drift

  // Debug
  const [mode, setMode] = createSignal<"idle" | "analyser" | "fallback">("idle");
  const [showDebug, setShowDebug] = createSignal(false);

  // Raw mutable smoothing state (kept outside signals for performance)
  let sBass = 0, sMid = 0, sTreble = 0, sEnergy = 0, sBeat = 0, sHue = 0;
  let prevRawBass = 0;

  onMount(() => {
    if (isServer) return;

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const onKeydown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === "d")
        setShowDebug((v) => !v);
    };
    window.addEventListener("keydown", onKeydown);

    if (reduced) {
      onCleanup(() => window.removeEventListener("keydown", onKeydown));
      return;
    }

    let raf = 0;

    const clamp = (v: number) => Math.max(0, Math.min(1, v));

    // Gate noise floor, apply gain so quiet radio streams still show motion.
    const amp = (v: number) => clamp(Math.max(0, v - 0.025) * 3.8);

    // Separate attack / decay lerp.
    const lerp = (cur: number, tgt: number, atk: number, dec: number) =>
      cur + (tgt - cur) * (tgt > cur ? atk : dec);

    const tick = (t: number) => {
      const active = player.isPlaying() || player.isLoading();
      const rawBass = player.reactiveBass();
      const rawMid = player.reactiveMid();
      const rawTreble = player.reactiveTreble();
      const gBass = amp(rawBass);
      const gMid = amp(rawMid);
      const gTreble = amp(rawTreble);
      const hasData =
        player.reactiveAvailable() && gBass + gMid + gTreble > 0.01;

      let tBass = 0, tMid = 0, tTreble = 0;

      if (active && hasData) {
        tBass   = gBass;
        tMid    = gMid;
        tTreble = gTreble;
        setMode("analyser");
      } else if (active) {
        // Synthetic fallback — still looks alive.
        tBass   = 0.5 * ((Math.sin(t * 0.0011) + 1) / 2);
        tMid    = 0.44 * ((Math.sin(t * 0.0016 + 1.4) + 1) / 2);
        tTreble = 0.38 * ((Math.sin(t * 0.0023 + 0.7) + 1) / 2);
        setMode("fallback");
      } else {
        setMode("idle");
      }

      const tEnergy = tBass * 0.5 + tMid * 0.3 + tTreble * 0.2;

      // ── Beat detection ──────────────────────────────────────
      const bassForBeat = hasData ? rawBass : tBass;
      const delta = bassForBeat - prevRawBass;
      prevRawBass = bassForBeat;
      // Sharp upward bass transient → flash
      if (active && delta > 0.10) {
        sBeat = Math.min(1, sBeat + delta * 4.5);
      }

      // ── Disco hue drift ──────────────────────────────────────
      // Spins faster with energy, slower at idle
      sHue = (sHue + (active ? 0.55 + tEnergy * 1.8 : 0.08)) % 360;

      // ── Smooth all values ────────────────────────────────────
      // Fast attack (snappy to music), slow decay (elegant fade)
      sBass   = lerp(sBass,   tBass,   0.30, 0.055);
      sMid    = lerp(sMid,    tMid,    0.26, 0.05);
      sTreble = lerp(sTreble, tTreble, 0.32, 0.06);
      sEnergy = lerp(sEnergy, tEnergy, 0.22, 0.04);
      sBeat   = lerp(sBeat,   0,       0.18, 0.18);  // decays toward 0

      setBass(clamp(sBass));
      setMid(clamp(sMid));
      setTreble(clamp(sTreble));
      setEnergy(clamp(sEnergy));
      setBeat(clamp(sBeat));
      setHue(sHue);

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    onCleanup(() => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeydown);
    });
  });

  const b  = () => bass();
  const m  = () => mid();
  const h  = () => treble();
  const e  = () => energy();
  const bt = () => beat();
  const hu = () => hue();

  return (
    <div
      aria-hidden="true"
      style={{ position: "fixed", inset: "0", "z-index": "0", overflow: "hidden", "pointer-events": "none" }}
    >
      {/* Blob 1 — Bass — bottom-left — violet, hue drifts with bass */}
      <div
        class="bg-blob bg-blob-1"
        style={{
          opacity: 0.08 + b() * 0.72,
          transform: `scale(${0.55 + b() * 0.9})`,
          filter: `blur(${68 - b() * 28}px) hue-rotate(${hu() * 0.7}deg)`,
        }}
      />

      {/* Blob 2 — Treble — top-right — rose, counter-rotates for contrast */}
      <div
        class="bg-blob bg-blob-2"
        style={{
          opacity: 0.07 + h() * 0.65,
          transform: `scale(${0.5 + h() * 0.85}) translate(${h() * 40}px, ${h() * -30}px)`,
          filter: `blur(${72 - h() * 32}px) hue-rotate(${-hu() * 1.1}deg)`,
        }}
      />

      {/* Blob 3 — Mid — center — indigo, orthogonal hue */}
      <div
        class="bg-blob bg-blob-3"
        style={{
          opacity: 0.06 + m() * 0.60,
          transform: `scale(${0.55 + m() * 0.82}) translate(${(m() - 0.5) * 80}px, ${(b() - 0.5) * 60}px)`,
          filter: `blur(${80 - m() * 30}px) hue-rotate(${hu() * 1.6 + 120}deg)`,
        }}
      />

      {/* Blob 4 — Beat flash — centre — white burst on transient */}
      <div
        class="bg-blob bg-blob-4"
        style={{
          opacity: bt() * 0.82,
          transform: `scale(${0.3 + bt() * 1.4})`,
          filter: `blur(${55 - bt() * 30}px) hue-rotate(${hu() * 2}deg)`,
        }}
      />

      {/* Blob 5 — Tiny treble spark — top-left */}
      <div
        class="bg-blob bg-blob-5"
        style={{
          opacity: h() * 0.95,
          transform: `scale(${0.2 + h() * 1.8}) translate(${h() * -30}px, ${h() * -20}px)`,
          filter: `blur(${18 - h() * 12}px) hue-rotate(${-hu() * 1.4}deg)`,
        }}
      />

      {/* Blob 6 — Small bass dot — bottom-right */}
      <div
        class="bg-blob bg-blob-6"
        style={{
          opacity: 0.05 + b() * 0.88,
          transform: `scale(${0.3 + b() * 1.5}) translate(${b() * 25}px, ${b() * 20}px)`,
          filter: `blur(${26 - b() * 16}px) hue-rotate(${hu() * 0.9 + 60}deg)`,
        }}
      />

      {/* Blob 7 — Medium mid sweep — top-center */}
      <div
        class="bg-blob bg-blob-7"
        style={{
          opacity: 0.04 + m() * 0.78,
          transform: `scale(${0.4 + m() * 1.1}) translate(${(m() - 0.5) * 60}px, ${m() * -20}px)`,
          filter: `blur(${42 - m() * 24}px) hue-rotate(${hu() * 1.3 + 180}deg)`,
        }}
      />

      {/* Blob 8 — Medium energy — right side */}
      <div
        class="bg-blob bg-blob-8"
        style={{
          opacity: 0.04 + e() * 0.72,
          transform: `scale(${0.4 + e() * 1.0}) translate(${e() * 30}px, ${(m() - 0.5) * 50}px)`,
          filter: `blur(${36 - e() * 20}px) hue-rotate(${-hu() * 0.8 + 240}deg)`,
        }}
      />

      {/* Blob 9 — Small beat spark — bottom-center (complements blob 4) */}
      <div
        class="bg-blob bg-blob-9"
        style={{
          opacity: bt() * 0.90,
          transform: `scale(${0.15 + bt() * 2.0})`,
          filter: `blur(${20 - bt() * 14}px) hue-rotate(${hu() * 2.5 + 90}deg)`,
        }}
      />

      {/* ── Debug HUD (Shift+D) ── */}
      {showDebug() && (
        <div
          style={{
            position: "fixed",
            right: "10px",
            top: "calc(var(--nav-h) + 10px)",
            "z-index": "9999",
            padding: "8px 10px",
            "border-radius": "8px",
            border: "1px solid rgba(124,58,237,0.5)",
            background: "rgba(0,0,0,0.82)",
            color: "#e5e7eb",
            "font-family": "ui-monospace, Menlo, monospace",
            "font-size": "11px",
            "line-height": "1.5",
            "white-space": "pre",
          }}
        >
          {`BG DEBUG\nmode    : ${mode()}\nplaying : ${player.isPlaying()}\nanalysed: ${player.reactiveAvailable()}\nenergy  : ${e().toFixed(3)}\nbass    : ${b().toFixed(3)}\nmid     : ${m().toFixed(3)}\ntreble  : ${h().toFixed(3)}\nbeat    : ${bt().toFixed(3)}\nhue     : ${hu().toFixed(1)}°\n\n[Shift+D] hide`}
        </div>
      )}
    </div>
  );
}
