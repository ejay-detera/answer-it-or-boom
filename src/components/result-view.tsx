"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { SoundToggle } from "@/components/sound-toggle";
import { StatusBadge } from "@/components/status-badge";
import { rankPlayers } from "@/lib/game-rules";
import { playSoundEffect } from "@/lib/sound-effects";
import { useSessionRealtime } from "@/lib/use-session-realtime";
import type { PlayerRow, SessionMeResponse } from "@/types/game";

function ResultIllustration({ completed }: { completed: boolean }) {
  if (completed) {
    return (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <circle cx="32" cy="32" r="24" fill="#2A2F40" stroke="#2EE59D" strokeWidth="3" />
        <path
          d="M21 33L29 41L44 24"
          stroke="#2EE59D"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path
        d="M32 6L37.5 19.5L51.5 14L44 27L58 34L43.5 39L48 53L35 45L26 57L25 42L10 43L19 31L8 21L23 21L21 7L32 16V6Z"
        fill="#2A2F40"
        stroke="#FF3B4E"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ResultView() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const soundPlayedRef = useRef(false);
  const [me, setMe] = useState<PlayerRow | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadMe() {
      try {
        const res = await fetch("/api/session/me", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as SessionMeResponse;
        if (!active) return;

        if (!data.player) {
          setMe(null);
          setSessionId(data.session?.id ?? null);
          return;
        }
        if (data.player.status === "waiting") {
          router.replace("/lobby");
          return;
        }
        if (data.player.status === "playing") {
          router.replace("/play");
          return;
        }
        setMe(data.player);
        setSessionId(data.player.session_id);
      } finally {
        if (active) setLoaded(true);
      }
    }

    void loadMe();
    return () => {
      active = false;
    };
  }, [router]);

  const { session, players } = useSessionRealtime(sessionId);

  const livePlayer = useMemo(() => {
    if (!me) return null;
    return players.find((p) => p.id === me.id) ?? me;
  }, [me, players]);

  const rankInfo = useMemo(() => {
    if (!livePlayer || players.length === 0) return null;
    const ranked = rankPlayers(players, session?.started_at ?? null);
    const idx = ranked.findIndex((p) => p.id === livePlayer.id);
    if (idx === -1) return null;
    return { rank: idx + 1, total: ranked.length };
  }, [livePlayer, players, session]);

  useEffect(() => {
    if (!loaded || !livePlayer || soundPlayedRef.current) return;
    soundPlayedRef.current = true;
    playSoundEffect(livePlayer.status === "completed" ? "victory" : "boom");
  }, [loaded, livePlayer]);

  if (!loaded) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <section className="w-full max-w-lg rounded-3xl bg-surface border border-border-ash p-6 sm:p-8 text-center">
          <p className="text-base text-text-muted">Loading your run summary...</p>
        </section>
      </main>
    );
  }

  if (!livePlayer) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <section className="w-full max-w-lg rounded-3xl bg-surface border border-border-ash p-6 sm:p-8 text-center space-y-5">
          <h1 className="text-3xl font-bold text-text-primary">No active run</h1>
          <p className="text-base text-text-muted">
            No completed run was found, or the facilitator reset the session for a new round.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="min-h-12 rounded-2xl bg-accent-orange text-bg-primary font-display font-bold px-6 inline-flex items-center justify-center"
            >
              Join Session
            </Link>
            <Link
              href="/scoreboard"
              className="min-h-12 rounded-2xl bg-surface-elevated border border-border-ash text-text-primary font-display font-bold px-6 inline-flex items-center justify-center"
            >
              View Scoreboard
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const completed = livePlayer.status === "completed";

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-lg rounded-3xl bg-surface border border-border-ash p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <StatusBadge status={livePlayer.status} />
          <SoundToggle />
        </div>

        <div className="flex flex-col items-center text-center space-y-3">
          <motion.div
            initial={prefersReducedMotion ? false : { scale: 0.78, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: prefersReducedMotion ? 0.01 : 0.28, ease: "easeOut" }}
          >
            <ResultIllustration completed={completed} />
          </motion.div>
          <h1
            className={`text-4xl sm:text-5xl font-bold ${
              completed ? "text-success-green" : "text-danger-red"
            }`}
          >
            {completed ? "You beat the bomb!" : "BOOM!"}
          </h1>
          <p className="text-base text-text-muted">
            {completed
              ? `Incredible run, ${livePlayer.name} — you answered every active question.`
              : `Time ran out for ${livePlayer.name}. One try per session!`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-surface-elevated border border-border-ash p-4">
            <p className="text-xs font-semibold text-text-muted">Final Score</p>
            <p className="font-display font-bold tabular-nums text-3xl text-accent-orange mt-1">
              {livePlayer.score}
            </p>
          </div>
          <div className="rounded-2xl bg-surface-elevated border border-border-ash p-4">
            <p className="text-xs font-semibold text-text-muted">Current Rank</p>
            <p className="font-display font-bold tabular-nums text-3xl text-info-blue mt-1">
              {rankInfo ? `#${rankInfo.rank} / ${rankInfo.total}` : "—"}
            </p>
          </div>
          <div className="rounded-2xl bg-surface-elevated border border-border-ash p-4">
            <p className="text-xs font-semibold text-text-muted">Correct / Wrong</p>
            <p className="font-display font-bold tabular-nums text-2xl text-text-primary mt-1">
              <span className="text-success-green">{livePlayer.correct_count}</span>
              {" / "}
              <span className="text-danger-red">{livePlayer.wrong_count}</span>
            </p>
          </div>
          <div className="rounded-2xl bg-surface-elevated border border-border-ash p-4">
            <p className="text-xs font-semibold text-text-muted">Best Streak</p>
            <p className="font-display font-bold tabular-nums text-2xl text-accent-yellow mt-1">
              {livePlayer.best_streak}
            </p>
          </div>
        </div>

        <Link
          href="/scoreboard"
          className="min-h-12 w-full rounded-2xl bg-accent-orange text-bg-primary font-display font-bold text-lg px-6 flex items-center justify-center hover:brightness-105"
        >
          Watch Live Scoreboard
        </Link>
      </section>
    </main>
  );
}
