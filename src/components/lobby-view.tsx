"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  BombSceneArt,
  ComicCutoutFrame,
  ComicLeftPanel,
  ComicStageFrame,
  ComicSticker,
} from "@/components/comic-shell";
import { StatusBadge } from "@/components/status-badge";
import { useSessionRealtime } from "@/lib/use-session-realtime";
import type { PlayerRow, SessionMeResponse } from "@/types/game";

export function LobbyView() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [me, setMe] = useState<PlayerRow | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [countdownDisplay, setCountdownDisplay] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    async function loadMe() {
      try {
        const res = await fetch("/api/session/me", { cache: "no-store" });
        if (!res.ok) {
          router.replace("/");
          return;
        }
        const data = (await res.json()) as SessionMeResponse;
        if (!active) return;

        setServerOffsetMs(Date.parse(data.serverNow) - Date.now());

        if (!data.player) {
          router.replace("/");
          return;
        }
        if (data.player.status === "playing") {
          router.replace("/play");
          return;
        }
        if (data.player.status === "exploded" || data.player.status === "completed") {
          router.replace("/result");
          return;
        }

        setMe(data.player);
        setSessionId(data.player.session_id);
      } finally {
        if (active) setAuthLoaded(true);
      }
    }

    void loadMe();
    return () => {
      active = false;
    };
  }, [router]);

  const { session, players, loading, error } = useSessionRealtime(sessionId);

  // Redirect if kicked or session reset
  useEffect(() => {
    if (!authLoaded || loading || !me) return;
    const stillInSession = players.some((p) => p.id === me.id);
    if (!stillInSession) {
      router.replace("/");
      return;
    }
    const mine = players.find((p) => p.id === me.id);
    if (mine?.status === "playing") {
      router.replace("/play");
    } else if (mine?.status === "exploded" || mine?.status === "completed") {
      router.replace("/result");
    }
  }, [authLoaded, loading, me, players, router]);

  // Synchronized 3-2-1 countdown when host starts session
  useEffect(() => {
    if (!session) return;
    if (session.status === "running") {
      router.replace("/play");
      return;
    }
    if (session.status === "finished") {
      router.replace("/result");
      return;
    }
    if (session.status !== "countdown" || !session.started_at) {
      return;
    }

    const startMs = Date.parse(session.started_at);
    const update = () => {
      const remainingMs = startMs - (Date.now() + serverOffsetMs);
      if (remainingMs <= 0) {
        setCountdownDisplay(0);
        router.replace("/play");
        return false;
      }
      setCountdownDisplay(Math.ceil(remainingMs / 1000));
      return true;
    };

    if (!update()) return;
    const intervalId = window.setInterval(() => {
      if (!update()) {
        window.clearInterval(intervalId);
      }
    }, 100);

    return () => window.clearInterval(intervalId);
  }, [session, serverOffsetMs, router]);

  async function handleLeaveLobby() {
    if (leaving) return;
    setLeaving(true);
    try {
      const res = await fetch("/api/session/me", { method: "DELETE" });
      if (res.ok) {
        router.replace("/");
        router.refresh();
      }
    } finally {
      setLeaving(false);
    }
  }

  if (!authLoaded || (loading && players.length === 0)) {
    return (
      <ComicStageFrame bannerTitle="Waiting Lobby" maxWidthClass="max-w-4xl">
        <div className="rounded-2xl bg-bg-primary border border-border-ash p-8 text-center">
          <p className="text-base text-text-muted">Connecting to waiting lobby...</p>
        </div>
      </ComicStageFrame>
    );
  }

  const isCountdown =
    session?.status === "countdown" &&
    Boolean(session.started_at) &&
    countdownDisplay !== null;

  return (
    <ComicStageFrame
      bannerTitle="Waiting Lobby"
      bannerTone="default"
      rightSlot={
        <>
          {session ? <StatusBadge status={session.status} /> : null}
          {me ? (
            <ComicSticker tone="orange" tilt="right">
              {me.name}
            </ComicSticker>
          ) : null}
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        <ComicLeftPanel className="md:col-span-5">
          {isCountdown && countdownDisplay !== null ? (
            <ComicCutoutFrame innerClassName="p-6 text-center space-y-2">
              <p className="text-sm font-semibold text-accent-yellow">
                Get ready — bomb fuse arms in
              </p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={countdownDisplay}
                  role="status"
                  aria-live="assertive"
                  initial={
                    prefersReducedMotion
                      ? false
                      : { scale: 1.32, rotate: -3 }
                  }
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    duration: prefersReducedMotion ? 0.01 : 0.18,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="font-display font-bold tabular-nums text-6xl sm:text-7xl text-accent-orange"
                >
                  {countdownDisplay > 0 ? countdownDisplay : "GO!"}
                </motion.p>
              </AnimatePresence>
            </ComicCutoutFrame>
          ) : (
            <ComicCutoutFrame>
              <BombSceneArt variant="lobby" />
            </ComicCutoutFrame>
          )}

          <div className="rounded-2xl bg-surface border border-border-ash p-4 text-sm text-text-primary leading-relaxed">
            {session?.lobby_locked
              ? "Lobby is locked. Everyone starts the exact moment the facilitator clicks Start."
              : "Stay on this screen. Everyone launches together when the facilitator starts the clock."}
          </div>

          {session?.status === "waiting" ? (
            <button
              type="button"
              disabled={leaving}
              onClick={() => void handleLeaveLobby()}
              className="min-h-12 w-full rounded-2xl bg-surface-elevated border border-border-ash px-4 text-sm font-bold text-text-primary hover:border-danger-red hover:text-danger-red disabled:opacity-60 cursor-pointer"
            >
              {leaving ? "Leaving lobby..." : "Leave Lobby"}
            </button>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm pt-1 border-t border-border-ash">
            <Link
              href="/scoreboard"
              className="min-h-12 inline-flex items-center text-info-blue font-bold hover:underline"
            >
              View Scoreboard
            </Link>
            <Link
              href="/admin"
              className="min-h-12 inline-flex items-center text-text-muted font-bold hover:text-text-primary"
            >
              Facilitator Login
            </Link>
          </div>
        </ComicLeftPanel>

        <div className="md:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-text-primary">Cadets in Lobby</h2>
            <ComicSticker tone="yellow" tilt="right">
              {players.length} READY
            </ComicSticker>
          </div>

          {error ? (
            <p role="alert" className="text-sm font-semibold text-danger-red">
              {error}
            </p>
          ) : null}

          {players.length === 0 ? (
            <div className="rounded-2xl bg-bg-primary border border-border-ash p-6 text-center">
              <p className="text-sm text-text-muted">Waiting for cadets to join...</p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {players.map((player) => {
                const isMe = me?.id === player.id;
                return (
                  <motion.li
                    key={player.id}
                    layout={!prefersReducedMotion ? "position" : false}
                    initial={prefersReducedMotion ? false : { scale: 0.96, y: 6 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ duration: prefersReducedMotion ? 0.01 : 0.18 }}
                    className={`min-h-12 rounded-2xl px-4 py-2.5 flex items-center justify-between border-2 ${
                      isMe
                        ? "bg-surface-elevated border-accent-orange text-text-primary"
                        : "bg-bg-primary border-border-ash text-text-primary"
                    }`}
                  >
                    <span className="font-bold truncate">{player.name}</span>
                    {isMe ? (
                      <span className="text-xs font-display font-bold text-accent-orange shrink-0 ml-2 uppercase">
                        You
                      </span>
                    ) : null}
                  </motion.li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </ComicStageFrame>
  );
}
