import { createFileRoute } from "@tanstack/react-router";
import { useMission } from "@/hooks/use-mission";
import { DecisionBadge } from "@/components/panel";
import { fmtKB, DECISION_COLOR } from "@/lib/simulation";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import { useMemo } from "react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Mission Overview — ORACLE" }] }),
  component: Overview,
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

function KPI({ label, value, unit, color, sub }: {
  label: string; value: string | number; unit?: string;
  color?: string; sub?: string;
}) {
  return (
    <div style={{
      background: C.panel,
      border: `1px solid ${C.border}`,
      borderTop: `2px solid ${color ?? C.blue}`,
      borderRadius: "0.5rem",
      padding: "0.875rem 1rem",
    }}>
      <div style={{ fontFamily: C.mono, fontSize: "0.58rem", letterSpacing: "0.14em", color: C.muted, textTransform: "uppercase", marginBottom: "0.4rem" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.3rem" }}>
        <span style={{ fontFamily: C.disp, fontSize: "1.75rem", fontWeight: 700, color: color ?? C.text, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontFamily: C.mono, fontSize: "0.7rem", color: C.dim }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontFamily: C.mono, fontSize: "0.6rem", color: C.muted, marginTop: "0.3rem" }}>{sub}</div>}
    </div>
  );
}

function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: 4, background: "oklch(0.22 0.025 245)", borderRadius: 2, overflow: "hidden", marginTop: 6 }}>
      <div style={{ height: "100%", width: `${Math.min(100, pct)}%`, background: color, borderRadius: 2, transition: "width 0.5s ease" }} />
    </div>
  );
}

function Overview() {
  const { metrics, frames } = useMission();

  const trend = useMemo(() => {
    const ordered = [...frames].reverse();
    const out: { t: number; saved: number; relevance: number }[] = [];
    for (let i = 0; i < ordered.length; i += 5) {
      const g = ordered.slice(i, i + 5);
      const raw = g.reduce((s, f) => s + f.rawSizeKB, 0);
      const dl  = g.reduce((s, f) => s + f.transmittedSizeKB, 0);
      const rel = g.reduce((s, f) => s + f.relevance, 0) / g.length;
      out.push({ t: i, saved: raw ? +(100 * (1 - dl / raw)).toFixed(1) : 0, relevance: +rel.toFixed(1) });
    }
    return out;
  }, [frames]);

  const pie = [
    { name: "TRANSMIT", value: metrics.transmitted, color: "var(--color-tier-transmit)" },
    { name: "COMPRESS", value: metrics.compressed,  color: "var(--color-tier-compress)" },
    { name: "STORE",    value: metrics.stored,       color: "var(--color-tier-store)"   },
    { name: "DISCARD",  value: metrics.discarded,    color: "var(--color-tier-discard)" },
  ];

  const tt = { background: "oklch(0.14 0.022 250)", border: `1px solid ${C.border}`, fontSize: 11, fontFamily: C.mono, borderRadius: 6 };

  const transmitPct = metrics.processed ? +(metrics.transmitted / metrics.processed * 100).toFixed(1) : 0;
  const compressPct = metrics.processed ? +(metrics.compressed  / metrics.processed * 100).toFixed(1) : 0;
  const storePct    = metrics.processed ? +(metrics.stored      / metrics.processed * 100).toFixed(1) : 0;
  const discardPct  = metrics.processed ? +(metrics.discarded   / metrics.processed * 100).toFixed(1) : 0;

  return (
    <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* ROW 1 — Primary KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
        <KPI label="Frames Captured" value={metrics.processed} color={C.blue} sub={`${metrics.processed > 0 ? "● ACQUIRING" : "○ STANDBY"}`} />
        <KPI label="Downlink Reduced" value={metrics.bandwidthSavingsPct} unit="%" color={C.green} sub={`${fmtKB(metrics.rawKB - metrics.downlinkKB)} saved`} />
        <KPI label="AI Accuracy" value={`${(metrics.accuracy * 100).toFixed(1)}`} unit="%" color={C.green} sub="ResNet18 · EuroSAT test" />
        <KPI label="Decision Time" value={metrics.avgLatencyMs.toFixed(2)} unit="ms" color={C.blue} sub="per frame · onboard AI" />
      </div>

      {/* ROW 2 — Decision breakdown + Chart */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0.75rem" }}>

        {/* Decision breakdown */}
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: "0.5rem", padding: "1rem" }}>
          <div style={{ fontFamily: C.mono, fontSize: "0.6rem", letterSpacing: "0.14em", color: C.muted, textTransform: "uppercase", marginBottom: "1rem" }}>
            Decision Breakdown · {metrics.processed} frames
          </div>
          {[
            { label: "TRANSMIT", count: metrics.transmitted, pct: transmitPct, color: "var(--color-tier-transmit)" },
            { label: "COMPRESS", count: metrics.compressed,  pct: compressPct, color: "var(--color-tier-compress)" },
            { label: "STORE",    count: metrics.stored,      pct: storePct,    color: "var(--color-tier-store)"   },
            { label: "DISCARD",  count: metrics.discarded,   pct: discardPct,  color: "var(--color-tier-discard)" },
          ].map(d => (
            <div key={d.label} style={{ marginBottom: "0.875rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: C.mono, fontSize: "0.68rem" }}>
                <span style={{ color: d.color, fontWeight: 600, letterSpacing: "0.06em" }}>{d.label}</span>
                <span style={{ color: C.sub }}>{d.count} <span style={{ color: C.muted }}>({d.pct}%)</span></span>
              </div>
              <MiniBar pct={d.pct} color={d.color} />
            </div>
          ))}
          <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: `1px solid ${C.border}`, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <div>
              <div style={{ fontFamily: C.mono, fontSize: "0.58rem", color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Avg Relevance</div>
              <div style={{ fontFamily: C.disp, fontSize: "1.1rem", fontWeight: 700, color: C.text }}>{metrics.avgRelevance}<span style={{ fontSize: "0.65rem", color: C.muted, fontFamily: C.mono }}>/100</span></div>
            </div>
            <div>
              <div style={{ fontFamily: C.mono, fontSize: "0.58rem", color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Data Reduction</div>
              <div style={{ fontFamily: C.disp, fontSize: "1.1rem", fontWeight: 700, color: C.amber }}>{metrics.dataReductionPct}<span style={{ fontSize: "0.65rem", color: C.muted, fontFamily: C.mono }}>%</span></div>
            </div>
          </div>
        </div>

        {/* Downlink chart */}
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: "0.5rem", padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div style={{ fontFamily: C.mono, fontSize: "0.6rem", letterSpacing: "0.14em", color: C.muted, textTransform: "uppercase" }}>Downlink Efficiency · Live</div>
            <div style={{ display: "flex", gap: "1rem" }}>
              {[{ label: "BW Saved", color: C.green }, { label: "Avg Relevance", color: C.blue }].map(l => (
                <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: C.mono, fontSize: "0.62rem", color: C.sub }}>
                  <span style={{ width: 12, height: 2, background: l.color, display: "inline-block", borderRadius: 1 }} />{l.label}
                </span>
              ))}
            </div>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer>
              <AreaChart data={trend} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.green} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={C.green} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.blue} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={C.blue} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(0.22 0.025 245 / 40%)" strokeDasharray="2 6" />
                <XAxis dataKey="t" stroke={C.muted} fontSize={9} fontFamily={C.mono} tickLine={false} axisLine={false} />
                <YAxis stroke={C.muted} fontSize={9} fontFamily={C.mono} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tt} cursor={{ stroke: `${C.blue}44` }} />
                <Area dataKey="saved"     stroke={C.green} fill="url(#g1)" strokeWidth={1.5} name="BW Saved %" dot={false} />
                <Area dataKey="relevance" stroke={C.blue}  fill="url(#g2)" strokeWidth={1.5} name="Avg Relevance" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ROW 3 — Payload specs + Recent captures */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>

        {/* Payload spec grid — numbers only, zero prose */}
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: "0.5rem", padding: "1rem" }}>
          <div style={{ fontFamily: C.mono, fontSize: "0.6rem", letterSpacing: "0.14em", color: C.muted, textTransform: "uppercase", marginBottom: "0.875rem" }}>
            Payload Specifications
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            {[
              { k: "CLASSIFIER",    v: "ResNet18",        sub: "Transfer Learning" },
              { k: "DATASET",       v: "EuroSAT RGB",     sub: "27,000 images · 10 classes" },
              { k: "TEST ACCURACY", v: "97.19%",          sub: "4,050-image held-out split" },
              { k: "LATENCY",       v: "0.16 ms",         sub: "per frame · GPU inference" },
              { k: "POWER BUDGET",  v: "≤ 4W",            sub: "2U CubeSat · ISSSP spec" },
              { k: "UPLINK LIMIT",  v: "50 B/s",          sub: "60 KB max file size" },
              { k: "DOWNLINK",      v: "3 Mbps",          sub: "8-min AOS window" },
              { k: "DECISION TIERS",v: "4",               sub: "configurable live" },
            ].map(s => (
              <div key={s.k} style={{
                background: "oklch(0.15 0.02 250 / 60%)",
                border: `1px solid ${C.border}`,
                borderRadius: "0.375rem",
                padding: "0.5rem 0.625rem",
              }}>
                <div style={{ fontFamily: C.mono, fontSize: "0.55rem", letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", marginBottom: "0.2rem" }}>{s.k}</div>
                <div style={{ fontFamily: C.disp, fontSize: "0.95rem", fontWeight: 700, color: C.text }}>{s.v}</div>
                <div style={{ fontFamily: C.mono, fontSize: "0.6rem", color: C.muted, marginTop: "0.1rem" }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent captures */}
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: "0.5rem", padding: "1rem" }}>
          <div style={{ fontFamily: C.mono, fontSize: "0.6rem", letterSpacing: "0.14em", color: C.muted, textTransform: "uppercase", marginBottom: "0.875rem" }}>
            Recent Captures · Last 10 Frames
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            {frames.slice(0, 10).map((f) => (
              <div key={f.id} style={{
                display: "grid",
                gridTemplateColumns: "32px 52px 1fr 36px 90px",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.3rem 0.5rem",
                borderRadius: "0.25rem",
                background: "oklch(0.15 0.02 250 / 40%)",
              }}>
                {(f as any).imagePath ? (
                  <img src={(f as any).imagePath} alt={f.sceneClass}
                    style={{ width: 28, height: 28, borderRadius: 3, objectFit: "cover", border: `1px solid ${DECISION_COLOR[f.decision]}` }}
                    onError={(e) => { e.currentTarget.style.display = "none"; }} />
                ) : (
                  <span style={{ width: 28, height: 28, borderRadius: 3, display: "block", background: `hsl(${f.thumbHue} 45% 28%)`, border: `1px solid ${DECISION_COLOR[f.decision]}` }} />
                )}
                <span style={{ fontFamily: C.mono, fontSize: "0.62rem", color: C.muted }}>{f.id}</span>
                <span style={{ fontFamily: C.mono, fontSize: "0.72rem", color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.sceneClass}</span>
                <span style={{ fontFamily: C.mono, fontSize: "0.72rem", color: C.sub, textAlign: "right" }}>{f.relevance}</span>
                <DecisionBadge d={f.decision} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}