"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { PlayerRow, SessionRow } from "@/types/game";

export interface SessionRealtimeState {
  session: SessionRow | null;
  players: PlayerRow[];
  loading: boolean;
  error: string | null;
}

/** Subscribes to live `sessions` and `players` updates over read-only Supabase Realtime. */
export function useSessionRealtime(
  initialSessionId?: string | null
): SessionRealtimeState {
  const [session, setSession] = useState<SessionRow | null>(null);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = createBrowserSupabaseClient();

    async function loadInitial() {
      try {
        const sessionQuery = initialSessionId
          ? supabase
              .from("sessions")
              .select("*")
              .eq("id", initialSessionId)
              .maybeSingle<SessionRow>()
          : supabase
              .from("sessions")
              .select("*")
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle<SessionRow>();

        const { data: sessionRow, error: sessionErr } = await sessionQuery;
        if (sessionErr) throw sessionErr;
        if (!active) return;

        setSession(sessionRow ?? null);

        if (sessionRow) {
          const { data: playerRows, error: playersErr } = await supabase
            .from("players")
            .select("*")
            .eq("session_id", sessionRow.id)
            .order("joined_at", { ascending: true })
            .returns<PlayerRow[]>();
          if (playersErr) throw playersErr;
          if (!active) return;
          setPlayers(playerRows ?? []);
        } else {
          setPlayers([]);
        }
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Failed to connect to live session."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadInitial();

    const channel = supabase
      .channel(`boom-live-${initialSessionId ?? "latest"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sessions" },
        (payload) => {
          if (!active) return;
          if (payload.eventType === "DELETE") return;
          const next = payload.new as SessionRow;
          if (initialSessionId && next.id !== initialSessionId) return;
          setSession(next);
          if (payload.eventType === "INSERT") {
            setPlayers([]);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players" },
        (payload) => {
          if (!active) return;
          if (payload.eventType === "INSERT") {
            const added = payload.new as PlayerRow;
            setPlayers((prev) =>
              prev.some((p) => p.id === added.id) ? prev : [...prev, added]
            );
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as PlayerRow;
            setPlayers((prev) =>
              prev.map((p) => (p.id === updated.id ? updated : p))
            );
          } else if (payload.eventType === "DELETE") {
            const removed = payload.old as { id?: string };
            if (removed?.id) {
              setPlayers((prev) => prev.filter((p) => p.id !== removed.id));
            }
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [initialSessionId]);

  return { session, players, loading, error };
}
