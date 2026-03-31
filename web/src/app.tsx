import { Router } from "@solidjs/router";
import { MetaProvider } from "@solidjs/meta";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import Nav from "~/components/Nav";
import PersistentPlayer from "~/components/PersistentPlayer";
import BackgroundEffect from "~/components/BackgroundEffect";
import { PlayerProvider } from "~/lib/player";
import "./app.css";

export default function App() {
  return (
    <MetaProvider>
      <PlayerProvider>
        <Router
          root={(props) => (
            <>
              <BackgroundEffect />
              <div style={{ position: "relative", "z-index": "1" }}>
                <Nav />
                <div style={{ "padding-bottom": "calc(var(--player-h) + 16px)" }}>
                  <Suspense>{props.children}</Suspense>
                </div>
                <PersistentPlayer />
              </div>
            </>
          )}
        >
          <FileRoutes />
        </Router>
      </PlayerProvider>
    </MetaProvider>
  );
}
