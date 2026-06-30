import { createFileRoute } from "@tanstack/react-router";
import { useMission } from "@/hooks/use-mission";
import { useMemo } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid, LineChart, Line,
} from "recharts";

export const Route = createFileRoute("/system")({
  head: () => ({ meta: [{ title: "System Performance — ORACLE" }] }),
  component: System,
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

function Gauge({ label, value, unit, max, color, warning, critical }: {
  label: string; value: number; unit: string; max: number;
  color: string; warning: number; critical: number;
}) {
  const pct = Math.min(100, (value / max) * 100);
  const c = value >= critical ? C.red : value >= warning ? C.amber : color;
  return (
    <div style={{
      background: C.panel, border: `1px solid ${C.border}`,
      borderTop: `2px solid ${c}`,
      borderRadius: "0.5rem", padding: "1rem",
    }}>
      <div style={{ fontFamily: C.mono, fontSize: "0.58rem", letterSpacing: "0.14em", color: C.muted, textTransform: "uppercase", marginBottom: "0.5rem" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem", marginBottom: "0.625rem" }}>
        <span style={{ fontFamily: C.disp, fontSize: "2rem", fontWeight: 700, color: c, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{value}</span>
        <span style={{ fontFamily: C.mono, fontSize: "0.72rem", color: C.dim }}>{unit}</span>
      </div>
      <div style={{ height: 6, background: "oklch(0.20 0.022 245)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: c, borderRadius: 3, transition: "width 0.5s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.3rem", fontFamily: C.mono, fontSize: "0.58rem", color: C.muted }}>
        <span>0{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

function System() {
  const { frames, metrics, tickHz, store } = useMission();

  const telemetry = useMemo(() => {
    return [...frames].reverse().slice(-80).map((f, i) => {
      const load = Math.min(1, 0.30 + f.objectDensity * 0.45 + f.latencyMs / 500);
      return {
        i,
        cpu:    +Math.min(95, Math.max(12, load * 88 + Math.sin(i * 0.3) * 4)).toFixed(1),
        npu:    +Math.min(98, Math.max(18, load * 92 + Math.sin(i * 0.5) * 3)).toFixed(1),
        powerW: +(2.2 + load * 1.6 + Math.sin(i * 0.4) * 0.1).toFixed(2),
        tempC:  +(24 + load * 14 + i * 0.015).toFixed(1),
      };
    });
  }, [frames]);

  const last = telemetry[telemetry.length - 1] ?? { cpu: 0, npu: 0, powerW: 0, tempC: 0 };
  const tt = { background: "oklch(0.14 0.022 250)", border: `1px solid ${C.border}`, fontSize: 11, fontFamily: C.mono, borderRadius: 6 };

  return (
    <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* Hardware gauges */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
        <Gauge label="Payload Power"  value={last.powerW} unit="W"  max={4}   color={C.green} warning={3.6} critical={3.9} />
        <Gauge label="NPU Load"       value={last.npu}    unit="%"  max={100} color={C.blue}  warning={85}  critical={95}  />
        <Gauge label="OBC Temp"       value={last.tempC}  unit="°C" max={65}  color={C.green} warning={55}  critical={62}  />
        <div style={{
          background: C.panel, border: `1px solid ${C.border}`,
          borderTop: `2px solid ${C.blue}`,
          borderRadius: "0.5rem", padding: "1rem",
        }}>
          <div style={{ fontFamily: C.mono, fontSize: "0.58rem", letterSpacing: "0.14em", color: C.muted, textTransform: "uppercase", marginBottom: "0.5rem" }}>Capture Rate</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem", marginBottom: "0.875rem" }}>
            <span style={{ fontFamily: C.disp, fontSize: "2rem", fontWeight: 700, color: C.blue, lineHeight: 1 }}>{tickHz}</span>
            <span style={{ fontFamily: C.mono, fontSize: "0.72rem", color: C.dim }}>Hz</span>
          </div>
          <input type="range" min={1} max={5} step={1} value={tickHz}
            onChange={(e) => store.setTickHz(+e.target.value)}
            style={{ width: "100%", accentColor: C.blue, marginBottom: "0.3rem" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: C.mono, fontSize: "0.58rem", color: C.muted }}>
            <span>1 Hz</span><span>3 Hz</span><span>5 Hz</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>

        {/* Compute */}
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: "0.5rem", padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div style={{ fontFamily: C.mono, fontSize: "0.6rem", letterSpacing: "0.14em", color: C.muted, textTransform: "uppercase" }}>Compute Utilization</div>
            <div style={{ display: "flex", gap: "1rem" }}>
              {[{ label: "CPU", color: C.blue }, { label: "NPU", color: C.green }].map(l => (
                <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: C.mono, fontSize: "0.62rem", color: C.sub }}>
                  <span style={{ width: 12, height: 2, background: l.color, display: "inline-block", borderRadius: 1 }} />{l.label}
                </span>
              ))}
            </div>
          </div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer>
              <AreaChart data={telemetry} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="cpu-g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.blue}  stopOpacity={0.4} />
                    <stop offset="95%" stopColor={C.blue}  stopOpacity={0}   />
                  </linearGradient>
                  <linearGradient id="npu-g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.green} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={C.green} stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(0.22 0.025 245 / 40%)" strokeDasharray="2 6" />
                <XAxis dataKey="i" stroke={C.muted} fontSize={9} fontFamily={C.mono} tickLine={false} axisLine={false} />
                <YAxis stroke={C.muted} fontSize={9} fontFamily={C.mono} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
                <Tooltip contentStyle={tt} />
                <Area dataKey="cpu" stroke={C.blue}  fill="url(#cpu-g)" strokeWidth={1.5} name="CPU %" dot={false} />
                <Area dataKey="npu" stroke={C.green} fill="url(#npu-g)" strokeWidth={1.5} name="NPU %" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Power & Thermal */}
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: "0.5rem", padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div style={{ fontFamily: C.mono, fontSize: "0.6rem", letterSpacing: "0.14em", color: C.muted, textTransform: "uppercase" }}>Power & Thermal</div>
            <div style={{ display: "flex", gap: "1rem" }}>
              {[{ label: "Power (W)", color: C.amber }, { label: "Temp (°C)", color: C.red }].map(l => (
                <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: C.mono, fontSize: "0.62rem", color: C.sub }}>
                  <span style={{ width: 12, height: 2, background: l.color, display: "inline-block", borderRadius: 1 }} />{l.label}
                </span>
              ))}
            </div>
          </div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer>
              <LineChart data={telemetry} margin={{ top: 4, right: 16, bottom: 0, left: -10 }}>
                <CartesianGrid stroke="oklch(0.22 0.025 245 / 40%)" strokeDasharray="2 6" />
                <XAxis dataKey="i" stroke={C.muted} fontSize={9} fontFamily={C.mono} tickLine={false} axisLine={false} />
                <YAxis yAxisId="l" stroke={C.muted} fontSize={9} fontFamily={C.mono} tickLine={false} axisLine={false} unit="W" domain={[0, 5]} />
                <YAxis yAxisId="r" orientation="right" stroke={C.muted} fontSize={9} fontFamily={C.mono} tickLine={false} axisLine={false} unit="°C" domain={[20, 65]} />
                <Tooltip contentStyle={tt} />
                <Line yAxisId="l" dataKey="powerW" stroke={C.amber} dot={false} strokeWidth={1.5} name="Power (W)" />
                <Line yAxisId="r" dataKey="tempC"  stroke={C.red}   dot={false} strokeWidth={1.5} name="Temp (°C)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CubeSat spec grid — numbers only */}
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: "0.5rem", padding: "1rem" }}>
        <div style={{ fontFamily: C.mono, fontSize: "0.6rem", letterSpacing: "0.14em", color: C.muted, textTransform: "uppercase", marginBottom: "0.875rem" }}>
          CubeSat Design Envelope · ISSSP 2026 Appendix 5
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
          {[
            { k: "FORM FACTOR",     v: "2U CubeSat",      sub: "20×10×10 cm · max 3.6 kg" },
            { k: "POWER BUDGET",    v: "≤ 4W avg",        sub: "2W per 1U · 28VDC/30W ext" },
            { k: "PEAK POWER",      v: "3.6W",            sub: `${last.powerW}W current · margin OK` },
            { k: "UPLINK LIMIT",    v: "50 B/sec",        sub: "60 KB max file · primary constraint" },
            { k: "DOWNLINK",        v: "3 Mbps",          sub: "8-min AOS · 175 MB budget" },
            { k: "THERMAL LIMIT",   v: "65°C hard",       sub: `${last.tempC}°C current · throttle >60°C` },
            { k: "INFERENCE",       v: "0.16 ms",         sub: "per frame · ResNet18 GPU" },
            { k: "BW REDUCTION",    v: `${metrics.bandwidthSavingsPct}%`, sub: "live · session average" },
            { k: "FRAMES TOTAL",    v: `${metrics.processed}`, sub: `${metrics.discarded} discarded · ${metrics.stored} stored` },
          ].map(s => (
            <div key={s.k} style={{
              background: "oklch(0.15 0.02 250 / 60%)",
              border: `1px solid ${C.border}`,
              borderRadius: "0.375rem",
              padding: "0.625rem 0.75rem",
            }}>
              <div style={{ fontFamily: C.mono, fontSize: "0.55rem", letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase", marginBottom: "0.2rem" }}>{s.k}</div>
              <div style={{ fontFamily: C.disp, fontSize: "1.05rem", fontWeight: 700, color: C.text }}>{s.v}</div>
              <div style={{ fontFamily: C.mono, fontSize: "0.6rem", color: C.muted, marginTop: "0.15rem" }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}