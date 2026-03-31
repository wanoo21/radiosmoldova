import { A, useParams } from "@solidjs/router";
import { Meta, Title } from "@solidjs/meta";
import { getCountries, getStations } from "~/lib/stations";
import { getDict, normalizeLocale } from "~/lib/i18n";
import { usePlayer } from "~/lib/player";
import EqualizerBars from "~/components/EqualizerBars";
import { IconChevronRight } from "~/components/Icons";

const countryFlags: Record<string, string> = { md: "🇲🇩", ro: "🇷🇴", ua: "🇺🇦" };

export default function LocaleHome() {
  const params = useParams();
  const locale = () => normalizeLocale(params.locale);
  const dict = () => getDict(locale());
  const player = usePlayer();

  return (
    <main
      style={{ "max-width": "800px", margin: "0 auto", padding: "2rem 1rem" }}
      class="animate-fade-in"
    >
      <Title>{dict().seo.homeTitle}</Title>
      <Meta name="description" content={dict().seo.homeDescription} />

      {/* Now playing strip */}
      {player.currentStation() && (
        <div
          style={{
            display: "flex",
            "align-items": "center",
            gap: "10px",
            padding: "10px 14px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            "border-left": "3px solid var(--playing)",
            "border-radius": "10px",
            "margin-bottom": "2rem",
          }}
        >
          <EqualizerBars isPlaying={player.isPlaying()} isLoading={player.isLoading()} size="sm" />
          <div style={{ "min-width": 0, flex: 1 }}>
            <p style={{ "font-size": "11px", "font-weight": 600, color: "var(--playing)", "text-transform": "uppercase", "letter-spacing": "0.06em" }}>
              Now playing
            </p>
            <p style={{ "font-size": "14px", "font-weight": 600, color: "var(--text-1)", overflow: "hidden", "text-overflow": "ellipsis", "white-space": "nowrap" }}>
              {player.currentStation()!.name}
            </p>
          </div>
        </div>
      )}

      <h1
        style={{
          "font-size": "clamp(1.4rem, 4vw, 2rem)",
          "font-weight": 700,
          "letter-spacing": "-0.02em",
          color: "var(--text-1)",
          "margin-bottom": "0.4rem",
        }}
      >
        {dict().listenNow}
      </h1>
      <p style={{ color: "var(--text-2)", "font-size": "14px", "margin-bottom": "2rem" }}>
        {dict().seo.homeDescription}
      </p>

      <div
        style={{
          display: "grid",
          "grid-template-columns": "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
        }}
      >
        {getCountries().map((country) => (
          <A
            href={`/${locale()}/stations/${country}`}
            style={{
              display: "flex",
              "align-items": "center",
              gap: "14px",
              padding: "1.1rem 1rem",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              "border-radius": "14px",
              "text-decoration": "none",
              transition: "border-color 0.2s, background 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--surface-hover)";
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--surface)";
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
            }}
          >
            <span style={{ "font-size": "2.2rem", "line-height": 1, "flex-shrink": 0 }}>
              {countryFlags[country]}
            </span>
            <div style={{ "min-width": 0, flex: 1 }}>
              <p style={{ "font-weight": 600, "font-size": "15px", color: "var(--text-1)" }}>
                {dict().countriesLabel[country]}
              </p>
              <p style={{ "font-size": "12px", color: "var(--text-3)" }}>
                {getStations(country).length} {dict().stations.toLowerCase()}
              </p>
            </div>
            <IconChevronRight size={16} class="" style={{ color: "var(--text-3)", "flex-shrink": 0 }} />
          </A>
        ))}
      </div>
    </main>
  );
}
