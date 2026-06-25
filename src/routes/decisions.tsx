import { createFileRoute } from "@tanstack/react-router";
import { useMission } from "@/hooks/use-mission";
import { Panel, DecisionBadge } from "@/components/panel";
import { fmtKB } from "@/lib/simulation";

export const Route = createFileRoute("/decisions")({
  head: () => ({ meta: [{ title: "AI Decisions — ORACLE" }] }),
  component: Decisions,
});

function Decisions() {
  const { frames, thresholds, store } = useMission();

  return (
    <div className="p-4 space-y-4">
      <Panel title="Decision Engine" subtitle="Configurable scoring thresholds">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Slider label="Discard ≤" value={thresholds.discard} min={0} max={60}
            onChange={(v) => store.setThresholds({ discard: v })} />
          <Slider label="Store ≤" value={thresholds.store} min={20} max={80}
            onChange={(v) => store.setThresholds({ store: v })} />
          <Slider label="Compress ≤" value={thresholds.compress} min={50} max={95}
            onChange={(v) => store.setThresholds({ compress: v })} />
          <Slider label="Cloud Veto" value={Math.round(thresholds.cloudVeto * 100)} min={50} max={100}
            onChange={(v) => store.setThresholds({ cloudVeto: v / 100 })} suffix="%" />
          <Slider label="Compress Ratio" value={Math.round(thresholds.compressionRatio * 100)} min={5} max={50}
            onChange={(v) => store.setThresholds({ compressionRatio: v / 100 })} suffix="%" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-mono text-muted-foreground">
          <Band color="var(--color-tier-discard)" label={`DISCARD 0–${thresholds.discard}`} />
          <Band color="var(--color-tier-store)" label={`STORE ${thresholds.discard + 1}–${thresholds.store}`} />
          <Band color="var(--color-tier-compress)" label={`COMPRESS ${thresholds.store + 1}–${thresholds.compress}`} />
          <Band color="var(--color-tier-transmit)" label={`TRANSMIT ${thresholds.compress + 1}–100`} />
        </div>
      </Panel>

      <Panel title="Decision Log" subtitle={`${frames.length} frames · most recent first`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                {["ID","T+","Scene","Cloud","Objects","Novelty","Score","Decision","Downlink","Latency"].map(h =>
                  <th key={h} className="text-left font-medium px-2 py-2">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {frames.slice(0, 60).map((f) => (
                <tr key={f.id} className="border-b border-border/40 hover:bg-accent/10">
                  <td className="px-2 py-1.5 text-muted-foreground">{f.id}</td>
                  <td className="px-2 py-1.5">{f.orbitSec}s</td>
                  <td className="px-2 py-1.5">{f.sceneClass}</td>
                  <td className="px-2 py-1.5 tabular-nums">{(f.cloudCover * 100).toFixed(0)}%</td>
                  <td className="px-2 py-1.5 tabular-nums">{f.objectDensity.toFixed(2)}</td>
                  <td className="px-2 py-1.5 tabular-nums">{f.novelty.toFixed(2)}</td>
                  <td className="px-2 py-1.5 tabular-nums font-semibold">{f.relevance}</td>
                  <td className="px-2 py-1.5"><DecisionBadge d={f.decision} /></td>
                  <td className="px-2 py-1.5 tabular-nums">{fmtKB(f.transmittedSizeKB)}</td>
                  <td className="px-2 py-1.5 tabular-nums">{f.latencyMs}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function Slider({ label, value, min, max, onChange, suffix }: {
  label: string; value: number; min: number; max: number;
  onChange: (v: number) => void; suffix?: string;
}) {
  return (
    <label className="block">
      <div className="flex justify-between label-mono mb-1">
        <span>{label}</span>
        <span className="text-foreground">{value}{suffix ?? ""}</span>
      </div>
      <input type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="w-full accent-[color:var(--color-primary)]" />
    </label>
  );
}

function Band({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded border border-border px-2 py-1">
      <span className="h-2 w-2 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}
