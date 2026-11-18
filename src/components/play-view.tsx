"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { BombTimer } from "@/components/bomb-timer";
import {
  ComicLeftPanel,
  ComicStageFrame,
  ComicSticker,
} from "@/components/comic-shell";
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
  const [queue, setQueue] = useState<PublicQuestion[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [deadlineIso, setDeadlineIso] = useState<string | null>(null);
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [awaitingFinal, setAwaitingFinal] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackBanner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);
  const submitChainRef = useRef<Promise<void>>(Promise.resolve());
  const terminatedRef = useRef(false);

  const question = queue[queueIndex] ?? null;

  useEffect(() => {
    return () => {
      terminatedRef.current = true;
      if (feedbackTimeoutRef.current !== null) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  const applyQuestionPayload = useCallback(
    (data: NextQuestionResponse) => {
      setServerOffsetMs(computeServerOffsetMs(data.serverNow));
      if (data.status === "completed") {
        terminatedRef.current = true;
        router.replace("/result");
        return;
      }
      setQueue([data.question, ...(data.upcomingQuestions ?? [])]);
      setQueueIndex(0);
      setDeadlineIso(data.deadline);
      setScore(data.score);
      setStreak(data.streak);
      setAnsweredCount(data.answeredCount);
      setError(null);
    },
    [router]
  );

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
            terminatedRef.current = true;
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
    terminatedRef.current = true;
    try {
      await fetch("/api/session/me", { cache: "no-store" });
    } catch {
      // Navigate regardless of transient error
    }
    router.replace("/result");
  }, [router]);

  function handleSelectOption(selectedIndex: number) {
    const currentQuestion = queue[queueIndex];
    if (!currentQuestion || awaitingFinal || terminatedRef.current) return;

    const nextIndex = queueIndex + 1;
    const hasMoreBuffered = nextIndex < queue.length;

    setError(null);
    if (hasMoreBuffered) {
      // Advance immediately to the next pre-loaded PublicQuestion (0ms buffer)
      setQueueIndex(nextIndex);
    } else {
      setAwaitingFinal(true);
    }

    submitChainRef.current = submitChainRef.current.then(async () => {
      if (terminatedRef.current) return;

      try {
        const res = await fetch("/api/play/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: currentQuestion.id,
            selectedIndex,
          }),
        });

        if (terminatedRef.current) return;

        if (!res.ok) {
          const errBody = (await res.json().catch(() => null)) as ApiErrorEnvelope | null;
          const code = errBody?.error?.code;
          if (code === "TIME_EXPIRED" || code === "ALREADY_PLAYED") {
            terminatedRef.current = true;
            router.replace("/result");
            return;
          }
          if (code === "NOT_RUNNING") {
            terminatedRef.current = true;
            router.replace("/lobby");
            return;
          }
          setError(errBody?.error?.message ?? "Unable to record answer.");
          setAwaitingFinal(false);
          return;
        }

        const data = (await res.json()) as SubmitAnswerResponse;
        if (terminatedRef.current) return;

        setServerOffsetMs(computeServerOffsetMs(data.serverNow));
        setScore(data.newScore);
        setStreak(data.newStreak);
        setAnsweredCount(data.answeredCount);
        setDeadlineIso(data.newDeadline);

        if (data.status === "exploded" || data.status === "completed") {
          terminatedRef.current = true;
          router.replace("/result");
          return;
        }

        if (feedbackTimeoutRef.current !== null) {
          window.clearTimeout(feedbackTimeoutRef.current);
        }

        if (data.correct) {
          playSoundEffect("correct");
          const bonusNote =
            data.streakBonusAwarded > 0
              ? ` · +${data.streakBonusAwarded} streak bonus!`
              : "";
          setFeedback({
            tone: "correct",
            text: `Correct! +${data.bonusTimeSecondsApplied}s fuse${bonusNote}`,
          });
        } else if (!data.alreadyAnswered) {
          playSoundEffect("wrong");
          const multiplierNote =
            data.consecutiveWrongCount > 1
              ? ` (${data.consecutiveWrongCount}x streak penalty!)`
              : "";
          setFeedback({
            tone: "wrong",
            text: `Wrong! -${data.penaltySecondsApplied}s fuse${multiplierNote}`,
          });
        }

        feedbackTimeoutRef.current = window.setTimeout(() => {
          setFeedback(null);
          feedbackTimeoutRef.current = null;
        }, 950);

        if (!hasMoreBuffered) {
          if (data.nextQuestion) {
            setQueue((prev) => [...prev, data.nextQuestion!]);
            setQueueIndex(nextIndex);
            setAwaitingFinal(false);
          } else {
            terminatedRef.current = true;
            router.replace("/result");
          }
        }
      } catch {
        if (!terminatedRef.current) {
          setError("Network error recording answer.");
          setAwaitingFinal(false);
        }
      }
    });
  }

  if (loading) {
    return (
      <ComicStageFrame bannerTitle="Answer or BOOM!" maxWidthClass="max-w-5xl">
        <div className="rounded-2xl bg-bg-primary border border-border-ash p-8 text-center">
          <p className="text-base text-text-muted">
            Arming bomb timer and loading question...
          </p>
        </div>
      </ComicStageFrame>
    );
  }

  return (
    <ComicStageFrame
      bannerTitle="Answer or BOOM!"
      bannerTone="orange"
      maxWidthClass="max-w-5xl"
      rightSlot={<SoundToggle />}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <ComicLeftPanel className="lg:col-span-5">
          {deadlineIso ? (
            <BombTimer
              deadlineIso={deadlineIso}
              serverOffsetMs={serverOffsetMs}
              onExpire={handleTimerExpire}
            />
          ) : null}

          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-2xl bg-surface border border-border-ash px-3.5 py-3">
              <p className="text-xs font-semibold text-text-muted">Score</p>
              <p className="font-display font-bold tabular-nums text-2xl text-accent-orange">
                {score}
              </p>
            </div>
            <div className="rounded-2xl bg-surface border border-border-ash px-3.5 py-3">
              <p className="text-xs font-semibold text-text-muted">Streak</p>
              <p className="font-display font-bold tabular-nums text-2xl text-accent-yellow">
                {streak}
              </p>
            </div>
            <div className="rounded-2xl bg-surface border border-border-ash px-3.5 py-3">
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
                initial={
                  prefersReducedMotion ? false : { y: 6, scale: 0.96 }
                }
                animate={
                  prefersReducedMotion
                    ? { scale: 1 }
                    : feedback.tone === "wrong"
                      ? { x: [0, -7, 7, -4, 4, 0], y: 0, scale: 1 }
                      : { y: 0, scale: 1 }
                }
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={{ duration: prefersReducedMotion ? 0.01 : 0.16 }}
                className={`rounded-2xl px-4 py-3 text-sm font-bold border-2 ${
                  feedback.tone === "correct"
                    ? "bg-surface border-success-green text-success-green"
                    : "bg-surface border-danger-red text-danger-red"
                }`}
              >
                {feedback.text}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </ComicLeftPanel>

        <div className="lg:col-span-7 space-y-4">
          {error ? (
            <p role="alert" className="text-sm font-semibold text-danger-red">
              {error}
            </p>
          ) : null}

          {question ? (
            <motion.div
              key={question.id}
              initial={prefersReducedMotion ? false : { y: 5 }}
              animate={{ y: 0 }}
              transition={{ duration: prefersReducedMotion ? 0.01 : 0.1 }}
              className="rounded-2xl bg-bg-primary border-2 border-border-ash p-5 sm:p-6 space-y-5"
            >
              <h2 className="text-xl sm:text-2xl font-bold leading-snug text-text-primary">
                {question.question}
              </h2>

              <div className="grid grid-cols-1 gap-3">
                {question.options.map((option, idx) => {
                  const letter = OPTION_LETTERS[idx] ?? String(idx + 1);
                  return (
                    <button
                      key={`${question.id}-${idx}`}
                      type="button"
                      disabled={awaitingFinal}
                      onClick={() => handleSelectOption(idx)}
                      className="min-h-12 w-full rounded-2xl border-2 px-4 py-3 text-left flex items-center gap-3.5 transition-transform active:scale-[0.99] cursor-pointer bg-surface border-border-ash text-text-primary hover:border-accent-orange disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      <span className="font-display font-bold tabular-nums text-base shrink-0 w-8 h-8 rounded-xl flex items-center justify-center bg-surface-elevated text-accent-yellow">
                        {letter}
                      </span>
                      <span className="text-base font-semibold leading-snug">
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <ComicSticker tone="blue" tilt="left">
                  {question.category}
                </ComicSticker>
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  {awaitingFinal
                    ? "Finishing run..."
                    : `Difficulty: ${question.difficulty}`}
                </span>
              </div>
            </motion.div>
          ) : null}
        </div>
      </div>
    </ComicStageFrame>
  );
}
