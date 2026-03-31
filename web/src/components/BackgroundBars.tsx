import { onCleanup, onMount } from "solid-js";
import { usePlayer } from "~/lib/player";

const BAR_COUNT = 80; // per half; total = 160 mirrored bars

/** Gaussian weight — how much bar at position t responds to a band centred at `center`. */
const gauss = (t: number, center: number, width: number) =>
  Math.exp(-0.5 * ((t - center) / width) ** 2);

function buildHalf(
  bass: number,
  mid: number,
  treble: number,
  beat: number,
  time: number,
): Float32Array {
  const out = new Float32Array(BAR_COUNT);
  for (let i = 0; i < BAR_COUNT; i++) {
    const t = i / (BAR_COUNT - 1);
    const base =
      gauss(t, 0.10, 0.18) * bass +
      gauss(t, 0.45, 0.22) * mid +
      gauss(t, 0.82, 0.16) * treble;
    // Per-bar flicker to feel "noisy" but still stay in place (no lateral motion).
    const flicker =
      (Math.sin(time * 0.011 + i * 0.83) * 0.5 + 0.5) * 0.18 +
      (Math.sin(time * 0.019 + i * 2.17) * 0.5 + 0.5) * 0.12;
    const v = Math.max(0, Math.min(1, base + flicker * (0.2 + base * 1.2)));
    out[i] = v * (1 + beat * 0.55);
  }
  return out;
}

export default function BackgroundBars() {
  const player = usePlayer();
  let canvas!: HTMLCanvasElement;
  let smooth = new Float32Array(BAR_COUNT);
  let hue = 0;
  let sBeat = 0;
  let prevBass = 0;

  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  const amp = (v: number) => clamp(Math.max(0, v - 0.02) * 3.6);

  onMount(() => {
    const ctx = canvas.getContext("2d")!;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const tick = (t: number) => {
      const W = canvas.width;
      const H = canvas.height;
      const active = player.isPlaying() || player.isLoading();
      const rawBass = player.reactiveBass();
      const rawMid = player.reactiveMid();
      const rawTreble = player.reactiveTreble();
      const gBass = amp(rawBass);
      const gMid = amp(rawMid);
      const gTreble = amp(rawTreble);
      const hasData =
        player.reactiveAvailable() && gBass + gMid + gTreble > 0.01;

      let tBass = 0;
      let tMid = 0;
      let tTreble = 0;
      if (active && hasData) {
        tBass = gBass;
        tMid = gMid;
        tTreble = gTreble;
      } else if (active) {
        // Fallback for streams that cannot expose analyser data (e.g. CORS restrictions).
        tBass = 0.5 * ((Math.sin(t * 0.0011) + 1) / 2);
        tMid = 0.44 * ((Math.sin(t * 0.0016 + 1.4) + 1) / 2);
        tTreble = 0.38 * ((Math.sin(t * 0.0023 + 0.7) + 1) / 2);
      }

      // Beat
      const bassForBeat = hasData ? rawBass : tBass;
      const delta = bassForBeat - prevBass;
      prevBass = bassForBeat;
      if (active && delta > 0.07) sBeat = Math.min(1, sBeat + delta * 5);
      sBeat *= 0.82;

      const target = buildHalf(tBass, tMid, tTreble, sBeat, t);
      const energy = tBass * 0.5 + tMid * 0.3 + tTreble * 0.2;

      // Smooth — fast attack, slow decay
      for (let i = 0; i < BAR_COUNT; i++) {
        const sp = target[i] > smooth[i] ? 0.28 : 0.06;
        smooth[i] += (target[i] - smooth[i]) * sp;
      }

      hue = (hue + (active ? 0.45 + energy * 1.8 : 0.06)) % 360;

      ctx.clearRect(0, 0, W, H);

      const maxH = H * 0.70;
      const halfW = W / 2;
      const barW = halfW / BAR_COUNT;
      const gap = Math.max(1, barW * 0.18);

      for (let i = 0; i < BAR_COUNT; i++) {
        const h = smooth[i] * maxH;
        if (h < 0.5) continue;

        const barHue = (hue + (i / BAR_COUNT) * 90) % 360;

        // Right half (normal)
        const xR = halfW + i * barW;
        // Left half (mirror)
        const xL = halfW - (i + 1) * barW;

        if (!reduced) {
          ctx.shadowColor = `hsla(${barHue}, 90%, 65%, 0.65)`;
          ctx.shadowBlur = 10 + smooth[i] * 14;
        }

        const grad = ctx.createLinearGradient(0, H - h, 0, H);
        grad.addColorStop(0, `hsla(${barHue}, 90%, 75%, 0.95)`);
        grad.addColorStop(0.45, `hsla(${(barHue + 25) % 360}, 80%, 55%, 0.75)`);
        grad.addColorStop(1, `hsla(${(barHue + 50) % 360}, 65%, 30%, 0.25)`);

        ctx.fillStyle = grad;

        const radius = Math.min(3, (barW - gap) / 2);
        for (const x of [xR, xL]) {
          ctx.beginPath();
          ctx.roundRect(x + gap / 2, H - h, barW - gap, h, [radius, radius, 0, 0]);
          ctx.fill();
        }
      }

      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    onCleanup(() => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    });
  });

  return (
    <canvas
      ref={canvas}
      aria-hidden="true"
      style={{ position: "fixed", inset: "0", "z-index": "0", "pointer-events": "none" }}
    />
  );
}
