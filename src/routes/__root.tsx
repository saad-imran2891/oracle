import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, Link, createRootRouteWithContext, useRouter,
  HeadContent, Scripts, useRouterState,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useMission } from "@/hooks/use-mission";
import { missionStore } from "@/lib/mission-store";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground font-display">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Telemetry Lost</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No route in the mission plan matches that path.
        </p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Return to Mission Overview
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight font-display">Payload Fault</h1>
        <p className="mt-2 text-sm text-muted-foreground">An onboard subsystem reported an error.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >Retry</button>
          <a href="/" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent">Mission Overview</a>
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
      { title: "ORBITAL-AI — Onboard Scene Relevance Payload" },
      { name: "description", content: "ISSSP 2026 Track 2: AI-powered onboard CubeSat scene-relevance assessment and data-reduction mission console." },
      { property: "og:title", content: "ORBITAL-AI Mission Console" },
      { property: "og:description", content: "Onboard AI scene triage for CubeSat downlink reduction — live mission control dashboard." },
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

function TopBar() {
  const { metrics, running, store } = useMission();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const titleMap: Record<string, string> = {
    "/": "Mission Overview", "/feed": "Live Satellite Feed",
    "/decisions": "AI Decision Log", "/queue": "Transmission Queue",
    "/analytics": "Analytics", "/system": "System Performance",
  };
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/85 backdrop-blur px-3">
      <div className="flex items-center gap-2 min-w-0">
        <SidebarTrigger />
        <div className="hidden sm:block min-w-0">
          <div className="label-mono">ORBITAL-AI · MCC</div>
          <h1 className="font-display text-sm font-semibold truncate">{titleMap[pathname] ?? "Mission"}</h1>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs font-mono">
        <span className="hidden md:inline text-muted-foreground">FRAMES</span>
        <span className="tabular-nums">{metrics.processed}</span>
        <span className="text-border">|</span>
        <span className="hidden md:inline text-muted-foreground">SAVED</span>
        <span className="tabular-nums text-status-nominal">{metrics.bandwidthSavingsPct}%</span>
        <span className="text-border">|</span>
        <button
          onClick={() => store.toggleRunning()}
          className="rounded border border-border bg-panel px-2 py-1 hover:bg-accent/20"
        >
          {running ? "PAUSE" : "RESUME"}
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
        <div className="min-h-screen flex w-full bg-background text-foreground">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <TopBar />
            <main className="flex-1 min-w-0">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </QueryClientProvider>
  );
}
