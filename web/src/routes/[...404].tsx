import { A } from "@solidjs/router";
import { Meta, Title } from "@solidjs/meta";

export default function NotFound() {
  return (
    <main
      style={{
        "min-height": "calc(100dvh - var(--nav-h) - var(--player-h))",
        display: "flex",
        "flex-direction": "column",
        "align-items": "center",
        "justify-content": "center",
        padding: "2rem 1rem",
        "text-align": "center",
      }}
      class="animate-fade-in"
    >
      <Title>404 — Page not found</Title>
      <Meta name="robots" content="noindex" />

      <p style={{ "font-size": "4rem", "font-weight": 700, color: "var(--border-strong)", "margin-bottom": "1rem" }}>
        404
      </p>
      <h1 style={{ "font-size": "1.2rem", "font-weight": 600, color: "var(--text-1)", "margin-bottom": "0.5rem" }}>
        Page not found
      </h1>
      <p style={{ color: "var(--text-2)", "font-size": "14px", "margin-bottom": "1.5rem" }}>
        The page you requested does not exist.
      </p>
      <A
        href="/"
        style={{
          padding: "8px 18px",
          background: "var(--accent)",
          color: "#fff",
          "border-radius": "8px",
          "text-decoration": "none",
          "font-size": "14px",
          "font-weight": 500,
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--accent-hover)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--accent)")}
      >
        Back to home
      </A>
    </main>
  );
}
