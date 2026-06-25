import { createFileRoute } from "@tanstack/react-router";
import { useMission } from "@/hooks/use-mission";
import { Panel, Stat, DecisionBadge } from "@/components/panel";
import { fmtKB } from "@/lib/simulation";
import { useMemo } from "react";

export const Route = createFileRoute("/queue")({
  head: () => ({ meta: [{ title: "Transmission Queue — ORBITAL-AI" }] }),
  component: Queue,
});

// Simulated ground station contact window: 8 minutes @ ~2.5 Mbit/s downlink
const DOWNLINK_KBPS = 2500 / 8 * 1024 / 1024; // ~320 KB/s
const WINDOW_SEC = 8 * 60;
const WINDOW_BUDGET_KB = DOWNLINK_KBPS * WINDOW_SEC;

function Queue() {
  const { frames } = useMission();

  const queue = useMemo(() => {
    return frames
      .filter(f => f.decision === "TRANSMIT" || f.decision === "COMPRESS")
      .sort((a, b) => b.relevance - a.relevance);
  }, [frames]);

  const totalKB = queue.reduce((s, f) => s + f.transmittedSizeKB, 0);
  const utilization = Math.min(100, (totalKB / WINDOW_BUDGET_KB) * 100);

  let cum = 0;
  const annotated = queue.map((f) => {
    cum += f.transmittedSizeKB;
    return { ...f, cumKB: cum, willSend: cum <= WINDOW_BUDGET_KB };
  });

  const willSendCount = annotated.filter(a => a.willSend).length;

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Queued Frames" value={queue.length} tone="info" />
        <Stat label="Queue Volume" value={fmtKB(totalKB)} />
        <Stat label="Contact Budget" value={fmtKB(WINDOW_BUDGET_KB)} hint="8 min @ 2.5 Mbit/s" />
        <Stat label="Will Downlink" value={willSendCount} unit={`/ ${queue.length}`}
          tone={utilization > 95 ? "warn" : "good"} />
      </div>

      <Panel title="AOS Window Utilization" subtitle={`Next ground-station pass · ${utilization.toFixed(1)}%`}>
        <div className="h-3 rounded bg-secondary overflow-hidden">
          <div
            className="h-full transition-all"
            style={{
              width: `${utilization}%`,
              background: utilization > 95
                ? "var(--color-status-critical)"
                : "linear-gradient(90deg, var(--color-chart-3), var(--color-chart-1))",
            }}
          />
        </div>
      </Panel>

      <Panel title="Priority Queue" subtitle="Sorted by onboard relevance score">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                {["#","ID","Scene","Score","Decision","Size","Cumulative","Status"].map(h =>
                  <th key={h} className="text-left font-medium px-2 py-2">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {annotated.slice(0, 80).map((f, i) => (
                <tr key={f.id} className="border-b border-border/40 hover:bg-accent/10">
                  <td className="px-2 py-1.5 text-muted-foreground">{i + 1}</td>
                  <td className="px-2 py-1.5">{f.id}</td>
                  <td className="px-2 py-1.5">{f.sceneClass}</td>
                  <td className="px-2 py-1.5 tabular-nums font-semibold">{f.relevance}</td>
                  <td className="px-2 py-1.5"><DecisionBadge d={f.decision} /></td>
                  <td className="px-2 py-1.5 tabular-nums">{fmtKB(f.transmittedSizeKB)}</td>
                  <td className="px-2 py-1.5 tabular-nums text-muted-foreground">{fmtKB(f.cumKB)}</td>
                  <td className="px-2 py-1.5">
                    {f.willSend
                      ? <span className="text-status-nominal">● SCHEDULED</span>
                      : <span className="text-status-warn">◌ DEFERRED</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
