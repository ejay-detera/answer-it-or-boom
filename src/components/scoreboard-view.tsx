"use client";

import { useMemo } from "react";
import Link from "next/link";
import { BombMark, StatusBadge } from "@/components/status-badge";
import { rankPlayers } from "@/lib/game-rules";
import { useSessionRealtime } from "@/lib/use-session-realtime";

export function ScoreboardView() {
  const { session, players, loading, error } = useSessionRealtime();

  const ranked = useMemo(
    () => rankPlayers(players, session?.started_at ?? null),
    [players, session?.started_at]
  );

  return (
    <main className="flex-1 px-4 py-8 sm:py-10">
      <section className="mx-auto w-full max-w-5xl rounded-3xl bg-surface border border-border-ash p-5 sm:p-8 space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BombMark size={48} />
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-text-primary">
                Live Scoreboard
              </h1>
              <p className="text-sm sm:text-base text-text-muted mt-0.5">
                Ranked by score, correct answers, and longest survival
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {session ? <StatusBadge status={session.status} /> : null}
            <Link
              href="/"
              className="min-h-12 rounded-2xl bg-surface-elevated border border-border-ash px-5 inline-flex items-center justify-center text-sm font-bold text-text-primary hover:border-accent-orange"
            >
              Join / Back
            </Link>
          </div>
        </header>

        {error ? (
          <p role="alert" className="text-sm font-semibold text-danger-red">
            {error}
          </p>
        ) : null}

        {loading && ranked.length === 0 ? (
          <p className="text-base text-text-muted py-8 text-center">
            Connecting to live leaderboard...
          </p>
        ) : ranked.length === 0 ? (
          <div className="rounded-2xl bg-surface-elevated border border-border-ash p-8 text-center">
            <p className="text-base text-text-muted">
              No cadets have joined this session yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-2.5">
              <thead>
                <tr className="text-xs sm:text-sm font-semibold text-text-muted">
                  <th className="px-4 py-1">Rank</th>
                  <th className="px-4 py-1">Cadet</th>
                  <th className="px-4 py-1">Status</th>
                  <th className="px-4 py-1 text-right">Correct</th>
                  <th className="px-4 py-1 text-right">Best Streak</th>
                  <th className="px-4 py-1 text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((player, index) => {
                  const rank = index + 1;
                  const isLeader = rank === 1 && player.score > 0;
                  return (
                    <tr
                      key={player.id}
                      className={`rounded-2xl ${
                        isLeader
                          ? "bg-surface-elevated text-text-primary"
                          : "bg-bg-primary text-text-primary"
                      }`}
                    >
                      <td className="px-4 py-3.5 rounded-l-2xl font-display font-bold tabular-nums text-lg sm:text-xl text-accent-yellow">
                        #{rank}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-base sm:text-lg">
                        {player.name}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={player.status} />
                      </td>
                      <td className="px-4 py-3.5 text-right font-display font-semibold tabular-nums text-base sm:text-lg text-success-green">
                        {player.correct_count}
                      </td>
                      <td className="px-4 py-3.5 text-right font-display font-semibold tabular-nums text-base sm:text-lg text-accent-yellow">
                        {player.best_streak}
                      </td>
                      <td className="px-4 py-3.5 rounded-r-2xl text-right font-display font-bold tabular-nums text-xl sm:text-2xl text-accent-orange">
                        {player.score}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
