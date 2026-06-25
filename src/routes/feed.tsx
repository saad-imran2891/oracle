import { createFileRoute } from "@tanstack/react-router";
import { useMission } from "@/hooks/use-mission";
import { Panel, DecisionBadge } from "@/components/panel";
import { fmtKB, DECISION_COLOR } from "@/lib/simulation";
import { useState } from "react";

export const Route = createFileRoute("/feed")({
  head: () => ({ meta: [{ title: "Live Satellite Feed — ORBITAL-AI" }] }),
  component: Feed,
});

function Feed() {
  const { frames } = useMission();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = frames.find(f => f.id === selectedId) ?? frames[0];

  return (
    <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Panel title="Capture Stream" subtitle="2 Hz · ResNet18 inference on EuroSAT Sentinel-2" className="lg:col-span-2">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
          {frames.map((f) => {
            const active = selected?.id === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setSelectedId(f.id)}
                className="group relative aspect-square overflow-hidden rounded border text-left"
                style={{
                  borderColor: active
                    ? "var(--color-primary)"
                    : DECISION_COLOR[f.decision],
                  borderWidth: active ? "2px" : "1px",
                }}
              >
                {/* Real EuroSAT satellite image */}
                {(f as any).imagePath ? (
                  <img
                    src={(f as any).imagePath}
                    alt={f.sceneClass}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      // Fallback to gradient if image fails to load
                      const el = e.currentTarget;
                      el.style.display = "none";
                      if (el.parentElement) {
                        el.parentElement.style.background =
                          `linear-gradient(135deg, hsl(${f.thumbHue} 45% 30%), hsl(${(f.thumbHue + 40) % 360} 55% 18%))`;
                      }
                    }}
                  />
                ) : (
                  // Fallback gradient if no imagePath
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(135deg, hsl(${f.thumbHue} 45% 30%), hsl(${(f.thumbHue + 40) % 360} 55% 18%))`,
                    }}
                  />
                )}

                {/* Cloud overlay */}
                {f.cloudCover > 0.2 && (
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `radial-gradient(circle at 50% 30%, oklch(0.95 0.01 220 / ${f.cloudCover * 0.6}) 0%, transparent 70%)`,
                    }}
                  />
                )}

                {/* Decision dot */}
                <span
                  className="absolute top-1 left-1 h-2 w-2 rounded-full shadow"
                  style={{ background: DECISION_COLOR[f.decision] }}
                />

                {/* Frame ID */}
                <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-[9px] font-mono text-white/90 px-1 py-0.5 truncate">
                  {f.id}
                </span>
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel title="Frame Inspector" subtitle={selected?.id ?? "—"}>
        {selected && (
          <div className="space-y-3">
            {/* Large preview */}
            <div className="relative aspect-square rounded border border-border overflow-hidden bg-black">
              {(selected as any).imagePath ? (
                <img
                  src={(selected as any).imagePath}
                  alt={selected.sceneClass}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const el = e.currentTarget;
                    el.style.display = "none";
                    if (el.parentElement) {
                      el.parentElement.style.background =
                        `linear-gradient(135deg, hsl(${selected.thumbHue} 45% 30%), hsl(${(selected.thumbHue + 40) % 360} 55% 18%))`;
                    }
                  }}
                />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, hsl(${selected.thumbHue} 45% 30%), hsl(${(selected.thumbHue + 40) % 360} 55% 18%))`,
                  }}
                />
              )}

              {/* Overlay info */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
              <div className="absolute top-2 left-2 right-2 flex justify-between text-[10px] font-mono text-white">
                <span>{selected.lat.toFixed(2)}° {selected.lon.toFixed(2)}°</span>
                <DecisionBadge d={selected.decision} />
              </div>
              <div className="absolute bottom-2 left-2 right-2 text-[10px] font-mono text-white">
                <div className="font-bold">SCENE · {selected.sceneClass}</div>
                <div>RELEVANCE · {selected.relevance}/100</div>
                <div>CONFIDENCE · {((selected as any).confidence * 100).toFixed(1)}%</div>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-1.5 text-xs font-mono">
              <Row k="Scene"         v={selected.sceneClass} />
              <Row k="Cloud cover"   v={`${(selected.cloudCover * 100).toFixed(0)} %`} />
              <Row k="Object density" v={(selected.objectDensity).toFixed(2)} />
              <Row k="Novelty"       v={(selected.novelty).toFixed(2)} />
              <Row k="Raw size"      v={fmtKB(selected.rawSizeKB)} />
              <Row k="Downlink"      v={fmtKB(selected.transmittedSizeKB)} />
              <Row k="Latency"       v={`${selected.latencyMs} ms`} />
              <Row k="Orbit T+"      v={`${selected.orbitSec}s`} />
            </dl>
          </div>
        )}
      </Panel>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-border/40 py-1">
      <span className="text-muted-foreground">{k}</span>
      <span>{v}</span>
    </div>
  );
}