import { useSyncExternalStore, useMemo } from "react";
import { missionStore } from "@/lib/mission-store";
import { computeMetrics } from "@/lib/simulation";

export function useMission() {
  const state = useSyncExternalStore(
    missionStore.subscribe,
    missionStore.getSnapshot,
    missionStore.getServerSnapshot,
  );
  const metrics = useMemo(() => computeMetrics(state.frames), [state.frames]);
  return { ...state, metrics, store: missionStore };
}
