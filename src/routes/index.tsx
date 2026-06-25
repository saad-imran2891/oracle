import { createFileRoute } from "@tanstack/react-router";
import { useMission } from "@/hooks/use-mission";
import { Panel, Stat, DecisionBadge } from "@/components/panel";
import { fmtKB, DECISION_COLOR } from "@/lib/simulation";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { useMemo } from "react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Mission Overview — ORBITAL-AI" }] }),
  component: Overview,
});

function Overview() {
  const { metrics, frames } = useMission();

  const trend = useMemo(() => {
    // Bucket by 5-frame windows
    const ordered = [...frames].reverse();
    const buckets: { t: number; saved: number; relevance: number }[] = [];
    const size = 5;
    for (let i = 0; i < ordered.length; i += size) {
      const g = ordered.slice(i, i + size);
      const raw = g.reduce((s, f) => s + f.rawSizeKB, 0);
      const dl = g.reduce((s, f) => s + f.transmittedSizeKB, 0);
      const rel = g.reduce((s, f) => s + f.relevance, 0) / g.length;
      buckets.push({ t: i, saved: raw ? +(100 * (1 - dl / raw)).toFixed(1) : 0, relevance: +rel.toFixed(1) });
    }
    return buckets;
  }, [frames]);

  const pie = [
    { name: "Transmit", value: metrics.transmitted, color: "var(--color-tier-transmit)" },
    { name: "Compress", value: metrics.compressed, color: "var(--color-tier-compress)" },
    { name: "Store", value: metrics.stored, color: "var(--color-tier-store)" },
    { name: "Discard", value: metrics.discarded, color: "var(--color-tier-discard)" },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <Stat label="Images Processed" value={metrics.processed} tone="info" />
        <Stat label="Transmitted" value={metrics.transmitted} tone="good" hint={`${metrics.compressed} compressed`} />
        <Stat label="Discarded" value={metrics.discarded} tone="warn" hint={`${metrics.stored} stored onboard`} />
        <Stat label="Bandwidth Saved" value={metrics.bandwidthSavingsPct} unit="%" tone="good" />
        <Stat label="Avg Relevance" value={metrics.avgRelevance} unit="/100" />
        <Stat label="Inference Latency" value={metrics.avgLatencyMs} unit="ms" tone="info" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel title="Downlink Reduction" subtitle="Rolling window · 5-frame buckets" className="xl:col-span-2">
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-3)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="var(--color-chart-3)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-grid)" strokeDasharray="2 4" />
                <XAxis dataKey="t" stroke="var(--color-muted-foreground)" fontSize={10} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={10} />
                <Tooltip contentStyle={{ background: "var(--color-panel)", border: "1px solid var(--color-border)", fontSize: 12 }} />
                <Area dataKey="saved" stroke="var(--color-chart-3)" fill="url(#g1)" name="Bandwidth saved %" />
                <Area dataKey="relevance" stroke="var(--color-chart-1)" fill="url(#g2)" name="Avg relevance" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Decision Mix" subtitle="Current orbital pass">
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} stroke="var(--color-panel)" strokeWidth={2}>
                  {pie.map((p) => <Cell key={p.name} fill={p.color} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
                <Tooltip contentStyle={{ background: "var(--color-panel)", border: "1px solid var(--color-border)", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Mission Brief" subtitle="ISSSP 2026 · Track 2">
          <div className="space-y-3 text-sm leading-relaxed">
            <p>
              <span className="font-display font-semibold">ORBITAL-AI</span> is an onboard
              scene-relevance payload for 6U/12U CubeSats. A MobileNetV3 land-cover
              backbone and a YOLOv8n object-density head are fused into a 0–100
              relevance score, then a configurable decision engine decides whether
              each frame is <DecisionBadge d="DISCARD" />, <DecisionBadge d="STORE" />,{" "}
              <DecisionBadge d="COMPRESS" />, or <DecisionBadge d="TRANSMIT" />.
            </p>
            <p className="text-muted-foreground">
              Goal: cut downlink volume while preserving scientifically valuable imagery
              within a strict power, thermal, and radiation budget. Models export to
              ONNX for deployment on Coral / Jetson-class edge accelerators.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2 font-mono text-xs">
              <Field k="Backbone" v="MobileNetV3-Large" />
              <Field k="Detector" v="YOLOv8n (INT8)" />
              <Field k="Datasets" v="EuroSAT · BigEarthNet · UC Merced" />
              <Field k="Runtime" v="ONNX Runtime + TensorRT" />
              <Field k="Power Envelope" v="≤ 4.5 W payload" />
              <Field k="Target Latency" v="≤ 60 ms / tile" />
            </div>
          </div>
        </Panel>

        <Panel title="Recent Captures" subtitle="Latest 8 frames">
          <ul className="divide-y divide-border/60 text-sm font-mono">
            {frames.slice(0, 8).map((f) => (
              <li key={f.id} className="flex items-center gap-3 py-2">
                <span
                  className="h-6 w-6 rounded"
                  style={{ background: `hsl(${f.thumbHue} 50% 35%)`, boxShadow: `inset 0 0 0 1px ${DECISION_COLOR[f.decision]}` }}
                />
                <span className="text-muted-foreground w-20 truncate">{f.id}</span>
                <span className="flex-1 truncate">{f.sceneClass}</span>
                <span className="tabular-nums w-10 text-right">{f.relevance}</span>
                <DecisionBadge d={f.decision} />
                <span className="text-muted-foreground w-16 text-right">{fmtKB(f.transmittedSizeKB)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-border/40 py-1">
      <span className="text-muted-foreground">{k}</span><span>{v}</span>
    </div>
  );
}
