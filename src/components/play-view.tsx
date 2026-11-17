"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { BombTimer } from "@/components/bomb-timer";
import { SoundToggle } from "@/components/sound-toggle";
import { playSoundEffect } from "@/lib/sound-effects";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type {
  ApiErrorEnvelope,
  NextQuestionResponse,
  PublicQuestion,
  SessionRow,
  SubmitAnswerResponse,
} from "@/types/game";

interface FeedbackBanner {
  tone: "correct" | "wrong";
  text: string;
}

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

function computeServerOffsetMs(serverNowIso: string): number {
  return Date.parse(serverNowIso) - Date.now();
}

export function PlayView() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [question, setQuestion] = useState<PublicQuestion | null>(null);
  const [deadlineIso, setDeadlineIso] = useState<string | null>(null);
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [submittingIndex, setSubmittingIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<FeedbackBanner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applyQuestionPayload = useCallback(
    (data: NextQuestionResponse) => {
      setServerOffsetMs(computeServerOffsetMs(data.serverNow));
      if (data.status === "completed") {
        router.replace("/result");
        return;
      }
      setQuestion(data.question);
      setDeadlineIso(data.deadline);
      setScore(data.score);
      setStreak(data.streak);
      setAnsweredCount(data.answeredCount);
      setError(null);
    },
    [router]
  );

  const fetchQuestion = useCallback(async () => {
    try {
      const res = await fetch("/api/play/question", { cache: "no-store" });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => null)) as ApiErrorEnvelope | null;
        const code = errBody?.error?.code;
        if (code === "UNAUTHORIZED") {
          router.replace("/");
          return;
        }
        if (code === "NOT_RUNNING") {
          router.replace("/lobby");
          return;
        }
        if (code === "ALREADY_PLAYED" || code === "TIME_EXPIRED") {
          router.replace("/result");
          return;
        }
        setError(errBody?.error?.message ?? "Unable to load question.");
        return;
      }

      const data = (await res.json()) as NextQuestionResponse;
      applyQuestionPayload(data);
    } catch {
      setError("Connection issue loading question.");
    } finally {
      setLoading(false);
    }
  }, [applyQuestionPayload, router]);

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const res = await fetch("/api/play/question", { cache: "no-store" });
        if (!active) return;
        if (!res.ok) {
          const errBody = (await res.json().catch(() => null)) as ApiErrorEnvelope | null;
          const code = errBody?.error?.code;
          if (code === "UNAUTHORIZED") {
            router.replace("/");
            return;
          }
          if (code === "NOT_RUNNING") {
            router.replace("/lobby");
            return;
          }
          if (code === "ALREADY_PLAYED" || code === "TIME_EXPIRED") {
            router.replace("/result");
            return;
          }
          setError(errBody?.error?.message ?? "Unable to load question.");
          return;
        }
        const data = (await res.json()) as NextQuestionResponse;
        if (!active) return;
        applyQuestionPayload(data);
      } catch {
        if (active) setError("Connection issue loading question.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void init();
    return () => {
      active = false;
    };
  }, [applyQuestionPayload, router]);

  // Listen for host End Game Early -> session.status === 'finished'
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel("boom-play-session")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sessions" },
        (payload) => {
          const updated = payload.new as SessionRow;
          if (updated.status === "finished") {
            router.replace("/result");
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router]);

  const handleTimerExpire = useCallback(async () => {
    try {
      // Trigger server-side expiry sync so /scoreboard updates immediately
      await fetch("/api/session/me", { cache: "no-store" });
    } catch {
      // Navigate regardless of transient error
    }
    router.replace("/result");
  }, [router]);

  async function handleSelectOption(selectedIndex: number) {
    if (!question || submittingIndex !== null) return;
    setSubmittingIndex(selectedIndex);
    setError(null);

    try {
      const res = await fetch("/api/play/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          selectedIndex,
        }),
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => null)) as ApiErrorEnvelope | null;
        const code = errBody?.error?.code;
        if (code === "TIME_EXPIRED" || code === "ALREADY_PLAYED") {
          router.replace("/result");
          return;
        }
        if (code === "NOT_RUNNING") {
          router.replace("/lobby");
          return;
        }
        setError(errBody?.error?.message ?? "Unable to submit answer.");
        setSubmittingIndex(null);
        return;
      }

      const data = (await res.json()) as SubmitAnswerResponse;
      setServerOffsetMs(computeServerOffsetMs(data.serverNow));
      setScore(data.newScore);
      setStreak(data.newStreak);
      setDeadlineIso(data.newDeadline);

      if (data.status === "exploded" || data.status === "completed") {
        router.replace("/result");
        return;
      }

      if (data.correct) {
        playSoundEffect("correct");
        const bonusNote =
          data.streakBonusAwarded > 0
            ? ` · +${data.streakBonusAwarded} streak bonus!`
            : "";
        setFeedback({
          tone: "correct",
          text: `Correct! +30s fuse${bonusNote}`,
        });
      } else {
        playSoundEffect("wrong");
        setFeedback({
          tone: "wrong",
          text: "Not quite — streak reset",
        });
      }

      window.setTimeout(() => {
        setFeedback(null);
        setSubmittingIndex(null);
        void fetchQuestion();
      }, 350);
    } catch {
      setError("Network error submitting answer. Retry your selection.");
      setSubmittingIndex(null);
    }
  }

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <section className="w-full max-w-2xl rounded-3xl bg-surface border border-border-ash p-6 sm:p-8 text-center">
          <p className="text-base text-text-muted">Arming bomb timer and loading question...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-6 sm:py-10">
      <section className="w-full max-w-2xl rounded-3xl bg-surface border border-border-ash p-5 sm:p-8 space-y-6">
        <div className="flex items-center justify-end">
          <SoundToggle />
        </div>

        {deadlineIso ? (
          <BombTimer
            deadlineIso={deadlineIso}
            serverOffsetMs={serverOffsetMs}
            onExpire={handleTimerExpire}
          />
        ) : null}

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-surface-elevated border border-border-ash px-4 py-3">
            <p className="text-xs font-semibold text-text-muted">Score</p>
            <p className="font-display font-bold tabular-nums text-2xl text-accent-orange">
              {score}
            </p>
          </div>
          <div className="rounded-2xl bg-surface-elevated border border-border-ash px-4 py-3">
            <p className="text-xs font-semibold text-text-muted">Streak</p>
            <p className="font-display font-bold tabular-nums text-2xl text-accent-yellow">
              {streak}
            </p>
          </div>
          <div className="rounded-2xl bg-surface-elevated border border-border-ash px-4 py-3">
            <p className="text-xs font-semibold text-text-muted">Answered</p>
            <p className="font-display font-bold tabular-nums text-2xl text-text-primary">
              {answeredCount}
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {feedback ? (
            <motion.div
              key={feedback.text}
              role="status"
              aria-live="polite"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 8, scale: 0.96 }}
              animate={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : feedback.tone === "wrong"
                    ? { opacity: 1, x: [0, -6, 6, -4, 4, 0], y: 0, scale: 1 }
                    : { opacity: 1, y: 0, scale: 1 }
              }
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: prefersReducedMotion ? 0.01 : 0.22 }}
              className={`rounded-2xl px-4 py-3 text-sm font-bold border ${
                feedback.tone === "correct"
                  ? "bg-surface-elevated border-success-green text-success-green"
                  : "bg-surface-elevated border-danger-red text-danger-red"
              }`}
            >
              {feedback.text}
            </motion.div>
          ) : null}
        </AnimatePresence>

        {error ? (
          <p role="alert" className="text-sm font-semibold text-danger-red">
            {error}
          </p>
        ) : null}

        {question ? (
          <motion.div
            key={question.id}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.01 : 0.15 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-text-muted uppercase tracking-wider">
              <span>{question.category}</span>
              <span>{question.difficulty}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold leading-snug text-text-primary">
              {question.question}
            </h1>

            <div className="grid grid-cols-1 gap-3">
              {question.options.map((option, idx) => {
                const isSelected = submittingIndex === idx;
                const letter = OPTION_LETTERS[idx] ?? String(idx + 1);
                return (
                  <button
                    key={`${question.id}-${idx}`}
                    type="button"
                    disabled={submittingIndex !== null}
                    onClick={() => void handleSelectOption(idx)}
                    className={`min-h-12 w-full rounded-2xl border px-4 py-3 text-left flex items-center gap-3.5 transition-colors cursor-pointer disabled:cursor-not-allowed ${
                      isSelected
                        ? "bg-accent-orange border-accent-orange text-bg-primary font-bold"
                        : "bg-surface-elevated border-border-ash text-text-primary hover:border-accent-orange disabled:opacity-70"
                    }`}
                  >
                    <span
                      className={`font-display font-bold tabular-nums text-base shrink-0 w-7 h-7 rounded-xl flex items-center justify-center ${
                        isSelected
                          ? "bg-bg-primary text-accent-orange"
                          : "bg-bg-primary text-accent-yellow"
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="text-base font-semibold leading-snug">
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </section>
    </main>
  );
}
