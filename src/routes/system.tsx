import { createFileRoute } from "@tanstack/react-router";
import { useMission } from "@/hooks/use-mission";
import { Panel, Stat } from "@/components/panel";
import { useMemo } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/system")({
  head: () => ({ meta: [{ title: "System Performance — ORBITAL-AI" }] }),
  component: System,
});

function System() {
  const { frames, metrics, tickHz, store } = useMission();

  // Synthetic subsystem telemetry derived from activity
  const telemetry = useMemo(() => {
    return [...frames].reverse().slice(-80).map((f, i) => {
      const load = 0.35 + (f.objectDensity * 0.45) + (f.latencyMs - 40) / 200;
      return {
        i,
        cpu: Math.min(100, Math.max(15, +(load * 100).toFixed(1))),
        npu: Math.min(100, Math.max(20, +((load + 0.15) * 95).toFixed(1))),
        powerW: +(2.6 + load * 1.8).toFixed(2),
        tempC: +(28 + load * 12 + i * 0.02).toFixed(1),
      };
    });
  }, [frames]);

  const last = telemetry[telemetry.length - 1] ?? { cpu: 0, npu: 0, powerW: 0, tempC: 0 };

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Payload Power" value={last.powerW} unit="W" tone={last.powerW > 4.2 ? "warn" : "good"} hint="Budget 4.5 W" />
        <Stat label="NPU Load" value={last.npu} unit="%" tone={last.npu > 90 ? "warn" : "info"} />
        <Stat label="OBC Temp" value={last.tempC} unit="°C" tone={last.tempC > 55 ? "bad" : "good"} hint="Limit 65 °C" />
        <Stat label="Capture Rate" value={tickHz} unit="Hz" hint="Adjustable" />
      </div>

      <Panel title="Capture Rate" subtitle="Throttle onboard ingest">
        <input type="range" min={1} max={5} step={1} value={tickHz}
          onChange={(e) => store.setTickHz(+e.target.value)}
          className="w-full max-w-md accent-[color:var(--color-primary)]" />
        <div className="mt-1 text-xs font-mono text-muted-foreground">{tickHz} frames per second</div>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Compute Utilization">
          <div className="h-56">
            <ResponsiveContainer>
              <AreaChart data={telemetry}>
                <CartesianGrid stroke="var(--color-grid)" strokeDasharray="2 4" />
                <XAxis dataKey="i" stroke="var(--color-muted-foreground)" fontSize={10} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={10} unit="%" />
                <Tooltip contentStyle={{ background: "var(--color-panel)", border: "1px solid var(--color-border)", fontSize: 12 }} />
                <Area dataKey="cpu" stroke="var(--color-chart-1)" fill="var(--color-chart-1)" fillOpacity={0.2} name="CPU" />
                <Area dataKey="npu" stroke="var(--color-chart-2)" fill="var(--color-chart-2)" fillOpacity={0.25} name="NPU" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Power & Thermal">
          <div className="h-56">
            <ResponsiveContainer>
              <AreaChart data={telemetry}>
                <CartesianGrid stroke="var(--color-grid)" strokeDasharray="2 4" />
                <XAxis dataKey="i" stroke="var(--color-muted-foreground)" fontSize={10} />
                <YAxis yAxisId="l" stroke="var(--color-muted-foreground)" fontSize={10} unit="W" />
                <YAxis yAxisId="r" orientation="right" stroke="var(--color-muted-foreground)" fontSize={10} unit="°C" />
                <Tooltip contentStyle={{ background: "var(--color-panel)", border: "1px solid var(--color-border)", fontSize: 12 }} />
                <Area yAxisId="l" dataKey="powerW" stroke="var(--color-chart-3)" fill="var(--color-chart-3)" fillOpacity={0.2} name="Power" />
                <Area yAxisId="r" dataKey="tempC" stroke="var(--color-chart-4)" fill="var(--color-chart-4)" fillOpacity={0.15} name="Temp" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title="Aerospace Constraints" subtitle="Design envelope considered in the payload">
        <ul className="grid sm:grid-cols-2 gap-3 text-sm">
          <Item k="Power budget" v="≤ 4.5 W average, ≤ 7 W peak (during inference burst)." />
          <Item k="Radiation" v="COTS Jetson + watchdog SEU mitigation; triple-mode redundancy on decision flag." />
          <Item k="Thermal" v="Conductive coupling to chassis; throttle ingest above 60 °C OBC." />
          <Item k="Memory" v="≤ 256 MB working set; INT8 ONNX models < 12 MB combined." />
          <Item k="Latency" v="≤ 60 ms / 4096² tile to keep up with 2 Hz push-broom cadence." />
          <Item k="Reliability" v="Decision engine deterministic & overridable from ground via TC table upload." />
        </ul>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-3 text-xs font-mono">
          <Counter label="Frames" v={metrics.processed} />
          <Counter label="Discarded" v={metrics.discarded} />
          <Counter label="Stored" v={metrics.stored} />
          <Counter label="Compressed" v={metrics.compressed} />
          <Counter label="Transmitted" v={metrics.transmitted} />
        </div>
      </Panel>
    </div>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <li className="rounded border border-border bg-secondary/30 p-3">
      <div className="label-mono mb-1">{k}</div>
      <div className="text-foreground/90">{v}</div>
    </li>
  );
}
function Counter({ label, v }: { label: string; v: number }) {
  return (
    <div className="rounded border border-border p-2">
      <div className="label-mono">{label}</div>
      <div className="text-lg font-display tabular-nums">{v}</div>
    </div>
  );
}
