import { A } from "@solidjs/router";
import { Meta, Title } from "@solidjs/meta";

const languages = [
  { code: "en", label: "English", flag: "🇬🇧", sub: "English" },
  { code: "ro", label: "Română", flag: "🇷🇴", sub: "Romanian" },
  { code: "uk", label: "Українська", flag: "🇺🇦", sub: "Ukrainian" },
];

export default function Home() {
  return (
    <>
      <Title>Radio MRU — Moldova, Romania and Ukraine</Title>
      <Meta
        name="description"
        content="Listen to live radio stations from Moldova, Romania and Ukraine. Choose your language."
      />

      <main
        style={{
          "min-height": "calc(100dvh - var(--nav-h) - var(--player-h))",
          display: "flex",
          "flex-direction": "column",
          "align-items": "center",
          "justify-content": "center",
          padding: "2rem 1rem",
        }}
        class="animate-fade-in"
      >
        {/* Hero graphic — concentric arcs */}
        <div style={{ position: "relative", width: "96px", height: "72px", "margin-bottom": "2rem" }}>
          <svg width="96" height="72" viewBox="0 0 96 72" fill="none">
            <path d="M16 56 A40 40 0 0 1 80 56" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" opacity="0.25" />
            <path d="M26 56 A30 30 0 0 1 70 56" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" opacity="0.5" />
            <path d="M36 56 A20 20 0 0 1 60 56" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" opacity="0.8" />
            <circle cx="48" cy="56" r="5" fill="var(--accent)" />
          </svg>
        </div>

        <h1
          style={{
            "font-size": "clamp(1.6rem, 5vw, 2.4rem)",
            "font-weight": 700,
            "letter-spacing": "-0.03em",
            "text-align": "center",
            color: "var(--text-1)",
            "margin-bottom": "0.5rem",
          }}
        >
          Radio MRU
        </h1>
        <p
          style={{
            color: "var(--text-2)",
            "font-size": "15px",
            "text-align": "center",
            "margin-bottom": "2.5rem",
          }}
        >
          Moldova · Romania · Ukraine
        </p>

        <div
          style={{
            display: "grid",
            "grid-template-columns": "repeat(3, 1fr)",
            gap: "12px",
            width: "100%",
            "max-width": "480px",
          }}
        >
          {languages.map((lang) => (
            <A
              href={`/${lang.code}`}
              style={{
                display: "flex",
                "flex-direction": "column",
                "align-items": "center",
                "justify-content": "center",
                gap: "8px",
                padding: "1.25rem 0.75rem",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                "border-radius": "14px",
                "text-decoration": "none",
                transition: "border-color 0.2s, background 0.2s, transform 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--surface-hover)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--surface)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              <span style={{ "font-size": "2rem", "line-height": 1 }}>{lang.flag}</span>
              <span style={{ "font-weight": 600, "font-size": "14px", color: "var(--text-1)" }}>
                {lang.label}
              </span>
            </A>
          ))}
        </div>
      </main>
    </>
  );
}
