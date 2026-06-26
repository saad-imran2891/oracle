import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, Link, createRootRouteWithContext, useRouter,
  HeadContent, Scripts, useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useMission } from "@/hooks/use-mission";

function NotFoundComponent() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "oklch(0.13 0.022 250)", padding: "2rem",
    }}>
      <div style={{ maxWidth: 480, textAlign: "center" }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%", margin: "0 auto 1.5rem",
          border: "1px solid oklch(0.65 0.18 220 / 30%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "oklch(0.18 0.04 220 / 40%)",
          boxShadow: "0 0 40px oklch(0.65 0.18 220 / 10%)",
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="oklch(0.65 0.18 220)" strokeWidth="1.5">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            <path d="M2 12h20"/>
          </svg>
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.2em", color: "oklch(0.50 0.02 230)", marginBottom: "0.75rem", textTransform: "uppercase" }}>
          Signal Lost · ERR_404
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 600, color: "oklch(0.94 0.015 220)", marginBottom: "0.5rem" }}>
          Telemetry Lost
        </h1>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "oklch(0.50 0.02 230)", lineHeight: 1.7, marginBottom: "2rem" }}>
          No route in the mission plan matches this path.
        </p>
        <Link to="/" style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          background: "oklch(0.65 0.18 220)", color: "oklch(0.10 0.02 250)",
          padding: "0.6rem 1.25rem", borderRadius: "0.375rem",
          fontFamily: "var(--font-mono)", fontSize: "0.75rem",
          fontWeight: 600, letterSpacing: "0.08em", textDecoration: "none",
        }}>← Return to Mission Overview</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "oklch(0.13 0.022 250)", padding: "2rem",
    }}>
      <div style={{ maxWidth: 480, textAlign: "center" }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%", margin: "0 auto 1.5rem",
          border: "1px solid oklch(0.65 0.21 25 / 40%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "oklch(0.20 0.06 25 / 40%)",
          boxShadow: "0 0 40px oklch(0.65 0.21 25 / 15%)",
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="oklch(0.65 0.21 25)" strokeWidth="1.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.2em", color: "oklch(0.65 0.21 25)", marginBottom: "0.75rem", textTransform: "uppercase" }}>
          System Fault · Subsystem Error
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 600, color: "oklch(0.94 0.015 220)", marginBottom: "0.5rem" }}>
          Payload Exception
        </h1>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "oklch(0.50 0.02 230)", lineHeight: 1.7, marginBottom: "2rem" }}>
          An onboard subsystem reported an unhandled exception.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => { router.invalidate(); reset(); }}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              background: "oklch(0.65 0.18 220)", color: "oklch(0.10 0.02 250)",
              padding: "0.6rem 1.25rem", borderRadius: "0.375rem", border: "none",
              fontFamily: "var(--font-mono)", fontSize: "0.75rem",
              fontWeight: 600, letterSpacing: "0.08em", cursor: "pointer",
            }}
          >↺ Retry Sequence</button>
          <a href="/" style={{
            display: "inline-flex", alignItems: "center",
            background: "transparent", color: "oklch(0.65 0.02 230)",
            padding: "0.6rem 1.25rem", borderRadius: "0.375rem",
            border: "1px solid oklch(0.30 0.03 245 / 60%)",
            fontFamily: "var(--font-mono)", fontSize: "0.75rem",
            letterSpacing: "0.08em", textDecoration: "none",
          }}>Mission Overview</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ORACLE — Orbital Relevance Assessment & Compression Logic Engine" },
      { name: "description", content: "Onboard AI payload for CubeSat Earth observation. ResNet18 on EuroSAT Sentinel-2 — 97.19% accuracy, 0.16ms latency, 91%+ bandwidth reduction." },
      { property: "og:title", content: "ORACLE Mission Console" },
      { property: "og:description", content: "Onboard AI CubeSat payload — ResNet18 · EuroSAT · 97.19% accuracy · 91% bandwidth reduction" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: 8, height: 8, flexShrink: 0 }}>
      {active && (
        <span style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: "oklch(0.78 0.17 155)",
          animation: "ping 2s cubic-bezier(0,0,0.2,1) infinite",
          opacity: 0.5,
        }} />
      )}
      <span style={{
        position: "relative", display: "inline-flex", width: 8, height: 8,
        borderRadius: "50%",
        background: active ? "oklch(0.78 0.17 155)" : "oklch(0.82 0.16 75)",
      }} />
    </span>
  );
}

function TopBar() {
  const { metrics, running, store } = useMission();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [utc, setUtc] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setUtc(now.toUTCString().slice(17, 25) + " UTC");
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const pageMap: Record<string, { label: string; sub: string }> = {
    "/":          { label: "Mission Overview",   sub: "Payload telemetry · EuroSAT Sentinel-2" },
    "/feed":      { label: "Live Satellite Feed", sub: "ResNet18 inference · 2 Hz capture rate" },
    "/decisions": { label: "AI Decision Log",     sub: "Scene triage · configurable thresholds" },
    "/queue":     { label: "Transmission Queue",  sub: "Downlink scheduler · 3 Mbps · 8-min AOS" },
    "/analytics": { label: "Analytics",           sub: "Model performance · 97.19% test accuracy" },
    "/system":    { label: "System Performance",  sub: "CubeSat telemetry · ISSSP Appendix 5 spec" },
  };

  const page = pageMap[pathname] ?? { label: "Mission", sub: "ORACLE payload console" };

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 20,
      height: 56,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: "1rem",
      borderBottom: "1px solid oklch(0.28 0.03 245 / 50%)",
      background: "oklch(0.14 0.022 250 / 92%)",
      backdropFilter: "blur(12px)",
      padding: "0 1rem",
    }}>
      {/* Left — sidebar trigger + page identity */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
        <SidebarTrigger />
        {/* Divider */}
        <div style={{ width: 1, height: 28, background: "oklch(0.28 0.03 245 / 60%)", flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: "0.6rem",
            letterSpacing: "0.14em", color: "oklch(0.50 0.02 230)",
            textTransform: "uppercase", lineHeight: 1,
          }}>
            ORACLE · MCC
          </div>
          <div style={{
            fontFamily: "var(--font-display)", fontSize: "0.88rem",
            fontWeight: 600, color: "oklch(0.94 0.015 220)",
            lineHeight: 1.3, marginTop: 2,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {page.label}
          </div>
        </div>
        {/* Page subtitle — hidden on small screens */}
        <div style={{
          display: "none",
          fontFamily: "var(--font-mono)", fontSize: "0.65rem",
          color: "oklch(0.45 0.02 230)", borderLeft: "1px solid oklch(0.28 0.03 245 / 50%)",
          paddingLeft: "0.75rem", lineHeight: 1.4,
        }}
          className="md-show"
        >
          {page.sub}
        </div>
      </div>

      {/* Right — live telemetry strip */}
      <div style={{
        display: "flex", alignItems: "center", gap: "0.5rem",
        fontFamily: "var(--font-mono)", fontSize: "0.72rem",
        flexShrink: 0,
      }}>
        {/* Status */}
        <div style={{
          display: "flex", alignItems: "center", gap: "0.35rem",
          padding: "0.25rem 0.6rem",
          border: "1px solid oklch(0.28 0.03 245 / 50%)",
          borderRadius: "0.25rem",
          background: "oklch(0.17 0.025 250 / 60%)",
        }}>
          <StatusDot active={running} />
          <span style={{ color: running ? "oklch(0.78 0.17 155)" : "oklch(0.82 0.16 75)", fontSize: "0.65rem", letterSpacing: "0.08em" }}>
            {running ? "NOMINAL" : "PAUSED"}
          </span>
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 20, background: "oklch(0.28 0.03 245 / 50%)" }} />

        {/* Frames */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1 }}>
          <span style={{ color: "oklch(0.45 0.02 230)", fontSize: "0.55rem", letterSpacing: "0.1em" }}>FRAMES</span>
          <span style={{ color: "oklch(0.94 0.015 220)", fontWeight: 600, fontSize: "0.78rem", fontVariantNumeric: "tabular-nums" }}>
            {metrics.processed}
          </span>
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 20, background: "oklch(0.28 0.03 245 / 50%)" }} />

        {/* BW Saved */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1 }}>
          <span style={{ color: "oklch(0.45 0.02 230)", fontSize: "0.55rem", letterSpacing: "0.1em" }}>BW SAVED</span>
          <span style={{ color: "oklch(0.78 0.17 155)", fontWeight: 600, fontSize: "0.78rem", fontVariantNumeric: "tabular-nums" }}>
            {metrics.bandwidthSavingsPct}%
          </span>
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 20, background: "oklch(0.28 0.03 245 / 50%)" }} />

        {/* UTC Clock */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1 }}>
          <span style={{ color: "oklch(0.45 0.02 230)", fontSize: "0.55rem", letterSpacing: "0.1em" }}>UTC</span>
          <span style={{ color: "oklch(0.72 0.18 220)", fontWeight: 500, fontSize: "0.72rem", fontVariantNumeric: "tabular-nums" }}>
            {utc}
          </span>
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 20, background: "oklch(0.28 0.03 245 / 50%)" }} />

        {/* Pause/Resume */}
        <button
          onClick={() => store.toggleRunning()}
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.35rem",
            padding: "0.3rem 0.75rem",
            border: `1px solid ${running ? "oklch(0.40 0.12 220 / 60%)" : "oklch(0.50 0.14 75 / 60%)"}`,
            borderRadius: "0.25rem",
            background: running ? "oklch(0.20 0.06 220 / 40%)" : "oklch(0.22 0.08 75 / 30%)",
            color: running ? "oklch(0.72 0.18 220)" : "oklch(0.82 0.16 75)",
            fontFamily: "var(--font-mono)", fontSize: "0.68rem",
            letterSpacing: "0.08em", cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          {running ? (
            <>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                <rect x="1" y="1" width="3" height="8" rx="0.5"/>
                <rect x="6" y="1" width="3" height="8" rx="0.5"/>
              </svg>
              PAUSE
            </>
          ) : (
            <>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                <polygon points="2,1 9,5 2,9"/>
              </svg>
              RESUME
            </>
          )}
        </button>
      </div>
    </header>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <div style={{ minHeight: "100vh", display: "flex", width: "100%", background: "oklch(0.13 0.022 250)", color: "oklch(0.94 0.015 220)" }}>
          <AppSidebar />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <TopBar />
            <main style={{ flex: 1, minWidth: 0 }}>
              <Outlet />
            </main>
            {/* Footer bar */}
            <footer style={{
              borderTop: "1px solid oklch(0.24 0.025 245 / 40%)",
              padding: "0.4rem 1rem",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              fontFamily: "var(--font-mono)", fontSize: "0.6rem",
              color: "oklch(0.38 0.02 230)",
              background: "oklch(0.12 0.02 250 / 80%)",
            }}>
              <span>ORACLE · Orbital Relevance Assessment & Compression Logic Engine</span>
              <span style={{ display: "flex", gap: "1.5rem" }}>
                <span>ResNet18 · EuroSAT RGB · 27,000 images</span>
                <span style={{ color: "oklch(0.50 0.02 230)" }}>Accuracy <span style={{ color: "oklch(0.78 0.17 155)" }}>97.19%</span></span>
                <span style={{ color: "oklch(0.50 0.02 230)" }}>Latency <span style={{ color: "oklch(0.72 0.18 220)" }}>0.16ms</span></span>
              </span>
            </footer>
          </div>
        </div>
      </SidebarProvider>
    </QueryClientProvider>
  );
}