import { A, useParams } from "@solidjs/router";
import { Meta, Title } from "@solidjs/meta";
import { getDict, normalizeLocale } from "~/lib/i18n";
import { usePlayer } from "~/lib/player";
import { getStationBySlug, getStationSlug, getStations } from "~/lib/stations";
import EqualizerBars from "~/components/EqualizerBars";
import { IconChevronLeft, IconPlay, IconPause, IconLoader, IconChevronRight } from "~/components/Icons";
import { For } from "solid-js";

const SITE_URL = "https://radiomru.com";
const countryFlags: Record<string, string> = { md: "🇲🇩", ro: "🇷🇴", ua: "🇺🇦" };
const countryNames: Record<string, string> = { md: "Moldova", ro: "Romania", ua: "Ukraine" };

/** Deterministic accent colour per station — gives each station its own identity */
function stationHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return hash % 360;
}

export default function StationPage() {
  const params = useParams();
  const locale = () => normalizeLocale(params.locale);
  const dict = () => getDict(locale());
  const player = usePlayer();
  const match = () => getStationBySlug(params.slug);
  const station = () => match()?.station;
  const country = () => match()?.country ?? "md";
  const canonical = () => `${SITE_URL}/${locale()}/station/${params.slug}`;

  const isActive = () => player.currentStation()?.url === station()?.url;
  const isPlaying = () => isActive() && player.isPlaying();
  const isLoading = () => isActive() && player.isLoading();

  const handlePlay = () => {
    if (!station()) return;
    if (isActive()) void player.togglePlayback();
    else void player.playStation(station()!);
  };

  // Nearby stations from same country (excluding current)
  const nearby = () =>
    getStations(country() as any)
      .filter((s) => s.url !== station()?.url)
      .slice(0, 20);

  const hue = () => stationHue(station()?.name ?? "");

  return (
    <main
      style={{ "max-width": "680px", margin: "0 auto", padding: "1.25rem 1rem" }}
      class="animate-fade-in"
    >
      <Title>{station() ? `${station()!.name} — ${dict().seo.stationTitle}` : dict().seo.stationTitle}</Title>
      <Meta name="description" content={dict().seo.stationDescription} />
      <link rel="canonical" href={canonical()} />
      <link rel="alternate" hreflang="en" href={`${SITE_URL}/en/station/${params.slug}`} />
      <link rel="alternate" hreflang="ro" href={`${SITE_URL}/ro/station/${params.slug}`} />
      <link rel="alternate" hreflang="uk" href={`${SITE_URL}/uk/station/${params.slug}`} />

      {/* Back */}
      <A
        href={`/${locale()}/stations/${country()}`}
        style={{
          display: "inline-flex",
          "align-items": "center",
          gap: "4px",
          "font-size": "13px",
          color: "var(--text-2)",
          "text-decoration": "none",
          "margin-bottom": "1.5rem",
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-1)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-2)")}
      >
        <IconChevronLeft size={14} />
        {countryFlags[country()]} {countryNames[country()]}
      </A>

      {station() ? (
        <>
          {/* ── Hero card ── */}
          <div
            style={{
              "border-radius": "20px",
              border: "1px solid var(--border)",
              overflow: "hidden",
              "margin-bottom": "1rem",
            }}
          >
            {/* Coloured header strip — unique per station */}
            <div
              style={{
                height: "120px",
                background: `linear-gradient(135deg,
                  hsl(${hue()}, 72%, 28%) 0%,
                  hsl(${(hue() + 40) % 360}, 68%, 22%) 50%,
                  hsl(${(hue() + 80) % 360}, 60%, 16%) 100%)`,
                display: "flex",
                "align-items": "flex-end",
                padding: "0 1.25rem 0.85rem",
                position: "relative",
              }}
            >
              {/* Large initials avatar */}
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  "border-radius": "14px",
                  background: `hsl(${hue()}, 80%, 60%)`,
                  display: "flex",
                  "align-items": "center",
                  "justify-content": "center",
                  "font-size": "1.5rem",
                  "font-weight": 800,
                  color: "#fff",
                  "letter-spacing": "-0.02em",
                  "flex-shrink": 0,
                  "box-shadow": `0 4px 20px hsl(${hue()}, 60%, 20%)`,
                }}
              >
                {station()!.name.slice(0, 2).toUpperCase()}
              </div>

              {/* Playing wave on the right */}
              {isPlaying() && (
                <div style={{ position: "absolute", right: "1.25rem", bottom: "1rem", opacity: 0.6 }}>
                  <EqualizerBars isPlaying={true} isLoading={false} size="lg" />
                </div>
              )}
            </div>

            {/* Card body */}
            <div style={{ padding: "1rem 1.25rem 1.25rem", background: "var(--surface)" }}>
              <div style={{ display: "flex", "align-items": "flex-start", gap: "12px" }}>
                <div style={{ flex: 1, "min-width": 0 }}>
                  <h1
                    style={{
                      "font-size": "1.35rem",
                      "font-weight": 700,
                      "letter-spacing": "-0.02em",
                      color: "var(--text-1)",
                      "margin-bottom": "4px",
                      "line-height": 1.2,
                    }}
                  >
                    {station()!.name}
                  </h1>
                  <span
                    style={{
                      display: "inline-flex",
                      "align-items": "center",
                      gap: "4px",
                      "font-size": "12px",
                      color: "var(--text-2)",
                    }}
                  >
                    {countryFlags[country()]} {countryNames[country()]}
                  </span>
                </div>

                {/* Play button */}
                <button
                  type="button"
                  onClick={handlePlay}
                  title={isPlaying() ? dict().pause : dict().play}
                  style={{
                    display: "flex",
                    "align-items": "center",
                    "justify-content": "center",
                    width: "52px",
                    height: "52px",
                    "border-radius": "50%",
                    border: "none",
                    cursor: "pointer",
                    "flex-shrink": 0,
                    background: `hsl(${hue()}, 72%, 52%)`,
                    color: "#fff",
                    "box-shadow": isPlaying() ? `0 0 0 8px hsl(${hue()}, 72%, 52%, 0.25)` : "none",
                    transition: "box-shadow 0.35s, transform 0.15s",
                  }}
                  class={isPlaying() ? "glow-accent" : ""}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.transform = "scale(1.07)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)")}
                >
                  {isLoading() ? <IconLoader size={22} /> : isPlaying() ? <IconPause size={22} /> : <IconPlay size={22} />}
                </button>
              </div>

              {/* Status bar */}
              <div style={{ "margin-top": "0.85rem", "min-height": "22px", display: "flex", "align-items": "center", gap: "8px" }}>
                {isPlaying() && (
                  <>
                    <span
                      style={{
                        display: "inline-flex",
                        "align-items": "center",
                        gap: "5px",
                        padding: "2px 9px",
                        background: "rgba(34,197,94,0.12)",
                        border: "1px solid rgba(34,197,94,0.28)",
                        "border-radius": "999px",
                        "font-size": "10px",
                        "font-weight": 700,
                        color: "var(--playing)",
                        "text-transform": "uppercase",
                        "letter-spacing": "0.08em",
                      }}
                    >
                      <span class="animate-live" style={{ width: "5px", height: "5px", "border-radius": "50%", background: "var(--playing)", display: "inline-block" }} />
                      Live
                    </span>
                    <span style={{ "font-size": "12px", color: "var(--text-3)" }}>Streaming now</span>
                  </>
                )}
                {isLoading() && <span style={{ "font-size": "12px", color: "var(--text-2)" }}>Connecting…</span>}
                {!isPlaying() && !isLoading() && isActive() && player.error() && (
                  <span style={{ "font-size": "12px", color: "var(--error)" }}>{player.error()}</span>
                )}
                {!isPlaying() && !isLoading() && !player.error() && (
                  <span style={{ "font-size": "12px", color: "var(--text-3)" }}>Press play to start streaming</span>
                )}
              </div>
            </div>
          </div>

          {/* ── Up next / same country ── */}
          {nearby().length > 0 && (
            <section>
              <p style={{ "font-size": "11px", "font-weight": 600, "text-transform": "uppercase", "letter-spacing": "0.07em", color: "var(--text-3)", "margin-bottom": "8px" }}>
                More from {countryNames[country()]}
              </p>
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  "border-radius": "12px",
                  overflow: "hidden",
                }}
              >
                <For each={nearby()}>
                  {(s, i) => {
                    const nearbyActive = () => player.currentStation()?.url === s.url;
                    const nearbyPlaying = () => nearbyActive() && player.isPlaying();
                    const isLast = () => i() === nearby().length - 1;
                    const h2 = stationHue(s.name);

                    return (
                      <A
                        href={`/${locale()}/station/${getStationSlug(s)}`}
                        style={{
                          display: "flex",
                          "align-items": "center",
                          gap: "10px",
                          padding: "8px 12px",
                          "border-bottom": isLast() ? "none" : "1px solid var(--border)",
                          background: nearbyActive() ? "rgba(124,58,237,0.08)" : "transparent",
                          transition: "background 0.15s",
                          "text-decoration": "none",
                        }}
                        onMouseEnter={(e) => {
                          if (!nearbyActive()) (e.currentTarget as HTMLElement).style.background = "var(--surface-hover)";
                        }}
                        onMouseLeave={(e) => {
                          if (!nearbyActive()) (e.currentTarget as HTMLElement).style.background = "transparent";
                        }}
                      >
                        {/* Mini avatar */}
                        <div
                          style={{
                            width: "34px",
                            height: "34px",
                            "border-radius": "8px",
                            background: `hsl(${h2}, 72%, 52%)`,
                            display: "flex",
                            "align-items": "center",
                            "justify-content": "center",
                            "font-size": "10px",
                            "font-weight": 800,
                            color: "#fff",
                            "flex-shrink": 0,
                          }}
                        >
                          {s.name.slice(0, 2).toUpperCase()}
                        </div>

                        <span
                          style={{
                            flex: 1,
                            "font-size": "13px",
                            "font-weight": nearbyActive() ? 600 : 400,
                            color: "var(--text-1)",
                            overflow: "hidden",
                            "text-overflow": "ellipsis",
                            "white-space": "nowrap",
                          }}
                        >
                          {s.name}
                        </span>

                        {nearbyPlaying() ? (
                          <EqualizerBars isPlaying={true} isLoading={false} size="sm" />
                        ) : (
                          <IconChevronRight size={14} class="" style={{ color: "var(--text-3)", "flex-shrink": 0 }} />
                        )}
                      </A>
                    );
                  }}
                </For>
              </div>
            </section>
          )}
        </>
      ) : (
        <div style={{ "text-align": "center", padding: "4rem 0" }}>
          <p style={{ color: "var(--text-2)", "margin-bottom": "1rem" }}>{dict().stationNotFound}</p>
          <A href={`/${locale()}`} style={{ "font-size": "14px", color: "var(--accent)", "text-decoration": "none" }}>
            {dict().backHome}
          </A>
        </div>
      )}
    </main>
  );
}
