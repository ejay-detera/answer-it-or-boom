"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BombMark, StatusBadge } from "@/components/status-badge";
import { useSessionRealtime } from "@/lib/use-session-realtime";
import type { PlayerRow, SessionMeResponse } from "@/types/game";

export function LobbyView() {
  const router = useRouter();
  const [me, setMe] = useState<PlayerRow | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [authLoaded, setAuthLoaded] = useState(false);
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

  if (!authLoaded || (loading && players.length === 0)) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <section className="w-full max-w-lg rounded-3xl bg-surface border border-border-ash p-6 sm:p-8 text-center">
          <p className="text-base text-text-muted">Connecting to waiting lobby...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-lg rounded-3xl bg-surface border border-border-ash p-6 sm:p-8 space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <BombMark size={44} />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
                Waiting Lobby
              </h1>
              <p className="text-sm text-text-muted mt-0.5">
                {me ? `Joined as ${me.name}` : "Preparing cohort"}
              </p>
            </div>
          </div>
          {session ? <StatusBadge status={session.status} /> : null}
        </header>

        {session?.status === "countdown" && session.started_at && countdownDisplay !== null ? (
          <div
            role="status"
            aria-live="assertive"
            className="rounded-2xl bg-surface-elevated border border-border-ash p-6 text-center space-y-2"
          >
            <p className="text-sm font-semibold text-accent-yellow">
              Get ready — bomb fuse arms in
            </p>
            <p className="font-display font-bold tabular-nums text-6xl text-accent-orange">
              {countdownDisplay > 0 ? countdownDisplay : "GO!"}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-surface-elevated border border-border-ash p-4 text-sm text-text-muted">
            {session?.lobby_locked
              ? "Lobby is locked. Everyone starts the exact moment the facilitator clicks Start."
              : "Stay on this screen. Everyone launches together when the facilitator starts the clock."}
          </div>
        )}

        {error ? (
          <p role="alert" className="text-sm font-semibold text-danger-red">
            {error}
          </p>
        ) : null}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">Cadets in Lobby</h2>
            <span className="font-display font-bold tabular-nums text-base text-accent-yellow">
              {players.length}
            </span>
          </div>

          {players.length === 0 ? (
            <p className="text-sm text-text-muted">Waiting for cadets to join...</p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {players.map((player) => {
                const isMe = me?.id === player.id;
                return (
                  <li
                    key={player.id}
                    className={`min-h-12 rounded-2xl px-4 py-2.5 flex items-center justify-between border ${
                      isMe
                        ? "bg-surface-elevated border-accent-orange text-text-primary"
                        : "bg-bg-primary border-border-ash text-text-primary"
                    }`}
                  >
                    <span className="font-semibold truncate">{player.name}</span>
                    {isMe ? (
                      <span className="text-xs font-bold text-accent-orange shrink-0 ml-2">
                        You
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <footer className="pt-4 border-t border-border-ash flex items-center justify-between text-sm">
          <Link href="/scoreboard" className="text-info-blue font-semibold hover:underline">
            View Scoreboard
          </Link>
          <span className="text-text-muted">Synced via Realtime</span>
        </footer>
      </section>
    </main>
  );
}
