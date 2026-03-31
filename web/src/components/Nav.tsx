import { A, useLocation } from "@solidjs/router";
import { SUPPORTED_LOCALES, normalizeLocale } from "~/lib/i18n";
import { IconRadio } from "~/components/Icons";
import { bgEffect, setBgEffect, type BgEffect } from "~/lib/bgEffect";

const BG_MODES: { id: BgEffect; label: string; icon: () => any }[] = [
  {
    id: "orbs",
    label: "Orbs",
    icon: () => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="5" cy="8" r="3.2" fill="currentColor" opacity="0.9" />
        <circle cx="11" cy="5.5" r="2.2" fill="currentColor" opacity="0.7" />
        <circle cx="11.5" cy="11" r="1.5" fill="currentColor" opacity="0.5" />
      </svg>
    ),
  },
  {
    id: "bars",
    label: "Bars",
    icon: () => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1"  y="8"  width="2" height="7" rx="1" fill="currentColor" opacity="0.5" />
        <rect x="4"  y="5"  width="2" height="10" rx="1" fill="currentColor" opacity="0.7" />
        <rect x="7"  y="2"  width="2" height="13" rx="1" fill="currentColor" />
        <rect x="10" y="5"  width="2" height="10" rx="1" fill="currentColor" opacity="0.7" />
        <rect x="13" y="8"  width="2" height="7" rx="1" fill="currentColor" opacity="0.5" />
      </svg>
    ),
  },
  {
    id: "waves",
    label: "Waves",
    icon: () => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M1 5 C3 3, 5 7, 7 5 C9 3, 11 7, 13 5 C14 4, 15 4.5, 15 5"
          stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.6"
        />
        <path
          d="M1 9 C3 7, 5 11, 7 9 C9 7, 11 11, 13 9 C14 8, 15 8.5, 15 9"
          stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.85"
        />
        <path
          d="M1 13 C3 11, 5 15, 7 13 C9 11, 11 15, 13 13 C14 12, 15 12.5, 15 13"
          stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.5"
        />
      </svg>
    ),
  },
];

export default function Nav() {
  const location = useLocation();
  const activeLocale = () => normalizeLocale(location.pathname.split("/")[1]);

  const localePath = (locale: string) => {
    const parts = location.pathname.split("/");
    parts[1] = locale;
    return parts.join("/") || "/";
  };

  const showLocales = () => location.pathname !== "/";

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        "z-index": 40,
        height: "var(--nav-h)",
        background: "var(--nav-bg)",
        "backdrop-filter": "blur(16px)",
        "-webkit-backdrop-filter": "blur(16px)",
        "border-bottom": "1px solid var(--border)",
      }}
    >
      <div
        style={{
          "max-width": "1024px",
          margin: "0 auto",
          height: "100%",
          display: "flex",
          "align-items": "center",
          "justify-content": "space-between",
          padding: "0 1rem",
        }}
      >
        {/* Logo */}
        <A
          href={showLocales() ? `/${activeLocale()}` : "/"}
          style={{
            display: "flex",
            "align-items": "center",
            gap: "8px",
            color: "var(--text-1)",
            "text-decoration": "none",
            "font-weight": 700,
            "font-size": "15px",
            "letter-spacing": "-0.01em",
          }}
        >
          <span
            style={{
              display: "flex",
              "align-items": "center",
              "justify-content": "center",
              width: "30px",
              height: "30px",
              background: "var(--accent)",
              "border-radius": "8px",
              color: "#fff",
            }}
          >
            <IconRadio size={16} />
          </span>
          Radio MRU
        </A>

        {/* Right side controls */}
        <div style={{ display: "flex", "align-items": "center", gap: "12px" }}>
          {/* Background effect switcher */}
          <div
            style={{
              display: "flex",
              gap: "2px",
              background: "var(--surface-2)",
              "border-radius": "8px",
              padding: "3px",
            }}
            title="Background effect"
          >
            {BG_MODES.map((mode) => {
              const isActive = () => bgEffect() === mode.id;
              return (
                <button
                  onClick={() => setBgEffect(mode.id)}
                  title={mode.label}
                  aria-label={`Background: ${mode.label}`}
                  style={{
                    display: "flex",
                    "align-items": "center",
                    "justify-content": "center",
                    width: "28px",
                    height: "28px",
                    "border-radius": "6px",
                    border: "none",
                    cursor: "pointer",
                    transition: "background 0.15s, color 0.15s",
                    background: isActive() ? "var(--accent)" : "transparent",
                    color: isActive() ? "#fff" : "var(--text-3)",
                  }}
                >
                  <mode.icon />
                </button>
              );
            })}
          </div>

          {/* Locale switcher */}
          {showLocales() && (
            <nav style={{ display: "flex", gap: "2px" }}>
              {SUPPORTED_LOCALES.map((locale) => {
                const isActive = () => activeLocale() === locale;
                return (
                  <A
                    href={localePath(locale)}
                    style={{
                      padding: "4px 10px",
                      "border-radius": "6px",
                      "font-size": "12px",
                      "font-weight": 600,
                      "letter-spacing": "0.04em",
                      "text-transform": "uppercase",
                      "text-decoration": "none",
                      transition: "background 0.15s, color 0.15s",
                      background: isActive() ? "var(--accent)" : "transparent",
                      color: isActive() ? "#fff" : "var(--text-2)",
                    }}
                  >
                    {locale}
                  </A>
                );
              })}
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
