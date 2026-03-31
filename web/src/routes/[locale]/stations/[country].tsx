import { A, useParams } from "@solidjs/router";
import { Meta, Title } from "@solidjs/meta";
import { createSignal, For } from "solid-js";
import { getDict, normalizeLocale, type CountryCode } from "~/lib/i18n";
import { usePlayer } from "~/lib/player";
import { getStationSlug, getStations } from "~/lib/stations";
import EqualizerBars from "~/components/EqualizerBars";
import { IconChevronLeft, IconPlay, IconPause, IconSearch } from "~/components/Icons";

const countryFlags: Record<string, string> = { md: "🇲🇩", ro: "🇷🇴", ua: "🇺🇦" };

export default function CountryStationsPage() {
  const params = useParams();
  const locale = () => normalizeLocale(params.locale);
  const dict = () => getDict(locale());
  const country = () => (params.country as CountryCode) || "md";
  const allStations = () => getStations(country());
  const player = usePlayer();

  const [query, setQuery] = createSignal("");
  const filtered = () => {
    const q = query().trim().toLowerCase();
    return q ? allStations().filter((s) => s.name.toLowerCase().includes(q)) : allStations();
  };

  return (
    <main
      style={{ "max-width": "860px", margin: "0 auto", padding: "1.25rem 1rem" }}
      class="animate-fade-in"
    >
      <Title>{dict().countriesLabel[country()]} — {dict().seo.countryTitle}</Title>
      <Meta name="description" content={dict().seo.countryDescription} />

      {/* Back + header row */}
      <div style={{ display: "flex", "align-items": "center", gap: "14px", "margin-bottom": "1.25rem" }}>
        <A
          href={`/${locale()}`}
          style={{
            display: "flex",
            "align-items": "center",
            "justify-content": "center",
            width: "32px",
            height: "32px",
            "border-radius": "8px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text-2)",
            "text-decoration": "none",
            "flex-shrink": 0,
            transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--surface-hover)";
            (e.currentTarget as HTMLElement).style.color = "var(--text-1)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--surface)";
            (e.currentTarget as HTMLElement).style.color = "var(--text-2)";
          }}
        >
          <IconChevronLeft size={15} />
        </A>
        <span style={{ "font-size": "1.75rem", "line-height": 1 }}>{countryFlags[country()]}</span>
        <div style={{ flex: 1 }}>
          <h1 style={{ "font-size": "1.1rem", "font-weight": 700, color: "var(--text-1)", "letter-spacing": "-0.01em" }}>
            {dict().countriesLabel[country()]}
          </h1>
          <p style={{ "font-size": "12px", color: "var(--text-3)" }}>
            {allStations().length} {dict().stations.toLowerCase()}
          </p>
        </div>

        {/* Search */}
        <div style={{ position: "relative", width: "min(100%, 260px)" }}>
          <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", display: "flex", "pointer-events": "none" }}>
            <IconSearch size={14} />
          </span>
          <input
            type="search"
            placeholder="Search..."
            value={query()}
            onInput={(e) => setQuery(e.currentTarget.value)}
            style={{
              width: "100%",
              padding: "7px 10px 7px 32px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              "border-radius": "8px",
              color: "var(--text-1)",
              "font-size": "13px",
              "font-family": "inherit",
              outline: "none",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--accent)")}
            onBlur={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "var(--border)")}
          />
        </div>
      </div>

      {/* Station table */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          "border-radius": "12px",
          overflow: "hidden",
        }}
      >
        <For each={filtered()}>
          {(station, index) => {
            const isActive = () => player.currentStation()?.url === station.url;
            const isThisPlaying = () => isActive() && player.isPlaying();
            const isThisLoading = () => isActive() && player.isLoading();
            const isLast = () => index() === filtered().length - 1;

            return (
              <div
                style={{
                  display: "flex",
                  "align-items": "center",
                  gap: "10px",
                  padding: "0 12px",
                  height: "52px",
                  "border-bottom": isLast() ? "none" : "1px solid var(--border)",
                  background: isActive() ? "rgba(124,58,237,0.10)" : "transparent",
                  "border-left": isActive() ? "3px solid var(--accent)" : "3px solid transparent",
                  transition: "background 0.15s",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  if (!isActive()) (e.currentTarget as HTMLElement).style.background = "var(--surface-hover)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive()) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                {/* Index or equalizer */}
                <div
                  style={{
                    width: "28px",
                    "flex-shrink": 0,
                    display: "flex",
                    "align-items": "center",
                    "justify-content": "center",
                  }}
                >
                  {isActive() ? (
                    <EqualizerBars isPlaying={isThisPlaying()} isLoading={isThisLoading()} size="sm" />
                  ) : (
                    <span style={{ "font-size": "12px", color: "var(--text-3)", "font-variant-numeric": "tabular-nums" }}>
                      {index() + 1}
                    </span>
                  )}
                </div>

                {/* Station name */}
                <div style={{ "min-width": 0, flex: 1 }}>
                  <p
                    style={{
                      "font-size": "13.5px",
                      "font-weight": isActive() ? 600 : 400,
                      color: isActive() ? "var(--text-1)" : "var(--text-1)",
                      overflow: "hidden",
                      "text-overflow": "ellipsis",
                      "white-space": "nowrap",
                    }}
                  >
                    {station.name}
                  </p>
                </div>

                {/* Open station link */}
                <A
                  href={`/${locale()}/station/${getStationSlug(station)}`}
                  style={{
                    "font-size": "11px",
                    color: "var(--text-3)",
                    "text-decoration": "none",
                    "flex-shrink": 0,
                    padding: "3px 7px",
                    "border-radius": "5px",
                    border: "1px solid var(--border)",
                    transition: "color 0.15s, border-color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--accent)";
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--text-3)";
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                  }}
                >
                  {dict().openStation}
                </A>

                {/* Play / pause button */}
                <button
                  type="button"
                  onClick={() => {
                    if (isActive()) void player.togglePlayback();
                    else void player.playStation(station);
                  }}
                  title={isThisPlaying() ? dict().pause : dict().play}
                  style={{
                    display: "flex",
                    "align-items": "center",
                    "justify-content": "center",
                    width: "30px",
                    height: "30px",
                    "border-radius": "50%",
                    border: "none",
                    cursor: "pointer",
                    "flex-shrink": 0,
                    background: isActive() ? "var(--accent)" : "transparent",
                    color: isActive() ? "#fff" : "var(--text-2)",
                    transition: "background 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive()) {
                      (e.currentTarget as HTMLElement).style.background = "var(--surface-hover)";
                      (e.currentTarget as HTMLElement).style.color = "var(--text-1)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive()) {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "var(--text-2)";
                    }
                  }}
                >
                  {isThisPlaying() ? <IconPause size={12} /> : <IconPlay size={12} />}
                </button>
              </div>
            );
          }}
        </For>

        {filtered().length === 0 && (
          <p style={{ "text-align": "center", color: "var(--text-3)", padding: "2.5rem", "font-size": "13px" }}>
            No stations found for "{query()}"
          </p>
        )}
      </div>
    </main>
  );
}
