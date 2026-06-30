import { createFileRoute } from "@tanstack/react-router";
import { useMission } from "@/hooks/use-mission";
import { fmtKB } from "@/lib/simulation";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, Cell,
} from "recharts";
import { useMemo } from "react";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — ORACLE" }] }),
  component: Analytics,
});

const C = {
  green:  "oklch(0.78 0.17 155)",
  blue:   "oklch(0.72 0.18 220)",
  amber:  "oklch(0.82 0.16 75)",
  dim:    "oklch(0.50 0.02 230)",
  muted:  "oklch(0.38 0.02 230)",
  text:   "oklch(0.94 0.015 220)",
  sub:    "oklch(0.65 0.02 230)",
  panel:  "oklch(0.17 0.024 250)",
  border: "oklch(0.26 0.03 245 / 55%)",
  mono:   "var(--font-mono)",
  disp:   "var(--font-display)",
};

const SCENE_COLORS: Record<string, string> = {
  AnnualCrop:           "#3b82f6",
  Forest:               "#22c55e",
  HerbaceousVegetation: "#16a34a",
  Highway:              "#eab308",
  Industrial:           "#ef4444",
  Pasture:              "#84cc16",
  PermanentCrop:        "#f97316",
  Residential:          "#a855f7",
  River:                "#06b6d4",
  SeaLake:              "#0ea5e9",
};

const PER_CLASS = [
  { scene: "SeaLake",               precision: 99.51, recall: 99.26, f1: 99.38 },
  { scene: "Residential",           precision: 99.33, recall: 98.44, f1: 98.88 },
  { scene: "Forest",                precision: 99.09, recall: 98.64, f1: 98.87 },
  { scene: "Industrial",            precision: 97.65, recall: 98.94, f1: 98.29 },
  { scene: "AnnualCrop",            precision: 96.42, recall: 97.03, f1: 96.73 },
  { scene: "HerbaceousVegetation",  precision: 95.93, recall: 97.82, f1: 96.86 },
  { scene: "PermanentCrop",         precision: 96.77, recall: 94.72, f1: 95.73 },
  { scene: "Pasture",               precision: 94.75, recall: 96.66, f1: 95.70 },
  { scene: "Highway",               precision: 96.84, recall: 94.12, f1: 95.46 },
  { scene: "River",                 precision: 94.71, recall: 95.47, f1: 95.09 },
];

function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{ fontFamily: C.mono, fontSize: "0.6rem", letterSpacing: "0.14em", color: C.muted, textTransform: "uppercase", marginBottom: "0.75rem" }}>
      {text}
    </div>
  );
}

function Analytics() {
  const { frames, metrics } = useMission();

  const tt = { background: "oklch(0.14 0.022 250)", border: `1px solid ${C.border}`, fontSize: 11, fontFamily: C.mono, borderRadius: 6 };

  const byScene = useMemo(() => {
    const m = new Map<string, { scene: string; count: number; avgScore: number; raw: number; dl: number }>();
    for (const f of frames) {
      const e = m.get(f.sceneClass) ?? { scene: f.sceneClass, count: 0, avgScore: 0, raw: 0, dl: 0 };
      e.count++; e.avgScore += f.relevance; e.raw += f.rawSizeKB; e.dl += f.transmittedSizeKB;
      m.set(f.sceneClass, e);
    }
    return [...m.values()].map(e => ({
      ...e,
      avgScore: +(e.avgScore / e.count).toFixed(1),
      saved: e.raw ? +(100 * (1 - e.dl / e.raw)).toFixed(1) : 0,
    })).sort((a, b) => b.count - a.count);
  }, [frames]);

  const latencyTrend = useMemo(() =>
    [...frames].reverse().slice(-60).map((f, i) => ({ i, ms: f.latencyMs })),
  [frames]);

  const radar = [
    { k: "Accuracy",  v: metrics.accuracy  * 100 },
    { k: "Precision", v: metrics.precision * 100 },
    { k: "Recall",    v: metrics.recall    * 100 },
    { k: "F1 Score",  v: metrics.f1        * 100 },
    { k: "BW Saved",  v: metrics.bandwidthSavingsPct },
    { k: "Data Red.", v: metrics.dataReductionPct },
  ];

  return (
    <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* Model performance banner */}
      <div style={{
        background: "oklch(0.18 0.05 220 / 50%)",
        border: `1px solid oklch(0.40 0.12 220 / 40%)`,
        borderLeft: `3px solid ${C.blue}`,
        borderRadius: "0.5rem",
        padding: "1rem 1.25rem",
        display: "grid",
        gridTemplateColumns: "1fr auto",
        alignItems: "center",
        gap: "2rem",
      }}>
        <div>
          <div style={{ fontFamily: C.mono, fontSize: "0.58rem", letterSpacing: "0.14em", color: C.muted, textTransform: "uppercase", marginBottom: "0.3rem" }}>
            Model Evaluation · Held-out Test Split
          </div>
          <div style={{ fontFamily: C.disp, fontSize: "1rem", fontWeight: 600, color: C.text, marginBottom: "0.25rem" }}>
            ResNet18 · EuroSAT RGB · 27,000 Sentinel-2 Images
          </div>
          <div style={{ fontFamily: C.mono, fontSize: "0.68rem", color: C.sub }}>
            Train: 18,900 (70%) · Val: 4,050 (15%) · <span style={{ color: C.blue, fontWeight: 600 }}>Test: 4,050 (15%)</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "2rem", flexShrink: 0 }}>
          {[
            { label: "Accuracy",  val: `${(metrics.accuracy  * 100).toFixed(2)}%` },
            { label: "Precision", val: `${(metrics.precision * 100).toFixed(2)}%` },
            { label: "Recall",    val: `${(metrics.recall    * 100).toFixed(2)}%` },
            { label: "F1",        val: metrics.f1.toFixed(4) },
          ].map(m => (
            <div key={m.label} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: C.mono, fontSize: "0.58rem", letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase" }}>{m.label}</div>
              <div style={{ fontFamily: C.disp, fontSize: "1.25rem", fontWeight: 700, color: C.green }}>{m.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scene distribution + Radar */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "0.75rem" }}>

        {/* Horizontal bar chart — fixes diagonal label issue */}
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: "0.5rem", padding: "1rem" }}>
          <SectionLabel text="Scene Classification Distribution · Frames per Land-Use Class" />
          <div style={{ height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={byScene} layout="vertical" margin={{ left: 0, right: 24, top: 0, bottom: 0 }}>
                <CartesianGrid stroke="oklch(0.22 0.025 245 / 40%)" strokeDasharray="2 6" horizontal={false} />
                <XAxis
                  type="number"
                  stroke={C.muted} fontSize={9} fontFamily={C.mono}
                  tickLine={false} axisLine={false}
                />
                <YAxis
                  type="category" dataKey="scene"
                  stroke={C.sub} fontSize={9} fontFamily={C.mono}
                  tickLine={false} axisLine={false}
                  width={130}
                />
                <Tooltip contentStyle={tt} cursor={{ fill: "oklch(0.24 0.025 245 / 20%)" }}
                  formatter={(val, name, props) => [`${val} frames · avg score ${props.payload.avgScore}`, props.payload.scene]}
                />
                <Bar dataKey="count" name="Frames" radius={[0, 3, 3, 0]} maxBarSize={16}>
                  {byScene.map(e => <Cell key={e.scene} fill={SCENE_COLORS[e.scene] ?? C.blue} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar chart — fixed with outer labels */}
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: "0.5rem", padding: "1rem" }}>
          <SectionLabel text="System Performance Radar · Normalized to 100" />
          <div style={{ height: 280 }}>
            <ResponsiveContainer>
              <RadarChart data={radar} outerRadius="65%">
                <PolarGrid stroke="oklch(0.26 0.03 245 / 50%)" />
                <PolarAngleAxis
                  dataKey="k"
                  stroke={C.sub}
                  fontSize={10}
                  fontFamily={C.mono}
                  tick={{ fill: C.sub, fontSize: 10 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  stroke="oklch(0.26 0.03 245 / 40%)"
                  fontSize={8}
                  fontFamily={C.mono}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  dataKey="v"
                  stroke={C.blue}
                  fill={C.blue}
                  fillOpacity={0.2}
                  strokeWidth={1.5}
                />
                <Tooltip contentStyle={tt} formatter={(v: number) => [`${v.toFixed(1)}%`]} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Latency + Per-class table */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>

        {/* Latency */}
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: "0.5rem", padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
            <SectionLabel text="Inference Latency · Last 60 Frames" />
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: C.disp, fontSize: "1.4rem", fontWeight: 700, color: C.blue, lineHeight: 1 }}>
                {metrics.avgLatencyMs.toFixed(2)}<span style={{ fontSize: "0.7rem", color: C.muted, fontFamily: C.mono }}> ms</span>
              </div>
              <div style={{ fontFamily: C.mono, fontSize: "0.58rem", color: C.muted }}>avg per frame</div>
            </div>
          </div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer>
              <LineChart data={latencyTrend} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                <CartesianGrid stroke="oklch(0.22 0.025 245 / 40%)" strokeDasharray="2 6" />
                <XAxis dataKey="i" stroke={C.muted} fontSize={9} fontFamily={C.mono} tickLine={false} axisLine={false} />
                <YAxis stroke={C.muted} fontSize={9} fontFamily={C.mono} tickLine={false} axisLine={false} unit="ms" />
                <Tooltip contentStyle={tt} cursor={{ stroke: `${C.blue}44` }} />
                <Line dataKey="ms" stroke={C.amber} dot={false} strokeWidth={1.5} name="Latency" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Per-class F1 — fixed real numbers, not computed from frames */}
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: "0.5rem", padding: "1rem" }}>
          <SectionLabel text="Per-Class F1 Score · ResNet18 Test Set" />
          <div style={{ overflowY: "auto", maxHeight: 260 }}>
            {PER_CLASS.map((row) => (
              <div key={row.scene} style={{
                display: "grid",
                gridTemplateColumns: "140px 1fr 50px",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.5rem",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: SCENE_COLORS[row.scene], flexShrink: 0, display: "inline-block" }} />
                  <span style={{ fontFamily: C.mono, fontSize: "0.68rem", color: C.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.scene}</span>
                </div>
                <div style={{ height: 6, background: "oklch(0.22 0.025 245)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${row.f1}%`,
                    background: row.f1 >= 98 ? C.green : row.f1 >= 96 ? C.blue : C.amber,
                    borderRadius: 3,
                  }} />
                </div>
                <span style={{ fontFamily: C.mono, fontSize: "0.68rem", color: C.text, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                  {row.f1.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Per-class downlink savings table */}
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: "0.5rem", padding: "1rem" }}>
        <SectionLabel text="Per-Class Downlink Savings · Current Session" />
        <table style={{ width: "100%", fontFamily: C.mono, fontSize: "0.72rem", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {["Scene", "Frames", "Avg Score", "Raw Volume", "Downlinked", "Bandwidth Saved"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "0.4rem 0.75rem", color: C.muted, fontWeight: 500, letterSpacing: "0.06em", fontSize: "0.62rem" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {byScene.map((s, i) => (
              <tr key={s.scene} style={{ borderBottom: `1px solid oklch(0.22 0.025 245 / 35%)`, background: i % 2 === 0 ? "transparent" : "oklch(0.15 0.02 250 / 30%)" }}>
                <td style={{ padding: "0.4rem 0.75rem", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: SCENE_COLORS[s.scene] ?? C.blue, display: "inline-block", flexShrink: 0 }} />
                  <span style={{ color: C.text }}>{s.scene}</span>
                </td>
                <td style={{ padding: "0.4rem 0.75rem", fontVariantNumeric: "tabular-nums", color: C.sub }}>{s.count}</td>
                <td style={{ padding: "0.4rem 0.75rem", fontVariantNumeric: "tabular-nums", color: C.sub }}>{s.avgScore}</td>
                <td style={{ padding: "0.4rem 0.75rem", color: C.muted }}>{fmtKB(s.raw)}</td>
                <td style={{ padding: "0.4rem 0.75rem", color: C.sub }}>{fmtKB(s.dl)}</td>
                <td style={{ padding: "0.4rem 0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 60, height: 4, background: "oklch(0.22 0.025 245)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${s.saved}%`, background: C.green, borderRadius: 2 }} />
                    </div>
                    <span style={{ color: C.green, fontWeight: 600 }}>{s.saved}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}