"use client";

import { useEffect, useRef } from "react";
import { GAME_CONFIG } from "@/config/game-config";

function formatClock(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export interface BombTimerProps {
  deadlineIso: string;
  serverOffsetMs: number;
  onExpire: () => void;
}

/** 60fps ref-driven bomb fuse timer synced to the authoritative server deadline. */
export function BombTimer({
  deadlineIso,
  serverOffsetMs,
  onExpire,
}: BombTimerProps) {
  const clockRef = useRef<HTMLSpanElement>(null);
  const fuseBarRef = useRef<HTMLDivElement>(null);
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    expiredRef.current = false;
    const deadlineMs = Date.parse(deadlineIso);
    const maxScaleMs = GAME_CONFIG.baseTimeSeconds * 1000;
    let rafId = 0;

    const tick = () => {
      const serverNowMs = Date.now() + serverOffsetMs;
      const remainingMs = Math.max(0, deadlineMs - serverNowMs);
      const remainingSeconds = Math.ceil(remainingMs / 1000);

      if (clockRef.current) {
        clockRef.current.textContent = formatClock(remainingMs);
        clockRef.current.classList.remove(
          "text-text-primary",
          "text-accent-yellow",
          "text-danger-red"
        );
        if (remainingSeconds <= 10) {
          clockRef.current.classList.add("text-danger-red");
        } else if (remainingSeconds <= 30) {
          clockRef.current.classList.add("text-accent-yellow");
        } else {
          clockRef.current.classList.add("text-text-primary");
        }
      }

      if (fuseBarRef.current) {
        const pct = Math.max(0, Math.min(100, (remainingMs / maxScaleMs) * 100));
        fuseBarRef.current.style.width = `${pct.toFixed(2)}%`;
        fuseBarRef.current.classList.remove(
          "bg-accent-orange",
          "bg-accent-yellow",
          "bg-danger-red"
        );
        if (remainingSeconds <= 10) {
          fuseBarRef.current.classList.add("bg-danger-red");
        } else if (remainingSeconds <= 30) {
          fuseBarRef.current.classList.add("bg-accent-yellow");
        } else {
          fuseBarRef.current.classList.add("bg-accent-orange");
        }
      }

      if (remainingMs <= 0) {
        if (!expiredRef.current) {
          expiredRef.current = true;
          onExpireRef.current();
        }
        return;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [deadlineIso, serverOffsetMs]);

  return (
    <div className="space-y-3" aria-label="Bomb countdown timer">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-semibold text-text-muted">Fuse remaining</span>
        <span
          ref={clockRef}
          className="font-display font-bold tabular-nums text-5xl sm:text-6xl leading-none tracking-tight text-text-primary"
        >
          2:00
        </span>
      </div>
      <div className="h-3 w-full rounded-2xl bg-surface-elevated overflow-hidden border border-border-ash">
        <div
          ref={fuseBarRef}
          className="h-full bg-accent-orange transition-colors duration-200"
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
}
