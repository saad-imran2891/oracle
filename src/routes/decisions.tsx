import { createFileRoute } from "@tanstack/react-router";
import { useMission } from "@/hooks/use-mission";
import { DecisionBadge } from "@/components/panel";
import { fmtKB } from "@/lib/simulation";
import { useState } from "react";

export const Route = createFileRoute("/decisions")({
  head: () => ({ meta: [{ title: "AI Decision Log — ORACLE" }] }),
  component: Decisions,
});

const C = {
  green:  "oklch(0.78 0.17 155)",
  blue:   "oklch(0.72 0.18 220)",
  amber:  "oklch(0.82 0.16 75)",
  red:    "oklch(0.65 0.21 25)",
  dim:    "oklch(0.50 0.02 230)",
  muted:  "oklch(0.38 0.02 230)",
  text:   "oklch(0.94 0.015 220)",
  sub:    "oklch(0.65 0.02 230)",
  panel:  "oklch(0.17 0.024 250)",
  border: "oklch(0.26 0.03 245 / 55%)",
  mono:   "var(--font-mono)",
  disp:   "var(--font-display)",
};

const SCENE_PRIOR: Record<string, number> = {
  AnnualCrop: 0.5, Forest: 0.62, HerbaceousVegetation: 0.4,
  Highway: 0.7, Industrial: 0.82, Pasture: 0.42,
  PermanentCrop: 0.5, Residential: 0.78, River: 0.74, SeaLake: 0.55,
};

function ScoreBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 48, height: 4, background: "oklch(0.22 0.025 245)", borderRadius: 2, overflow: "hidden", flexShrink: 0 }}>
        <div style={{ height: "100%", width: `${(value / max) * 100}%`, background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontFamily: C.mono, fontSize: "0.7rem", color: C.text, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function Decisions() {
  const { frames, thresholds, store } = useMission();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? frames.find(f => f.id === selectedId) : null;

  const breakdown = selected ? (() => {
    const prior   = SCENE_PRIOR[selected.sceneClass] ?? 0.5;
    const scenePt = +(100 * 0.45 * prior).toFixed(1);
    const objPt   = +(100 * 0.25 * selected.objectDensity).toFixed(1);
    const novPt   = +(100 * 0.20 * selected.novelty).toFixed(1);
    const cloudPt = +(100 * 0.35 * selected.cloudCover).toFixed(1);
    const bonus   = +((1 - selected.cloudCover) * 8).toFixed(1);
    return { prior, scenePt, objPt, novPt, cloudPt, bonus };
  })() : null;

  return (
    <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* Threshold controls */}
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: "0.5rem", padding: "1rem" }}>
        <div style={{ fontFamily: C.mono, fontSize: "0.6rem", letterSpacing: "0.14em", color: C.muted, textTransform: "uppercase", marginBottom: "0.875rem" }}>
          Decision Engine · Configurable Thresholds
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1.5rem" }}>
          {[
            { label: "DISCARD ≤",      val: thresholds.discard,                          min: 0,  max: 60,  onChange: (v: number) => store.setThresholds({ discard: v }),                color: "var(--color-tier-discard)"  },
            { label: "STORE ≤",        val: thresholds.store,                            min: 20, max: 80,  onChange: (v: number) => store.setThresholds({ store: v }),                  color: "var(--color-tier-store)"    },
            { label: "COMPRESS ≤",     val: thresholds.compress,                         min: 50, max: 95,  onChange: (v: number) => store.setThresholds({ compress: v }),               color: "var(--color-tier-compress)"  },
            { label: "CLOUD VETO",     val: Math.round(thresholds.cloudVeto * 100),      min: 50, max: 100, onChange: (v: number) => store.setThresholds({ cloudVeto: v / 100 }),        color: C.blue, suffix: "%" },
            { label: "COMPRESS RATIO", val: Math.round(thresholds.compressionRatio * 100), min: 5, max: 50, onChange: (v: number) => store.setThresholds({ compressionRatio: v / 100 }), color: C.amber, suffix: "%" },
          ].map(s => (
            <div key={s.label}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: C.mono, fontSize: "0.62rem", marginBottom: "0.4rem" }}>
                <span style={{ color: C.muted, letterSpacing: "0.08em" }}>{s.label}</span>
                <span style={{ color: s.color, fontWeight: 700 }}>{s.val}{s.suffix ?? ""}</span>
              </div>
              <input type="range" min={s.min} max={s.max} value={s.val}
                onChange={(e) => s.onChange(+e.target.value)}
                style={{ width: "100%", accentColor: s.color }} />
            </div>
          ))}
        </div>

        {/* Tier legend */}
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.875rem", paddingTop: "0.75rem", borderTop: `1px solid ${C.border}` }}>
          {[
            { color: "var(--color-tier-discard)",  label: `DISCARD  0–${thresholds.discard}` },
            { color: "var(--color-tier-store)",     label: `STORE    ${thresholds.discard + 1}–${thresholds.store}` },
            { color: "var(--color-tier-compress)",  label: `COMPRESS ${thresholds.store + 1}–${thresholds.compress}` },
            { color: "var(--color-tier-transmit)",  label: `TRANSMIT ${thresholds.compress + 1}–100` },
          ].map(t => (
            <span key={t.label} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: C.mono, fontSize: "0.65rem", color: C.sub }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: t.color, display: "inline-block" }} />
              {t.label}
            </span>
          ))}
        </div>
      </div>

      {/* Score breakdown + Table side by side */}
      <div style={{ display: "grid", gridTemplateColumns: selected ? "300px 1fr" : "1fr", gap: "0.75rem" }}>

        {/* Score breakdown — only visible when row selected */}
        {selected && breakdown && (
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.blue}`, borderRadius: "0.5rem", padding: "1rem" }}>
            <div style={{ fontFamily: C.mono, fontSize: "0.6rem", letterSpacing: "0.14em", color: C.muted, textTransform: "uppercase", marginBottom: "0.75rem" }}>
              Score Breakdown · {selected.id}
            </div>

            {/* Image */}
            {(selected as any).imagePath && (
              <img src={(selected as any).imagePath} alt={selected.sceneClass}
                style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: "0.375rem", marginBottom: "0.875rem", border: `1px solid ${C.border}` }} />
            )}

            <div style={{ fontFamily: C.mono, fontSize: "0.75rem", color: C.text, fontWeight: 600, marginBottom: "0.625rem" }}>
              {selected.sceneClass}
            </div>

            {/* Breakdown bars */}
            {[
              { label: "Scene Prior",    pt: breakdown.scenePt, max: 45,  color: C.blue,  note: `${(breakdown.prior).toFixed(2)} × 45%` },
              { label: "Obj Density",    pt: breakdown.objPt,   max: 25,  color: C.green, note: `${selected.objectDensity.toFixed(3)} × 25%` },
              { label: "Novelty",        pt: breakdown.novPt,   max: 20,  color: C.amber, note: `${selected.novelty.toFixed(3)} × 20%` },
              { label: "Cloud Penalty",  pt: -breakdown.cloudPt, max: 35, color: C.red,   note: `−${(selected.cloudCover * 100).toFixed(0)}%` },
              { label: "Clear Bonus",    pt: breakdown.bonus,   max: 8,   color: C.green, note: `+${breakdown.bonus.toFixed(1)}` },
            ].map(row => (
              <div key={row.label} style={{ marginBottom: "0.625rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: C.mono, fontSize: "0.62rem", marginBottom: "0.25rem" }}>
                  <span style={{ color: C.sub }}>{row.label}</span>
                  <span style={{ color: row.color, fontWeight: 600 }}>{row.note}</span>
                </div>
                <div style={{ height: 4, background: "oklch(0.22 0.025 245)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, (Math.abs(row.pt) / row.max) * 100)}%`, background: row.color, borderRadius: 2 }} />
                </div>
              </div>
            ))}

            {/* Final score */}
            <div style={{ borderTop: `1px solid ${C.border}`, marginTop: "0.75rem", paddingTop: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: C.mono, fontSize: "0.65rem", color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Final Score</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontFamily: C.disp, fontSize: "1.75rem", fontWeight: 700, color: C.text }}>{selected.relevance}</span>
                <DecisionBadge d={selected.decision} />
              </div>
            </div>

            <button onClick={() => setSelectedId(null)}
              style={{ width: "100%", marginTop: "0.75rem", padding: "0.4rem", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "0.25rem", fontFamily: C.mono, fontSize: "0.65rem", color: C.muted, cursor: "pointer" }}>
              ✕ Close
            </button>
          </div>
        )}

        {/* Decision log table */}
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: "0.5rem", padding: "1rem", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div style={{ fontFamily: C.mono, fontSize: "0.6rem", letterSpacing: "0.14em", color: C.muted, textTransform: "uppercase" }}>
              Decision Log · {frames.length} Frames · Click Row to Inspect
            </div>
          </div>
          <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "calc(100vh - 320px)" }}>
            <table style={{ width: "100%", fontFamily: C.mono, fontSize: "0.7rem", borderCollapse: "collapse" }}>
              <thead style={{ position: "sticky", top: 0, background: C.panel, zIndex: 1 }}>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["ID", "T+", "Scene", "Cloud", "Objects", "Novelty", "Score", "Decision", "Downlink", "Latency"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "0.4rem 0.5rem", color: C.muted, fontWeight: 500, fontSize: "0.6rem", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {frames.slice(0, 80).map((f) => {
                  const isSelected = f.id === selectedId;
                  const scoreColor = f.relevance > 80 ? C.green : f.relevance > 60 ? C.amber : f.relevance > 30 ? C.blue : C.dim;
                  return (
                    <tr key={f.id}
                      onClick={() => setSelectedId(isSelected ? null : f.id)}
                      style={{
                        borderBottom: `1px solid oklch(0.20 0.022 245 / 40%)`,
                        background: isSelected ? "oklch(0.22 0.06 220 / 25%)" : "transparent",
                        borderLeft: isSelected ? `2px solid ${C.blue}` : "2px solid transparent",
                        cursor: "pointer",
                        transition: "background 0.1s",
                      }}>
                      <td style={{ padding: "0.35rem 0.5rem", color: C.muted, whiteSpace: "nowrap" }}>{f.id}</td>
                      <td style={{ padding: "0.35rem 0.5rem", color: C.sub, whiteSpace: "nowrap" }}>{f.orbitSec}s</td>
                      <td style={{ padding: "0.35rem 0.5rem", color: C.text, whiteSpace: "nowrap" }}>{f.sceneClass}</td>
                      <td style={{ padding: "0.35rem 0.5rem", fontVariantNumeric: "tabular-nums", color: f.cloudCover > 0.6 ? C.red : C.sub }}>{(f.cloudCover * 100).toFixed(0)}%</td>
                      <td style={{ padding: "0.35rem 0.5rem", fontVariantNumeric: "tabular-nums", color: C.sub }}>{f.objectDensity.toFixed(2)}</td>
                      <td style={{ padding: "0.35rem 0.5rem", fontVariantNumeric: "tabular-nums", color: C.sub }}>{f.novelty.toFixed(2)}</td>
                      <td style={{ padding: "0.35rem 0.5rem" }}>
                        <ScoreBar value={f.relevance} color={scoreColor} />
                      </td>
                      <td style={{ padding: "0.35rem 0.5rem" }}><DecisionBadge d={f.decision} /></td>
                      <td style={{ padding: "0.35rem 0.5rem", fontVariantNumeric: "tabular-nums", color: C.sub, whiteSpace: "nowrap" }}>{fmtKB(f.transmittedSizeKB)}</td>
                      <td style={{ padding: "0.35rem 0.5rem", fontVariantNumeric: "tabular-nums", color: C.muted, whiteSpace: "nowrap" }}>{f.latencyMs}ms</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}