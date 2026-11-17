"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ComicStageFrame, ComicSticker } from "@/components/comic-shell";
import { StatusBadge } from "@/components/status-badge";
import { rankPlayers } from "@/lib/game-rules";
import { useSessionRealtime } from "@/lib/use-session-realtime";

export function ScoreboardView() {
  const prefersReducedMotion = useReducedMotion();
  const { session, players, loading, error } = useSessionRealtime();

  const ranked = useMemo(
    () => rankPlayers(players, session?.started_at ?? null),
    [players, session?.started_at]
  );

  const topThree = ranked.slice(0, 3);

  return (
    <ComicStageFrame
      bannerTitle="Live Scoreboard"
      bannerTone="orange"
      maxWidthClass="max-w-5xl"
      rightSlot={
        <>
          {session ? <StatusBadge status={session.status} /> : null}
          <Link
            href="/"
            className="min-h-12 rounded-2xl bg-surface-elevated border border-border-ash px-5 inline-flex items-center justify-center text-sm font-bold text-text-primary hover:border-accent-orange"
          >
            Join / Back
          </Link>
        </>
      }
    >
      <div className="space-y-5">
        <p className="text-sm sm:text-base text-text-muted">
          Ranked by score, correct answers, and longest survival
        </p>

        {error ? (
          <p role="alert" className="text-sm font-semibold text-danger-red">
            {error}
          </p>
        ) : null}

        {loading && ranked.length === 0 ? (
          <div className="rounded-2xl bg-bg-primary border border-border-ash p-8 text-center">
            <p className="text-base text-text-muted">
              Connecting to live leaderboard...
            </p>
          </div>
        ) : ranked.length === 0 ? (
          <div className="rounded-2xl bg-bg-primary border border-border-ash p-8 text-center">
            <p className="text-base text-text-muted">
              No cadets have joined this session yet.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {topThree.map((player, idx) => {
                const rank = idx + 1;
                const tone =
                  rank === 1 ? "yellow" : rank === 2 ? "blue" : "orange";
                return (
                  <div
                    key={`podium-${player.id}`}
                    className={`rounded-2xl border-2 p-4 space-y-2.5 ${
                      rank === 1
                        ? "bg-surface-elevated border-accent-yellow"
                        : "bg-bg-primary border-border-ash"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <ComicSticker tone={tone} tilt={rank === 2 ? "right" : "left"}>
                        #{rank}
                      </ComicSticker>
                      <span className="font-display font-bold tabular-nums text-2xl text-accent-orange">
                        {player.score} pts
                      </span>
                    </div>
                    <p className="font-display font-bold text-lg text-text-primary truncate">
                      {player.name}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <StatusBadge status={player.status} />
                      <span className="text-xs font-semibold tabular-nums text-text-muted">
                        {player.correct_count} right · {player.best_streak} streak
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-2">
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
                      <motion.tr
                        key={player.id}
                        layout={!prefersReducedMotion ? "position" : false}
                        transition={{ duration: prefersReducedMotion ? 0.01 : 0.22 }}
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
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </ComicStageFrame>
  );
}
