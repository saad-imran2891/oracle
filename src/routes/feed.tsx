import { createFileRoute } from "@tanstack/react-router";
import { useMission } from "@/hooks/use-mission";
import { DecisionBadge } from "@/components/panel";
import { fmtKB, DECISION_COLOR } from "@/lib/simulation";
import { useState } from "react";

export const Route = createFileRoute("/feed")({
  head: () => ({ meta: [{ title: "Live Satellite Feed — ORACLE" }] }),
  component: Feed,
});

const C = {
  green:  "oklch(0.78 0.17 155)",
  blue:   "oklch(0.72 0.18 220)",
  amber:  "oklch(0.82 0.16 75)",
  red:    "oklch(0.65 0.21 25)",
  muted:  "oklch(0.38 0.02 230)",
  text:   "oklch(0.94 0.015 220)",
  sub:    "oklch(0.65 0.02 230)",
  panel:  "oklch(0.17 0.024 250)",
  border: "oklch(0.26 0.03 245 / 55%)",
  mono:   "var(--font-mono)",
  disp:   "var(--font-display)",
};

function Feed() {
  const { frames } = useMission();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = frames.find(f => f.id === selectedId) ?? frames[0];

  const scoreColor = (r: number) =>
    r > 80 ? C.green : r > 60 ? C.amber : r > 30 ? C.blue : C.muted;

  return (
    <div style={{
      padding: "1rem",
      display: "grid",
      gridTemplateColumns: "1fr 280px",
      gap: "1rem",
      height: "calc(100vh - 56px)",
      overflow: "hidden",
    }}>

      {/* LEFT — Image grid */}
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: "0.5rem", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "0.75rem 1rem", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: C.mono, fontSize: "0.6rem", letterSpacing: "0.14em", color: C.muted, textTransform: "uppercase" }}>Capture Stream</div>
            <div style={{ fontFamily: C.mono, fontSize: "0.68rem", color: C.sub, marginTop: 2 }}>2 Hz · ResNet18 · EuroSAT Sentinel-2</div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            {[
              { label: "TRANSMIT", color: "var(--color-tier-transmit)" },
              { label: "COMPRESS", color: "var(--color-tier-compress)" },
              { label: "STORE",    color: "var(--color-tier-store)"    },
              { label: "DISCARD",  color: "var(--color-tier-discard)"  },
            ].map(d => (
              <span key={d.label} style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: C.mono, fontSize: "0.58rem", color: C.sub }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color, display: "inline-block" }} />
                {d.label}
              </span>
            ))}
          </div>
        </div>

        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "0.75rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
          gap: "0.4rem",
          alignContent: "start",
        }}>
          {frames.map((f) => {
            const active = selected?.id === f.id;
            const dc = DECISION_COLOR[f.decision];
            return (
              <button
                key={f.id}
                onClick={() => setSelectedId(f.id)}
                style={{
                  position: "relative",
                  aspectRatio: "1",
                  overflow: "hidden",
                  borderRadius: "0.375rem",
                  border: `${active ? 2 : 1}px solid ${active ? C.blue : dc}`,
                  cursor: "pointer",
                  background: "oklch(0.14 0.02 250)",
                  boxShadow: active ? `0 0 0 1px ${C.blue}44, 0 0 12px ${C.blue}22` : "none",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                  padding: 0,
                }}
              >
                {(f as any).imagePath ? (
                  <img
                    src={(f as any).imagePath}
                    alt={f.sceneClass}
                    loading="lazy"
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      if (e.currentTarget.parentElement)
                        e.currentTarget.parentElement.style.background =
                          `linear-gradient(135deg, hsl(${f.thumbHue} 40% 25%), hsl(${(f.thumbHue + 40) % 360} 50% 15%))`;
                    }}
                  />
                ) : (
                  <div style={{
                    position: "absolute", inset: 0,
                    background: `linear-gradient(135deg, hsl(${f.thumbHue} 40% 25%), hsl(${(f.thumbHue + 40) % 360} 50% 15%))`,
                  }} />
                )}

                {/* Cloud veil */}
                {f.cloudCover > 0.3 && (
                  <div style={{
                    position: "absolute", inset: 0,
                    background: `radial-gradient(circle at 50% 20%, oklch(0.95 0.01 220 / ${f.cloudCover * 0.5}) 0%, transparent 60%)`,
                  }} />
                )}

                {/* Decision dot */}
                <span style={{
                  position: "absolute", top: 3, left: 3,
                  width: 6, height: 6, borderRadius: "50%",
                  background: dc, boxShadow: `0 0 4px ${dc}`,
                }} />

                {/* Score badge */}
                <span style={{
                  position: "absolute", top: 3, right: 3,
                  fontFamily: C.mono, fontSize: "0.5rem", fontWeight: 700,
                  color: "white", background: "oklch(0 0 0 / 0.55)",
                  padding: "1px 3px", borderRadius: 2,
                }}>{f.relevance}</span>

                {/* Frame ID */}
                <span style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  background: "linear-gradient(to top, oklch(0 0 0 / 0.65), transparent)",
                  fontFamily: C.mono, fontSize: "0.5rem",
                  color: "oklch(0.88 0 0)", padding: "3px 4px 2px",
                }}>{f.id}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT — Inspector */}
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: "0.5rem", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "0.75rem 1rem", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ fontFamily: C.mono, fontSize: "0.6rem", letterSpacing: "0.14em", color: C.muted, textTransform: "uppercase" }}>Frame Inspector</div>
          <div style={{ fontFamily: C.mono, fontSize: "0.72rem", color: C.blue, marginTop: 2 }}>{selected?.id ?? "—"}</div>
        </div>

        {selected && (
          <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>

            {/* Image */}
            <div style={{
              position: "relative",
              aspectRatio: "1",
              borderRadius: "0.375rem",
              overflow: "hidden",
              border: `1px solid ${DECISION_COLOR[selected.decision]}`,
              flexShrink: 0,
            }}>
              {(selected as any).imagePath ? (
                <img
                  src={(selected as any).imagePath}
                  alt={selected.sceneClass}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    if (e.currentTarget.parentElement)
                      e.currentTarget.parentElement.style.background =
                        `linear-gradient(135deg, hsl(${selected.thumbHue} 40% 25%), hsl(${(selected.thumbHue + 40) % 360} 50% 15%))`;
                  }}
                />
              ) : (
                <div style={{
                  position: "absolute", inset: 0,
                  background: `linear-gradient(135deg, hsl(${selected.thumbHue} 40% 25%), hsl(${(selected.thumbHue + 40) % 360} 50% 15%))`,
                }} />
              )}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, oklch(0 0 0 / 0.7) 0%, transparent 50%)" }} />
              <div style={{ position: "absolute", top: 6, left: 6, right: 6, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: C.mono, fontSize: "0.6rem", color: "white", background: "oklch(0 0 0 / 0.5)", padding: "2px 5px", borderRadius: 3 }}>
                  {selected.lat.toFixed(2)}° {selected.lon.toFixed(2)}°
                </span>
                <DecisionBadge d={selected.decision} />
              </div>
              <div style={{ position: "absolute", bottom: 6, left: 6 }}>
                <div style={{ fontFamily: C.mono, fontSize: "0.72rem", fontWeight: 700, color: "white" }}>{selected.sceneClass}</div>
                <div style={{ fontFamily: C.mono, fontSize: "0.6rem", color: "oklch(0.80 0 0 / 0.85)", marginTop: 2 }}>
                  CONF {((selected as any).confidence * 100 || 0).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Relevance score bar */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: C.mono, fontSize: "0.6rem", color: C.muted, marginBottom: 4 }}>
                <span>RELEVANCE SCORE</span>
                <span style={{ color: scoreColor(selected.relevance), fontWeight: 700 }}>{selected.relevance} / 100</span>
              </div>
              <div style={{ height: 8, background: "oklch(0.20 0.022 245)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${selected.relevance}%`,
                  background: scoreColor(selected.relevance),
                  borderRadius: 4, transition: "width 0.4s ease",
                }} />
              </div>
            </div>

            {/* Telemetry */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              {[
                { k: "Scene",        v: selected.sceneClass },
                { k: "Cloud Cover",  v: `${(selected.cloudCover * 100).toFixed(0)}%` },
                { k: "Obj Density",  v: selected.objectDensity.toFixed(3) },
                { k: "Novelty",      v: selected.novelty.toFixed(3) },
                { k: "Raw Size",     v: fmtKB(selected.rawSizeKB) },
                { k: "Downlink",     v: fmtKB(selected.transmittedSizeKB) },
                { k: "Latency",      v: `${selected.latencyMs} ms` },
                { k: "Orbit T+",     v: `${selected.orbitSec}s` },
              ].map(({ k, v }) => (
                <div key={k} style={{
                  display: "flex", justifyContent: "space-between",
                  borderBottom: `1px solid oklch(0.22 0.025 245 / 40%)`,
                  padding: "0.3rem 0",
                  fontFamily: C.mono, fontSize: "0.68rem",
                }}>
                  <span style={{ color: C.muted }}>{k}</span>
                  <span style={{ color: C.text }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}