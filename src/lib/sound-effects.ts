export const SOUND_STORAGE_KEY = "boom_sound_muted";

export type SoundEffectKind = "correct" | "wrong" | "boom" | "victory";

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface AudioNodeLike {
  connect(dest: unknown): void;
}

interface AudioContextLike {
  state: string;
  currentTime: number;
  destination: unknown;
  resume(): Promise<void> | void;
  createOscillator(): AudioNodeLike & {
    type: string;
    frequency: { setValueAtTime(val: number, time: number): void };
    start(time?: number): void;
    stop(time?: number): void;
  };
  createGain(): AudioNodeLike & {
    gain: {
      setValueAtTime(val: number, time: number): void;
      exponentialRampToValueAtTime(val: number, time: number): void;
    };
  };
}

interface ToneStep {
  freq: number;
  delay: number;
  duration: number;
  type: "sine" | "triangle" | "sawtooth";
  gain: number;
}

const SOUND_PATTERNS: Record<SoundEffectKind, readonly ToneStep[]> = {
  correct: [
    { freq: 523.25, delay: 0, duration: 0.1, type: "triangle", gain: 0.14 },
    { freq: 659.25, delay: 0.08, duration: 0.14, type: "triangle", gain: 0.16 },
  ],
  wrong: [
    { freq: 220, delay: 0, duration: 0.14, type: "sawtooth", gain: 0.1 },
    { freq: 165, delay: 0.1, duration: 0.18, type: "sawtooth", gain: 0.09 },
  ],
  boom: [
    { freq: 130, delay: 0, duration: 0.25, type: "sawtooth", gain: 0.18 },
    { freq: 72, delay: 0.06, duration: 0.35, type: "triangle", gain: 0.2 },
  ],
  victory: [
    { freq: 523.25, delay: 0, duration: 0.1, type: "triangle", gain: 0.14 },
    { freq: 659.25, delay: 0.09, duration: 0.1, type: "triangle", gain: 0.14 },
    { freq: 783.99, delay: 0.18, duration: 0.22, type: "triangle", gain: 0.18 },
  ],
};

let sharedAudioContext: AudioContextLike | null = null;

function defaultStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function defaultCreateContext(): AudioContextLike | null {
  if (typeof window === "undefined") return null;
  if (sharedAudioContext) return sharedAudioContext;
  const win = window as unknown as {
    AudioContext?: new () => AudioContextLike;
    webkitAudioContext?: new () => AudioContextLike;
  };
  const Ctor = win.AudioContext ?? win.webkitAudioContext;
  if (!Ctor) return null;
  sharedAudioContext = new Ctor();
  return sharedAudioContext;
}

/** Returns whether game sound effects are muted (defaults to `false` / Sound On). */
export function getSoundMuted(
  storage: StorageLike | null = defaultStorage()
): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(SOUND_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

/** Persists mute preference to `localStorage` and notifies active toggles. */
export function setSoundMuted(
  muted: boolean,
  storage: StorageLike | null = defaultStorage()
): void {
  if (!storage) return;
  try {
    storage.setItem(SOUND_STORAGE_KEY, muted ? "true" : "false");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("boom-sound-change"));
    }
  } catch {
    // Ignore storage errors in restricted browsing contexts
  }
}

/** Plays a lightweight Web Audio cue unless muted or unsupported. */
export function playSoundEffect(
  kind: SoundEffectKind,
  options?: {
    muted?: boolean;
    createContext?: () => AudioContextLike | null;
  }
): boolean {
  const muted = options?.muted ?? getSoundMuted();
  if (muted) return false;

  const ctx = (options?.createContext ?? defaultCreateContext)();
  if (!ctx) return false;

  try {
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    const base = ctx.currentTime;
    for (const step of SOUND_PATTERNS[kind]) {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = step.type;
      osc.frequency.setValueAtTime(step.freq, base + step.delay);
      gainNode.gain.setValueAtTime(step.gain, base + step.delay);
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        base + step.delay + step.duration
      );
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(base + step.delay);
      osc.stop(base + step.delay + step.duration);
    }
    return true;
  } catch {
    return false;
  }
}
