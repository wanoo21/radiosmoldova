type Props = {
  isPlaying: boolean;
  isLoading: boolean;
  /** "sm" = player bar, "md" = station row, "lg" = station detail page */
  size?: "sm" | "md" | "lg";
};

const heights: Record<NonNullable<Props["size"]>, { max: number; idle: number }> = {
  sm: { max: 16, idle: 4 },
  md: { max: 20, idle: 4 },
  lg: { max: 40, idle: 6 },
};

const widths: Record<NonNullable<Props["size"]>, number> = {
  sm: 3,
  md: 3,
  lg: 5,
};

const gaps: Record<NonNullable<Props["size"]>, number> = {
  sm: 2,
  md: 2,
  lg: 4,
};

export default function EqualizerBars(props: Props) {
  const sz = () => props.size ?? "sm";
  const { max, idle } = heights[sz()];
  const w = widths[sz()];
  const g = gaps[sz()];
  const totalW = w * 4 + g * 3;
  const containerH = max + 2;

  const barClass = (n: 1 | 2 | 3 | 4) =>
    props.isLoading
      ? "animate-spin-slow"
      : props.isPlaying
        ? `eq-bar-${n}`
        : "";

  const barH = props.isPlaying || props.isLoading ? undefined : idle;

  return (
    <svg
      width={totalW}
      height={containerH}
      viewBox={`0 0 ${totalW} ${containerH}`}
      style={{ "vertical-align": "middle" }}
      aria-hidden="true"
    >
      {([1, 2, 3, 4] as const).map((n, i) => {
        const x = i * (w + g);
        const h = barH ?? max / 2;
        return (
          <rect
            x={x}
            y={containerH - h}
            width={w}
            height={h}
            rx={Math.floor(w / 2)}
            fill="var(--playing)"
            class={barClass(n)}
            style={{
              "transform-origin": `${x + w / 2}px ${containerH}px`,
              ...(barH !== undefined ? {} : {}),
            }}
          />
        );
      })}
    </svg>
  );
}
