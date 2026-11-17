"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  BombSceneArt,
  ComicCutoutFrame,
  ComicLeftPanel,
  ComicStageFrame,
  ComicSticker,
} from "@/components/comic-shell";
import { SoundToggle } from "@/components/sound-toggle";
import { StatusBadge } from "@/components/status-badge";
import { rankPlayers } from "@/lib/game-rules";
import { playSoundEffect } from "@/lib/sound-effects";
import { useSessionRealtime } from "@/lib/use-session-realtime";
import type { PlayerRow, SessionMeResponse } from "@/types/game";

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
      <ComicStageFrame bannerTitle="Run Summary">
        <div className="rounded-2xl bg-bg-primary border border-border-ash p-8 text-center">
          <p className="text-base text-text-muted">Loading your run summary...</p>
        </div>
      </ComicStageFrame>
    );
  }

  if (!livePlayer) {
    return (
      <ComicStageFrame bannerTitle="No Active Run">
        <div className="rounded-2xl bg-bg-primary border border-border-ash p-6 sm:p-8 text-center space-y-5">
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
        </div>
      </ComicStageFrame>
    );
  }

  const completed = livePlayer.status === "completed";

  const statCards = [
    {
      label: "Final Score",
      value: String(livePlayer.score),
      tone: "text-accent-orange",
    },
    {
      label: "Current Rank",
      value: rankInfo ? `#${rankInfo.rank} / ${rankInfo.total}` : "—",
      tone: "text-info-blue",
    },
    {
      label: "Correct / Wrong",
      value: `${livePlayer.correct_count} / ${livePlayer.wrong_count}`,
      tone: "text-text-primary",
      split: {
        correct: livePlayer.correct_count,
        wrong: livePlayer.wrong_count,
      },
    },
    {
      label: "Best Streak",
      value: String(livePlayer.best_streak),
      tone: "text-accent-yellow",
    },
  ];

  return (
    <ComicStageFrame
      bannerTitle={completed ? "You Beat the Bomb!" : "BOOM!"}
      bannerTone={completed ? "green" : "red"}
      rightSlot={
        <>
          <StatusBadge status={livePlayer.status} />
          <SoundToggle />
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <ComicLeftPanel className="md:col-span-5">
          <ComicCutoutFrame>
            <motion.div
              initial={prefersReducedMotion ? false : { scale: 0.72 }}
              animate={{ scale: 1 }}
              transition={{
                duration: prefersReducedMotion ? 0.01 : 0.28,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <BombSceneArt variant={completed ? "victory" : "boom"} />
            </motion.div>
          </ComicCutoutFrame>

          <div className="flex flex-wrap items-center gap-2.5">
            <ComicSticker tone={completed ? "green" : "red"} tilt="left">
              {completed ? "BOMB DEFUSED" : "FUSE EXPIRED"}
            </ComicSticker>
            <ComicSticker tone="yellow" tilt="right">
              {livePlayer.name}
            </ComicSticker>
          </div>

          <div className="rounded-2xl bg-surface border border-border-ash p-4">
            <p className="text-sm sm:text-base text-text-primary leading-relaxed">
              {completed
                ? `Incredible run, ${livePlayer.name} — you answered every active question.`
                : `Time ran out for ${livePlayer.name}. One try per session!`}
            </p>
          </div>
        </ComicLeftPanel>

        <div className="md:col-span-7 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {statCards.map((card, idx) => (
              <motion.div
                key={card.label}
                initial={prefersReducedMotion ? false : { y: 8 }}
                animate={{ y: 0 }}
                transition={{
                  duration: prefersReducedMotion ? 0.01 : 0.2,
                  delay: prefersReducedMotion ? 0 : idx * 0.04,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="rounded-2xl bg-bg-primary border-2 border-border-ash p-4"
              >
                <p className="text-xs font-semibold text-text-muted">{card.label}</p>
                {card.split ? (
                  <p className="font-display font-bold tabular-nums text-2xl sm:text-3xl text-text-primary mt-1">
                    <span className="text-success-green">{card.split.correct}</span>
                    {" / "}
                    <span className="text-danger-red">{card.split.wrong}</span>
                  </p>
                ) : (
                  <p
                    className={`font-display font-bold tabular-nums text-2xl sm:text-3xl mt-1 ${card.tone}`}
                  >
                    {card.value}
                  </p>
                )}
              </motion.div>
            ))}
          </div>

          <Link
            href="/scoreboard"
            className="min-h-12 w-full rounded-2xl bg-accent-orange text-bg-primary font-display font-bold text-lg px-6 flex items-center justify-center transition-transform active:scale-[0.99] hover:brightness-105"
          >
            Watch Live Scoreboard
          </Link>
        </div>
      </div>
    </ComicStageFrame>
  );
}
