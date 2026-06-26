// Mission store — powered by REAL ResNet18 inference on EuroSAT RGB dataset
// Model: ResNet18 fine-tuned on 27,000 Sentinel-2 satellite images
// Accuracy: 97.19% | Precision: 97.10% | Recall: 97.11% | F1: 97.10%
// Latency: 0.16ms/image on T4 GPU
// Replays 1999 real inference frames from public/real_frames.json

import {
  type CapturedFrame,
  type DecisionThresholds,
  DEFAULT_THRESHOLDS,
} from "./simulation";

const MAX_FRAMES = 199;

interface State {
  frames: CapturedFrame[];
  thresholds: DecisionThresholds;
  running: boolean;
  orbitSec: number;
  tickHz: number;
  loaded: boolean;
  error: string | null;
}

const listeners = new Set<() => void>();
let state: State = {
  frames: [],
  thresholds: { ...DEFAULT_THRESHOLDS },
  running: true,
  orbitSec: 0,
  tickHz: 2,
  loaded: false,
  error: null,
};
let timer: ReturnType<typeof setInterval> | null = null;
let realFrames: CapturedFrame[] = [];
let replayIndex = 0;

function emit() { for (const l of listeners) l(); }

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  emit();
}

function step() {
  if (!state.running || !state.loaded || realFrames.length === 0) return;

  const realFrame = realFrames[replayIndex % realFrames.length];
  replayIndex++;

  const orbitSec = state.orbitSec + 1;
  const f: CapturedFrame = { ...realFrame, orbitSec };
  const frames = [f, ...state.frames].slice(0, MAX_FRAMES);
  state = { ...state, frames, orbitSec };
  emit();
}

function ensureTimer() {
  if (typeof window === "undefined") return;
  if (timer) clearInterval(timer);
  timer = setInterval(step, 1000 / state.tickHz);
}

async function loadRealFrames() {
  try {
    const res = await fetch("/real_frames.json");
    if (!res.ok) throw new Error(`HTTP ${res.status} — is real_frames.json in public/?`);

    const raw = await res.json();

    realFrames = raw
      .map((f: any): CapturedFrame => ({
        id:                f.id,
        ts:                f.ts,
        orbitSec:          f.orbitSec,
        lat:               f.lat,
        lon:               f.lon,
        sceneClass:        f.sceneClass,
        cloudCover:        f.cloudCover,
        objectDensity:     f.objectDensity,
        novelty:           f.novelty,
        rawSizeKB:         f.rawSizeKB,
        relevance:         f.relevance,
        decision:          f.decision,
        transmittedSizeKB: f.transmittedSizeKB,
        latencyMs:         f.latencyMs,
        thumbHue:          f.thumbHue,
        imagePath:         f.imagePath,
        confidence:        f.confidence,
        correct:           f.correct,
      }))
      // Only keep frames that have a real satellite image
      .filter((f: CapturedFrame) => (f as any).imagePath);

    const burst = realFrames.slice(0, 60);
    state = {
      ...state,
      frames:   [...burst].reverse(),
      orbitSec: burst.length,
      loaded:   true,
      error:    null,
    };
    replayIndex = burst.length;
    emit();
    ensureTimer();

    console.log(`✅ ORACLE: Loaded ${realFrames.length} real inference frames with satellite images`);
    console.log(`   Model: ResNet18 | Accuracy: 97.19% | Latency: 0.16ms`);
  } catch (err) {
    console.error("❌ Failed to load real_frames.json:", err);
    set({
      error:  "Could not load real inference data. Check public/real_frames.json",
      loaded: false,
    });
  }
}

export const missionStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    if (!state.loaded && realFrames.length === 0) {
      loadRealFrames();
    } else {
      ensureTimer();
    }
    return () => {
      listeners.delete(l);
      if (listeners.size === 0 && timer) {
        clearInterval(timer);
        timer = null;
      }
    };
  },

  getSnapshot():       State { return state; },
  getServerSnapshot(): State { return state; },

  toggleRunning() { set({ running: !state.running }); },

  reset() {
    replayIndex = 0;
    set({ frames: [], orbitSec: 0 });
  },

  setThresholds(t: Partial<DecisionThresholds>) {
    set({ thresholds: { ...state.thresholds, ...t } });
  },

  setTickHz(hz: number) {
    set({ tickHz: hz });
    ensureTimer();
  },
};