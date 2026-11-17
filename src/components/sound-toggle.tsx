"use client";

import { useSyncExternalStore } from "react";
import {
  getSoundMuted,
  playSoundEffect,
  setSoundMuted,
} from "@/lib/sound-effects";

function subscribeSound(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("boom-sound-change", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("boom-sound-change", onStoreChange);
  };
}

function SpeakerGlyph({ muted }: { muted: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M11 5L6 9H3V15H6L11 19V5Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {muted ? (
        <path
          d="M16 9L21 15M21 9L16 15"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M15.5 8.5C16.8 9.8 16.8 14.2 15.5 15.5M18.5 6C21.2 8.7 21.2 15.3 18.5 18"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

/** Accessible mute toggle defaulting to Sound On (`localStorage`-persisted). */
export function SoundToggle() {
  const muted = useSyncExternalStore(
    subscribeSound,
    () => getSoundMuted(),
    () => false
  );

  function handleToggle() {
    const nextMuted = !muted;
    setSoundMuted(nextMuted);
    if (!nextMuted) {
      playSoundEffect("correct", { muted: false });
    }
  }

  return (
    <button
      type="button"
      aria-pressed={muted}
      onClick={handleToggle}
      className="min-h-12 rounded-2xl bg-surface-elevated border border-border-ash px-4 inline-flex items-center gap-2 text-sm font-bold text-text-primary hover:border-accent-orange cursor-pointer"
    >
      <SpeakerGlyph muted={muted} />
      <span>{muted ? "Muted" : "Sound On"}</span>
    </button>
  );
}
