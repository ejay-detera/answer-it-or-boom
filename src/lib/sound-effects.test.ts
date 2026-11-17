import { describe, expect, it, vi } from "vitest";
import {
  getSoundMuted,
  playSoundEffect,
  setSoundMuted,
  SOUND_STORAGE_KEY,
} from "@/lib/sound-effects";

describe("sound-effects (BOOM-06 / US-08)", () => {
  it("defaults to unmuted (sound on) and persists toggle state safely", () => {
    const store = new Map<string, string>();
    const mockStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
    };

    expect(getSoundMuted(mockStorage)).toBe(false);
    setSoundMuted(true, mockStorage);
    expect(store.get(SOUND_STORAGE_KEY)).toBe("true");
    expect(getSoundMuted(mockStorage)).toBe(true);

    setSoundMuted(false, mockStorage);
    expect(getSoundMuted(mockStorage)).toBe(false);
    expect(getSoundMuted(null)).toBe(false);
  });

  it("no-ops when muted or AudioContext is unavailable, and plays oscillator cues when enabled", () => {
    const start = vi.fn();
    const stop = vi.fn();
    const connect = vi.fn();
    const setValueAtTime = vi.fn();
    const exponentialRampToValueAtTime = vi.fn();

    const mockCtx = {
      state: "running",
      currentTime: 0,
      destination: {},
      resume: vi.fn(),
      createOscillator: () => ({
        type: "sine",
        frequency: { setValueAtTime },
        connect,
        start,
        stop,
      }),
      createGain: () => ({
        gain: { setValueAtTime, exponentialRampToValueAtTime },
        connect,
      }),
    };

    expect(playSoundEffect("correct", { muted: true, createContext: () => mockCtx })).toBe(
      false
    );
    expect(start).not.toHaveBeenCalled();

    expect(playSoundEffect("correct", { muted: false, createContext: () => null })).toBe(
      false
    );

    expect(playSoundEffect("correct", { muted: false, createContext: () => mockCtx })).toBe(
      true
    );
    expect(start).toHaveBeenCalled();
    expect(stop).toHaveBeenCalled();
  });
});
