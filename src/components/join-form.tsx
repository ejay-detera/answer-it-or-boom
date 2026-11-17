"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GAME_CONFIG } from "@/config/game-config";
import type { ApiErrorEnvelope, SessionMeResponse } from "@/types/game";

export function JoinForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionBlockedMsg, setSessionBlockedMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function checkExisting() {
      try {
        const res = await fetch("/api/session/me", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as SessionMeResponse;
        if (!active) return;

        if (data.player) {
          if (data.player.status === "waiting") {
            router.replace("/lobby");
            return;
          }
          if (data.player.status === "playing") {
            router.replace("/play");
            return;
          }
          router.replace("/result");
          return;
        }

        if (!data.session) {
          setSessionBlockedMsg("No active session is open right now.");
        } else if (data.session.status !== "waiting" || data.session.lobby_locked) {
          setSessionBlockedMsg(
            "This session is currently locked or already in progress."
          );
        }
      } catch {
        // Keep form interactive if background check fails
      } finally {
        if (active) setCheckingSession(false);
      }
    }

    void checkExisting();
    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/session/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => null)) as ApiErrorEnvelope | null;
        setError(
          errBody?.error?.message ?? "Unable to join right now. Please try again."
        );
        return;
      }

      router.push("/lobby");
    } catch {
      setError("Network error while joining. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  }

  const describedBy = error
    ? "join-error"
    : sessionBlockedMsg
      ? "session-status-note"
      : undefined;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label
          htmlFor="player-name"
          className="block text-sm font-semibold text-text-primary mb-2"
        >
          Your name ({GAME_CONFIG.playerNameMin}–{GAME_CONFIG.playerNameMax} characters)
        </label>
        <input
          id="player-name"
          name="name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          minLength={GAME_CONFIG.playerNameMin}
          maxLength={GAME_CONFIG.playerNameMax}
          required
          autoComplete="nickname"
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          disabled={submitting}
          placeholder="Enter your cadet name"
          className="w-full min-h-12 rounded-2xl bg-surface-elevated border border-border-ash px-4 text-base text-text-primary placeholder:text-text-muted disabled:opacity-60"
        />
        {error ? (
          <p id="join-error" role="alert" className="mt-2 text-sm font-semibold text-danger-red">
            {error}
          </p>
        ) : null}
        {!error && sessionBlockedMsg ? (
          <p id="session-status-note" className="mt-2 text-sm text-accent-yellow">
            {sessionBlockedMsg}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={submitting || checkingSession || Boolean(sessionBlockedMsg)}
        className="w-full min-h-12 rounded-2xl bg-accent-orange text-bg-primary font-display font-bold text-lg px-6 transition-transform active:scale-[0.99] hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
      >
        {checkingSession
          ? "Checking session..."
          : submitting
            ? "Joining lobby..."
            : "Join Session"}
      </button>
    </form>
  );
}
