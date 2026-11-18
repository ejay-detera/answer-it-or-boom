"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ComicStageFrame, ComicSticker } from "@/components/comic-shell";
import { StatusBadge } from "@/components/status-badge";
import type { AdminSessionAction } from "@/lib/admin-service";
import { rankPlayers } from "@/lib/game-rules";
import { useSessionRealtime } from "@/lib/use-session-realtime";
import type { ApiErrorEnvelope } from "@/types/game";

export function AdminDashboardView() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const { session, players, loading, error, refresh } = useSessionRealtime();
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const ranked = useMemo(
    () => rankPlayers(players, session?.started_at ?? null),
    [players, session?.started_at]
  );

  async function triggerSessionAction(action: AdminSessionAction) {
    setBusyAction(action);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (res.status === 401) {
        router.replace("/admin");
        return;
      }

      if (!res.ok) {
        const errBody = (await res.json().catch(() => null)) as ApiErrorEnvelope | null;
        setActionError(errBody?.error?.message ?? "Session update failed.");
        return;
      }

      setConfirmReset(false);
      await refresh();
    } catch {
      setActionError("Network error updating session.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleKick(playerId: string) {
    setBusyAction(`kick:${playerId}`);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/players/${playerId}`, {
        method: "DELETE",
      });
      if (res.status === 401) {
        router.replace("/admin");
        return;
      }
      if (!res.ok) {
        const errBody = (await res.json().catch(() => null)) as ApiErrorEnvelope | null;
        setActionError(errBody?.error?.message ?? "Failed to remove player.");
      } else {
        await refresh();
      }
    } catch {
      setActionError("Network error removing player.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleSignOut() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.replace("/admin");
    router.refresh();
  }

  const canStart = session?.status === "waiting" && players.length > 0;
  const isLive = session?.status === "countdown" || session?.status === "running";

  return (
    <ComicStageFrame
      bannerTitle="Facilitator Dashboard"
      bannerTone="orange"
      maxWidthClass="max-w-5xl"
      rightSlot={
        <nav className="flex flex-wrap items-center gap-2.5">
          {session ? <StatusBadge status={session.status} /> : null}
          {session?.lobby_locked ? (
            <ComicSticker tone="yellow" tilt="left">
              LOCKED
            </ComicSticker>
          ) : null}
          <Link
            href="/admin/questions"
            className="min-h-12 rounded-2xl bg-surface-elevated border border-border-ash px-4 inline-flex items-center justify-center text-sm font-bold text-text-primary hover:border-accent-orange"
          >
            Manage Questions
          </Link>
          <Link
            href="/scoreboard"
            className="min-h-12 rounded-2xl bg-surface-elevated border border-border-ash px-4 inline-flex items-center justify-center text-sm font-bold text-info-blue hover:border-info-blue"
          >
            Projector Scoreboard
          </Link>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="min-h-12 rounded-2xl bg-bg-primary border border-border-ash px-4 text-sm font-bold text-text-muted hover:text-text-primary cursor-pointer"
          >
            Sign Out
          </button>
        </nav>
      }
    >
      <div className="space-y-6">
        <div className="rounded-2xl bg-bg-primary border-2 border-border-ash p-5 space-y-4">
          <h2 className="text-xl font-bold text-text-primary">Session Controls</h2>

          {actionError || error ? (
            <p role="alert" className="text-sm font-semibold text-danger-red">
              {actionError ?? error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!canStart || busyAction !== null}
              onClick={() => void triggerSessionAction("start")}
              className="min-h-12 rounded-2xl bg-accent-orange text-bg-primary font-display font-bold px-6 transition-transform active:scale-[0.99] hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {busyAction === "start" ? "Starting..." : "Start Game"}
            </button>

            <button
              type="button"
              disabled={!session || session.status !== "waiting" || busyAction !== null}
              onClick={() =>
                void triggerSessionAction(session?.lobby_locked ? "unlock" : "lock")
              }
              className="min-h-12 rounded-2xl bg-surface-elevated border border-border-ash text-text-primary font-display font-bold px-5 hover:border-accent-yellow disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {session?.lobby_locked ? "Unlock Lobby" : "Lock Lobby"}
            </button>

            <button
              type="button"
              disabled={!isLive || busyAction !== null}
              onClick={() => void triggerSessionAction("end")}
              className="min-h-12 rounded-2xl bg-danger-red text-bg-primary font-display font-bold px-5 transition-transform active:scale-[0.99] hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {busyAction === "end" ? "Ending..." : "End Game Early"}
            </button>

            {!session ? (
              <button
                type="button"
                disabled={busyAction !== null}
                onClick={() => void triggerSessionAction("reset")}
                className="min-h-12 rounded-2xl bg-accent-orange text-bg-primary font-display font-bold px-6 transition-transform active:scale-[0.99] hover:brightness-105 disabled:opacity-50 cursor-pointer"
              >
                {busyAction === "reset" ? "Creating..." : "Create New Session"}
              </button>
            ) : !confirmReset ? (
              <button
                type="button"
                disabled={busyAction !== null}
                onClick={() => setConfirmReset(true)}
                className="min-h-12 rounded-2xl bg-surface-elevated border border-border-ash text-accent-yellow font-display font-bold px-5 hover:border-accent-yellow disabled:opacity-50 cursor-pointer"
              >
                Reset Session
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={busyAction !== null}
                  onClick={() => void triggerSessionAction("reset")}
                  className="min-h-12 rounded-2xl bg-danger-red text-bg-primary font-display font-bold px-5 cursor-pointer"
                >
                  {busyAction === "reset"
                    ? "Resetting..."
                    : "Confirm Reset (Clears Players)"}
                </button>
                <button
                  type="button"
                  disabled={busyAction !== null}
                  onClick={() => setConfirmReset(false)}
                  className="min-h-12 rounded-2xl bg-surface-elevated border border-border-ash text-text-muted font-bold px-4 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-bg-primary border-2 border-border-ash p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-text-primary">Cohort Roster</h2>
            <ComicSticker tone="yellow" tilt="right">
              {players.length} CADETS
            </ComicSticker>
          </div>

          {loading && players.length === 0 ? (
            <p className="text-sm text-text-muted">Loading players...</p>
          ) : ranked.length === 0 ? (
            <p className="text-sm text-text-muted">
              No cadets have joined yet. Share the player URL so cadets can enter on `/`.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {ranked.map((player) => (
                <motion.li
                  key={player.id}
                  layout={!prefersReducedMotion ? "position" : false}
                  transition={{ duration: prefersReducedMotion ? 0.01 : 0.2 }}
                  className="rounded-2xl bg-surface border border-border-ash px-4 py-3 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="font-bold text-text-primary truncate">
                      {player.name}
                    </span>
                    <StatusBadge status={player.status} />
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-display font-bold tabular-nums text-lg text-accent-orange">
                      {player.score} pts
                    </span>
                    <button
                      type="button"
                      disabled={busyAction !== null}
                      onClick={() => void handleKick(player.id)}
                      className="min-h-12 rounded-2xl bg-surface-elevated border border-border-ash px-4 text-sm font-bold text-danger-red hover:border-danger-red disabled:opacity-50 cursor-pointer"
                    >
                      {busyAction === `kick:${player.id}` ? "Removing..." : "Kick"}
                    </button>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </ComicStageFrame>
  );
}
