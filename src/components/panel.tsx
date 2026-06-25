import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Panel({
  title, subtitle, action, children, className,
}: {
  title?: string; subtitle?: string; action?: ReactNode;
  children: ReactNode; className?: string;
}) {
  return (
    <section className={cn("panel relative overflow-hidden", className)}>
      {(title || action) && (
        <header className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-border/60">
          <div>
            {title && <h3 className="text-sm font-semibold tracking-wide font-display">{title}</h3>}
            {subtitle && <p className="label-mono mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Stat({
  label, value, unit, hint, tone = "default",
}: {
  label: string; value: string | number; unit?: string; hint?: string;
  tone?: "default" | "good" | "warn" | "bad" | "info";
}) {
  const toneClass = {
    default: "text-foreground",
    good: "text-status-nominal",
    warn: "text-status-warn",
    bad: "text-status-critical",
    info: "text-status-info",
  }[tone];
  return (
    <div className="panel px-4 py-3">
      <div className="label-mono">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className={cn("text-2xl font-display font-semibold tabular-nums", toneClass)}>{value}</span>
        {unit && <span className="text-xs text-muted-foreground font-mono">{unit}</span>}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function DecisionBadge({ d }: { d: "DISCARD" | "STORE" | "COMPRESS" | "TRANSMIT" }) {
  const map = {
    DISCARD: "bg-tier-discard/15 text-tier-discard border-tier-discard/40",
    STORE: "bg-tier-store/15 text-tier-store border-tier-store/40",
    COMPRESS: "bg-tier-compress/15 text-tier-compress border-tier-compress/40",
    TRANSMIT: "bg-tier-transmit/15 text-tier-transmit border-tier-transmit/40",
  } as const;
  return (
    <span className={cn(
      "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-mono tracking-wider",
      map[d],
    )}>{d}</span>
  );
}
