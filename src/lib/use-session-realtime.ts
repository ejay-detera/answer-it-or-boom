"use client";

import { useCallback, useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { PlayerRow, SessionRow } from "@/types/game";

export interface SessionRealtimeState {
  session: SessionRow | null;
  players: PlayerRow[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

async function fetchSessionSnapshot(
  initialSessionId?: string | null
): Promise<{ session: SessionRow | null; players: PlayerRow[] }> {
  const supabase = createBrowserSupabaseClient();
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

  if (!sessionRow) {
    return { session: null, players: [] };
  }

  const { data: playerRows, error: playersErr } = await supabase
    .from("players")
    .select("*")
    .eq("session_id", sessionRow.id)
    .order("joined_at", { ascending: true })
    .returns<PlayerRow[]>();
  if (playersErr) throw playersErr;

  return { session: sessionRow, players: playerRows ?? [] };
}

/** Subscribes to live `sessions` and `players` updates over read-only Supabase Realtime. */
export function useSessionRealtime(
  initialSessionId?: string | null
): SessionRealtimeState {
  const [session, setSession] = useState<SessionRow | null>(null);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchSessionSnapshot(initialSessionId);
      setSession(next.session);
      setPlayers(next.players);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to connect to live session."
      );
    } finally {
      setLoading(false);
    }
  }, [initialSessionId]);

  useEffect(() => {
    let active = true;
    const supabase = createBrowserSupabaseClient();

    async function sync() {
      try {
        const next = await fetchSessionSnapshot(initialSessionId);
        if (!active) return;
        setSession(next.session);
        setPlayers(next.players);
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

    void sync();

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
      .subscribe((status) => {
        if (status === "SUBSCRIBED" && active) {
          void sync();
        }
      });

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [initialSessionId]);

  return { session, players, loading, error, refresh };
}
