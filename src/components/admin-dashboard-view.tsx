"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BombMark, StatusBadge } from "@/components/status-badge";
import type { AdminSessionAction } from "@/lib/admin-service";
import { rankPlayers } from "@/lib/game-rules";
import { useSessionRealtime } from "@/lib/use-session-realtime";
import type { ApiErrorEnvelope } from "@/types/game";

export function AdminDashboardView() {
  const router = useRouter();
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
    <main className="flex-1 px-4 py-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="rounded-3xl bg-surface border border-border-ash p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BombMark size={44} />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
                Facilitator Dashboard
              </h1>
              <div className="flex items-center gap-3 mt-1">
                {session ? <StatusBadge status={session.status} /> : null}
                {session?.lobby_locked ? (
                  <span className="text-sm font-semibold text-accent-yellow">
                    Lobby locked
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2.5">
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
        </header>

        <section className="rounded-3xl bg-surface border border-border-ash p-5 sm:p-6 space-y-4">
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
              className="min-h-12 rounded-2xl bg-accent-orange text-bg-primary font-display font-bold px-6 hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
              className="min-h-12 rounded-2xl bg-danger-red text-bg-primary font-display font-bold px-5 hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {busyAction === "end" ? "Ending..." : "End Game Early"}
            </button>

            {!confirmReset ? (
              <button
                type="button"
                disabled={!session || busyAction !== null}
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
        </section>

        <section className="rounded-3xl bg-surface border border-border-ash p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-text-primary">Cohort Roster</h2>
            <span className="font-display font-bold tabular-nums text-lg text-accent-yellow">
              {players.length} cadets
            </span>
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
                <li
                  key={player.id}
                  className="rounded-2xl bg-bg-primary border border-border-ash px-4 py-3 flex flex-wrap items-center justify-between gap-3"
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
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
