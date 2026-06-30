import { createFileRoute } from "@tanstack/react-router";
import { useMission } from "@/hooks/use-mission";
import { DecisionBadge } from "@/components/panel";
import { fmtKB } from "@/lib/simulation";
import { useMemo } from "react";

export const Route = createFileRoute("/queue")({
  head: () => ({ meta: [{ title: "Transmission Queue — ORACLE" }] }),
  component: Queue,
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

// ISSSP Technical Requirements Appendix 5
// Download speed: 3 Mbps = 375 KB/s
// AOS window: 8 minutes
const DOWNLINK_KBS     = 375;
const WINDOW_SEC       = 8 * 60;
const WINDOW_BUDGET_KB = DOWNLINK_KBS * WINDOW_SEC; // 180,000 KB

function KPI({ label, value, unit, sub, color }: {
  label: string; value: string | number; unit?: string; sub?: string; color?: string;
}) {
  return (
    <div style={{
      background: C.panel, border: `1px solid ${C.border}`,
      borderTop: `2px solid ${color ?? C.blue}`,
      borderRadius: "0.5rem", padding: "0.875rem 1rem",
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

function Queue() {
  const { frames } = useMission();

  const queue = useMemo(() => {
    const seen = new Map<string, typeof frames[0]>();
    for (const f of frames) {
      if (!seen.has(f.id) || f.relevance > seen.get(f.id)!.relevance)
        seen.set(f.id, f);
    }
    return [...seen.values()]
      .filter(f => f.decision === "TRANSMIT" || f.decision === "COMPRESS")
      .sort((a, b) => b.relevance - a.relevance);
  }, [frames]);

  const totalKB     = queue.reduce((s, f) => s + f.transmittedSizeKB, 0);
  const utilization = Math.min(100, (totalKB / WINDOW_BUDGET_KB) * 100);
  const isOverBudget = utilization >= 100;

  let cum = 0;
  const annotated = queue.map(f => {
    cum += f.transmittedSizeKB;
    return { ...f, cumKB: cum, willSend: cum <= WINDOW_BUDGET_KB };
  });

  const scheduled = annotated.filter(a => a.willSend).length;
  const deferred  = annotated.length - scheduled;
  const budgetUsedKB = Math.min(totalKB, WINDOW_BUDGET_KB);
  const budgetPct = utilization.toFixed(1);

  return (
    <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
        <KPI label="Queued for Downlink" value={queue.length}          color={C.blue}  sub="TRANSMIT + COMPRESS frames" />
        <KPI label="Queue Volume"        value={fmtKB(totalKB)}        color={C.amber} sub="total pending data" />
        <KPI label="AOS Budget"          value={fmtKB(WINDOW_BUDGET_KB)} color={C.green} sub="8 min @ 3 Mbps · ISSSP spec" />
        <KPI label="Will Downlink"       value={`${scheduled} / ${queue.length}`}
          color={isOverBudget ? C.amber : C.green}
          sub={deferred > 0 ? `${deferred} deferred to next pass` : "all frames fit"} />
      </div>

      {/* AOS window visualizer */}
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: "0.5rem", padding: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.625rem" }}>
          <div style={{ fontFamily: C.mono, fontSize: "0.6rem", letterSpacing: "0.14em", color: C.muted, textTransform: "uppercase" }}>
            AOS Window Utilization · Next Ground Station Pass
          </div>
          <div style={{ display: "flex", gap: "2rem", fontFamily: C.mono, fontSize: "0.68rem" }}>
            <span style={{ color: C.muted }}>USED <span style={{ color: isOverBudget ? C.amber : C.green, fontWeight: 700 }}>{fmtKB(budgetUsedKB)}</span></span>
            <span style={{ color: C.muted }}>BUDGET <span style={{ color: C.text, fontWeight: 700 }}>{fmtKB(WINDOW_BUDGET_KB)}</span></span>
            <span style={{ color: C.muted }}>UTIL <span style={{ color: isOverBudget ? C.amber : C.green, fontWeight: 700 }}>{budgetPct}%</span></span>
          </div>
        </div>

        {/* Segmented bar */}
        <div style={{ height: 12, background: "oklch(0.20 0.022 245)", borderRadius: 6, overflow: "hidden", position: "relative" }}>
          {/* Scheduled portion */}
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0,
            width: `${Math.min(100, (annotated.filter(a => a.willSend).reduce((s, f) => s + f.transmittedSizeKB, 0) / WINDOW_BUDGET_KB) * 100)}%`,
            background: `linear-gradient(90deg, ${C.blue}, ${C.green})`,
            transition: "width 0.5s ease",
          }} />
          {/* Over-budget portion */}
          {isOverBudget && (
            <div style={{
              position: "absolute", right: 0, top: 0, bottom: 0,
              width: `${Math.min(30, ((totalKB - WINDOW_BUDGET_KB) / WINDOW_BUDGET_KB) * 100)}%`,
              background: C.amber, opacity: 0.7,
            }} />
          )}
        </div>

        {/* Budget markers */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.4rem", fontFamily: C.mono, fontSize: "0.6rem", color: C.muted }}>
          <span>0 KB</span>
          <span style={{ color: C.blue }}>50 MB</span>
          <span style={{ color: C.blue }}>100 MB</span>
          <span style={{ color: C.blue }}>150 MB</span>
          <span style={{ color: C.text }}>175 MB</span>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", marginTop: "0.875rem", paddingTop: "0.75rem", borderTop: `1px solid ${C.border}` }}>
          {[
            { label: "SCHEDULED",  value: scheduled,            color: C.green },
            { label: "DEFERRED",   value: deferred,             color: C.amber },
            { label: "DOWNLINK RATE", value: "3 Mbps",          color: C.blue  },
            { label: "WINDOW",     value: "8 min",              color: C.sub   },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: C.mono, fontSize: "0.55rem", letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase" }}>{s.label}</div>
              <div style={{ fontFamily: C.disp, fontSize: "1.1rem", fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Priority queue table */}
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: "0.5rem", padding: "1rem", flex: 1 }}>
        <div style={{ fontFamily: C.mono, fontSize: "0.6rem", letterSpacing: "0.14em", color: C.muted, textTransform: "uppercase", marginBottom: "0.75rem" }}>
          Priority Queue · Ranked by Relevance Score · {queue.length} Frames
        </div>
        <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "calc(100vh - 480px)" }}>
          <table style={{ width: "100%", fontFamily: C.mono, fontSize: "0.7rem", borderCollapse: "collapse" }}>
            <thead style={{ position: "sticky", top: 0, background: C.panel, zIndex: 1 }}>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["#", "ID", "Scene", "Score", "Decision", "Size", "Cumulative", "Status"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "0.4rem 0.5rem", color: C.muted, fontWeight: 500, fontSize: "0.6rem", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {annotated.slice(0, 100).map((f, i) => (
                <tr key={f.id} style={{
                  borderBottom: `1px solid oklch(0.20 0.022 245 / 35%)`,
                  background: !f.willSend ? "oklch(0.15 0.02 245 / 40%)" : i % 2 === 0 ? "transparent" : "oklch(0.15 0.02 250 / 20%)",
                  opacity: f.willSend ? 1 : 0.5,
                }}>
                  <td style={{ padding: "0.35rem 0.5rem", color: C.muted }}>{i + 1}</td>
                  <td style={{ padding: "0.35rem 0.5rem", color: C.sub, whiteSpace: "nowrap" }}>{f.id}</td>
                  <td style={{ padding: "0.35rem 0.5rem", color: C.text, whiteSpace: "nowrap" }}>{f.sceneClass}</td>
                  <td style={{ padding: "0.35rem 0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 36, height: 4, background: "oklch(0.22 0.025 245)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${f.relevance}%`, background: f.relevance > 80 ? C.green : C.amber, borderRadius: 2 }} />
                      </div>
                      <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700, color: C.text }}>{f.relevance}</span>
                    </div>
                  </td>
                  <td style={{ padding: "0.35rem 0.5rem" }}><DecisionBadge d={f.decision} /></td>
                  <td style={{ padding: "0.35rem 0.5rem", fontVariantNumeric: "tabular-nums", color: C.sub, whiteSpace: "nowrap" }}>{fmtKB(f.transmittedSizeKB)}</td>
                  <td style={{ padding: "0.35rem 0.5rem", fontVariantNumeric: "tabular-nums", color: C.muted, whiteSpace: "nowrap" }}>{fmtKB(f.cumKB)}</td>
                  <td style={{ padding: "0.35rem 0.5rem", whiteSpace: "nowrap" }}>
                    {f.willSend
                      ? <span style={{ color: C.green, fontSize: "0.65rem", letterSpacing: "0.06em" }}>● SCHEDULED</span>
                      : <span style={{ color: C.muted, fontSize: "0.65rem", letterSpacing: "0.06em" }}>◌ DEFERRED</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}