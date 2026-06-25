import { createFileRoute } from "@tanstack/react-router";
import { useMission } from "@/hooks/use-mission";
import { Panel, Stat } from "@/components/panel";
import { fmtKB } from "@/lib/simulation";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line,
} from "recharts";
import { useMemo } from "react";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — ORBITAL-AI" }] }),
  component: Analytics,
});

function Analytics() {
  const { frames, metrics } = useMission();

  const byScene = useMemo(() => {
    const m = new Map<string, { scene: string; count: number; avgScore: number; saved: number; raw: number; dl: number }>();
    for (const f of frames) {
      const e = m.get(f.sceneClass) ?? { scene: f.sceneClass, count: 0, avgScore: 0, saved: 0, raw: 0, dl: 0 };
      e.count += 1; e.avgScore += f.relevance; e.raw += f.rawSizeKB; e.dl += f.transmittedSizeKB;
      m.set(f.sceneClass, e);
    }
    return [...m.values()].map(e => ({
      ...e, avgScore: +(e.avgScore / e.count).toFixed(1),
      saved: e.raw ? +(100 * (1 - e.dl / e.raw)).toFixed(1) : 0,
    })).sort((a, b) => b.count - a.count);
  }, [frames]);

  const latencyTrend = useMemo(() => {
    return [...frames].reverse().slice(-60).map((f, i) => ({ i, ms: f.latencyMs }));
  }, [frames]);

  const radar = [
    { k: "Accuracy", v: metrics.accuracy * 100 },
    { k: "Precision", v: metrics.precision * 100 },
    { k: "Recall", v: metrics.recall * 100 },
    { k: "F1", v: metrics.f1 * 100 },
    { k: "Data Red.", v: metrics.dataReductionPct },
    { k: "BW Saved", v: metrics.bandwidthSavingsPct },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Accuracy" value={(metrics.accuracy * 100).toFixed(1)} unit="%" tone="good" />
        <Stat label="Precision" value={(metrics.precision * 100).toFixed(1)} unit="%" tone="info" />
        <Stat label="Recall" value={(metrics.recall * 100).toFixed(1)} unit="%" tone="info" />
        <Stat label="F1 Score" value={metrics.f1.toFixed(3)} tone="good" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Capture Distribution by Scene Class" className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={byScene}>
                <CartesianGrid stroke="var(--color-grid)" strokeDasharray="2 4" />
                <XAxis dataKey="scene" stroke="var(--color-muted-foreground)" fontSize={10} angle={-20} textAnchor="end" height={60} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={10} />
                <Tooltip contentStyle={{ background: "var(--color-panel)", border: "1px solid var(--color-border)", fontSize: 12 }} />
                <Bar dataKey="count" fill="var(--color-chart-1)" name="Frames" radius={[4,4,0,0]} />
                <Bar dataKey="avgScore" fill="var(--color-chart-2)" name="Avg score" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Model Quality">
          <div className="h-72">
            <ResponsiveContainer>
              <RadarChart data={radar}>
                <PolarGrid stroke="var(--color-grid)" />
                <PolarAngleAxis dataKey="k" stroke="var(--color-muted-foreground)" fontSize={10} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="var(--color-grid)" fontSize={9} />
                <Radar dataKey="v" stroke="var(--color-chart-3)" fill="var(--color-chart-3)" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Inference Latency (last 60 frames)">
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={latencyTrend}>
                <CartesianGrid stroke="var(--color-grid)" strokeDasharray="2 4" />
                <XAxis dataKey="i" stroke="var(--color-muted-foreground)" fontSize={10} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={10} unit="ms" />
                <Tooltip contentStyle={{ background: "var(--color-panel)", border: "1px solid var(--color-border)", fontSize: 12 }} />
                <Line dataKey="ms" stroke="var(--color-chart-2)" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Per-Class Downlink Savings">
          <table className="w-full text-xs font-mono">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                {["Scene","Frames","Avg Score","Raw","Downlink","Saved"].map(h =>
                  <th key={h} className="text-left font-medium px-2 py-2">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {byScene.map(s => (
                <tr key={s.scene} className="border-b border-border/40">
                  <td className="px-2 py-1.5">{s.scene}</td>
                  <td className="px-2 py-1.5 tabular-nums">{s.count}</td>
                  <td className="px-2 py-1.5 tabular-nums">{s.avgScore}</td>
                  <td className="px-2 py-1.5 tabular-nums text-muted-foreground">{fmtKB(s.raw)}</td>
                  <td className="px-2 py-1.5 tabular-nums">{fmtKB(s.dl)}</td>
                  <td className="px-2 py-1.5 tabular-nums text-status-nominal">{s.saved}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
