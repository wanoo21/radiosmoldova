import { A, useLocation } from "@solidjs/router";
import { normalizeLocale } from "~/lib/i18n";
import { usePlayer } from "~/lib/player";
import { getStationSlug } from "~/lib/stations";
import EqualizerBars from "~/components/EqualizerBars";
import { IconPlay, IconPause, IconLoader, IconVolume, IconVolumeMuted } from "~/components/Icons";

export default function PersistentPlayer() {
  const player = usePlayer();
  const location = useLocation();
  const locale = () => normalizeLocale(location.pathname.split("/")[1]);
  const isMuted = () => player.volume() === 0;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "var(--player-h)",
        "z-index": 50,
        background: "var(--player-bg)",
        "backdrop-filter": "blur(24px)",
        "-webkit-backdrop-filter": "blur(24px)",
        "border-top": "1px solid var(--border)",
      }}
    >
      {/* Thin accent line when playing */}
      {player.isPlaying() && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: "linear-gradient(90deg, var(--accent), var(--playing))",
          }}
        />
      )}

      <div
        style={{
          "max-width": "1024px",
          margin: "0 auto",
          height: "100%",
          display: "flex",
          "align-items": "center",
          gap: "12px",
          padding: "0 1rem",
        }}
      >
        {/* Equalizer / idle indicator */}
        <div
          style={{
            width: "24px",
            display: "flex",
            "align-items": "center",
            "justify-content": "center",
            "flex-shrink": 0,
          }}
        >
          {player.currentStation() ? (
            <EqualizerBars
              isPlaying={player.isPlaying()}
              isLoading={player.isLoading()}
              size="sm"
            />
          ) : (
            <span
              style={{
                width: "8px",
                height: "8px",
                "border-radius": "50%",
                background: "var(--border-strong)",
                display: "block",
              }}
            />
          )}
        </div>

        {/* Station info */}
        <div style={{ "min-width": 0, flex: 1 }}>
          {player.currentStation() ? (
            <>
              <div style={{ display: "flex", "align-items": "center", gap: "7px" }}>
                {player.isPlaying() && (
                  <span
                    style={{
                      display: "inline-flex",
                      "align-items": "center",
                      gap: "4px",
                      padding: "1px 7px",
                      background: "rgba(34,197,94,0.12)",
                      border: "1px solid rgba(34,197,94,0.25)",
                      "border-radius": "999px",
                      "font-size": "9px",
                      "font-weight": 700,
                      color: "var(--playing)",
                      "text-transform": "uppercase",
                      "letter-spacing": "0.08em",
                      "flex-shrink": 0,
                    }}
                  >
                    <span
                      class="animate-live"
                      style={{
                        width: "5px",
                        height: "5px",
                        "border-radius": "50%",
                        background: "var(--playing)",
                        display: "inline-block",
                      }}
                    />
                    Live
                  </span>
                )}
                <p
                  style={{
                    "font-size": "14px",
                    "font-weight": 600,
                    color: "var(--text-1)",
                    overflow: "hidden",
                    "text-overflow": "ellipsis",
                    "white-space": "nowrap",
                  }}
                >
                  <A
                    href={`/${locale()}/station/${getStationSlug(player.currentStation()!)}`}
                    style={{ color: "inherit", "text-decoration": "none" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--accent)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "inherit")}
                  >
                    {player.currentStation()!.name}
                  </A>
                </p>
              </div>
              {player.error() && (
                <p style={{ "font-size": "11px", color: "var(--error)", "margin-top": "1px" }}>
                  {player.error()}
                </p>
              )}
            </>
          ) : (
            <p style={{ "font-size": "13px", color: "var(--text-3)" }}>
              Select a station to start listening
            </p>
          )}
        </div>

        {/* Volume */}
        <div
          style={{
            display: "flex",
            "align-items": "center",
            gap: "7px",
            "flex-shrink": 0,
          }}
        >
          <button
            type="button"
            onClick={() => player.setVolume(isMuted() ? 0.5 : 0)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-3)",
              display: "flex",
              "align-items": "center",
              padding: "4px",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-1)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-3)")}
          >
            {isMuted() ? <IconVolumeMuted size={16} /> : <IconVolume size={16} />}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            style={{ width: "72px" }}
            value={Math.round(player.volume() * 100)}
            onInput={(e) => player.setVolume(Number(e.currentTarget.value) / 100)}
          />
        </div>

        {/* Play / Pause */}
        <button
          type="button"
          disabled={!player.currentStation()}
          onClick={() => void player.togglePlayback()}
          style={{
            display: "flex",
            "align-items": "center",
            "justify-content": "center",
            width: "42px",
            height: "42px",
            "border-radius": "50%",
            border: "none",
            cursor: player.currentStation() ? "pointer" : "not-allowed",
            background: player.currentStation() ? "var(--accent)" : "var(--surface)",
            color: "#fff",
            "flex-shrink": 0,
            opacity: player.currentStation() ? 1 : 0.4,
            transition: "background 0.15s, transform 0.1s",
          }}
          onMouseEnter={(e) => {
            if (player.currentStation()) (e.currentTarget as HTMLElement).style.background = "var(--accent-hover)";
          }}
          onMouseLeave={(e) => {
            if (player.currentStation()) (e.currentTarget as HTMLElement).style.background = "var(--accent)";
          }}
        >
          {player.isLoading() ? (
            <IconLoader size={18} />
          ) : player.isPlaying() ? (
            <IconPause size={18} />
          ) : (
            <IconPlay size={18} />
          )}
        </button>
      </div>
    </div>
  );
}
