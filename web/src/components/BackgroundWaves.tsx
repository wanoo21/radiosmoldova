import { onCleanup, onMount } from "solid-js";
import { usePlayer } from "~/lib/player";

interface WaveDef {
  freq: number;
  speed: number;
  hueOffset: number;
  bandIdx: number; // 0=bass, 1=mid, 2=treble, 3=energy
  minAmp: number;
  maxAmp: number;
  baseOpacity: number;
  yFrac: number; // base vertical position as fraction of H
}

const WAVES: WaveDef[] = [
  { freq: 2.2,  speed: 0.007, hueOffset: 0,   bandIdx: 0, minAmp: 0.05, maxAmp: 0.28, baseOpacity: 0.50, yFrac: 0.72 },
  { freq: 3.8,  speed: 0.011, hueOffset: 55,  bandIdx: 1, minAmp: 0.04, maxAmp: 0.22, baseOpacity: 0.42, yFrac: 0.62 },
  { freq: 5.5,  speed: 0.017, hueOffset: 125, bandIdx: 2, minAmp: 0.03, maxAmp: 0.16, baseOpacity: 0.34, yFrac: 0.52 },
  { freq: 1.4,  speed: 0.004, hueOffset: 210, bandIdx: 3, minAmp: 0.06, maxAmp: 0.10, baseOpacity: 0.24, yFrac: 0.80 },
];

export default function BackgroundWaves() {
  const player = usePlayer();
  let canvas!: HTMLCanvasElement;

  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  const amp = (v: number) => clamp(Math.max(0, v - 0.02) * 3.6);

  onMount(() => {
    const ctx = canvas.getContext("2d")!;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let hue = 0;
    let sBass = 0, sMid = 0, sTreble = 0, sEnergy = 0;
    const NOISE_STEPS = 600;
    const noiseSeeds = WAVES.map(() => {
      const arr = new Float32Array(NOISE_STEPS + 1);
      for (let i = 0; i <= NOISE_STEPS; i++) {
        arr[i] = Math.random();
      }
      return arr;
    });

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
      const tEnergy = tBass * 0.5 + tMid * 0.3 + tTreble * 0.2;

      const spd = active ? 0.10 : 0.03;
      sBass += (tBass - sBass) * spd;
      sMid += (tMid - sMid) * spd;
      sTreble += (tTreble - sTreble) * spd;
      sEnergy += (tEnergy - sEnergy) * spd;

      hue = (hue + (active ? 0.35 + tEnergy * 1.4 : 0.05)) % 360;

      const bands = [sBass, sMid, sTreble, sEnergy];

      ctx.clearRect(0, 0, W, H);

      // Draw back-to-front
      for (let wi = WAVES.length - 1; wi >= 0; wi--) {
        const wave = WAVES[wi];
        const band = bands[wave.bandIdx];
        const amplitude = (wave.minAmp + band * wave.maxAmp) * H;
        const baseY = wave.yFrac * H;

        const wHue = (hue + wave.hueOffset) % 360;

        // Draw wave fill path (wave top + rect bottom)
        ctx.beginPath();
        const steps = Math.min(W, NOISE_STEPS); // performance cap
        for (let xi = 0; xi <= steps; xi++) {
          const x = (xi / steps) * W;
          const nx = xi / steps;
          // Static shape by X + local in-place jitter (no horizontal scrolling).
          const shape = Math.sin(nx * Math.PI * 2 * wave.freq);
          const seed = noiseSeeds[wi][xi];
          const jitter =
            !reduced
              ? Math.sin(t * (wave.speed * 1200 + seed * 7) + seed * Math.PI * 2) *
                (0.06 + band * 0.22)
              : 0;
          const y = baseY + (shape + jitter) * amplitude;
          if (xi === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, baseY - amplitude, 0, H);
        grad.addColorStop(0, `hsla(${wHue}, 80%, 65%, ${wave.baseOpacity + band * 0.25})`);
        grad.addColorStop(0.35, `hsla(${(wHue + 30) % 360}, 70%, 48%, ${wave.baseOpacity * 0.55})`);
        grad.addColorStop(1, `hsla(${(wHue + 60) % 360}, 55%, 30%, 0)`);

        ctx.fillStyle = grad;

        if (!reduced) {
          ctx.shadowColor = `hsla(${wHue}, 85%, 65%, 0.35)`;
          ctx.shadowBlur = 18 + band * 14;
        }

        ctx.fill();
        ctx.shadowBlur = 0;

        // Bright line along wave crest
        ctx.beginPath();
        for (let xi = 0; xi <= steps; xi++) {
          const x = (xi / steps) * W;
          const nx = xi / steps;
          const shape = Math.sin(nx * Math.PI * 2 * wave.freq);
          const seed = noiseSeeds[wi][xi];
          const jitter =
            !reduced
              ? Math.sin(t * (wave.speed * 1200 + seed * 7) + seed * Math.PI * 2) *
                (0.06 + band * 0.22)
              : 0;
          const y = baseY + (shape + jitter) * amplitude;
          if (xi === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `hsla(${wHue}, 90%, 80%, ${0.4 + band * 0.45})`;
        ctx.lineWidth = 1.5 + band * 2;
        if (!reduced) {
          ctx.shadowColor = `hsla(${wHue}, 90%, 70%, 0.6)`;
          ctx.shadowBlur = 8 + band * 10;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

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
