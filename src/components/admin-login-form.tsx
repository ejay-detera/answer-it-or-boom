"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiErrorEnvelope } from "@/types/game";

export function AdminLoginForm() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => null)) as ApiErrorEnvelope | null;
        setError(errBody?.error?.message ?? "Invalid passcode.");
        return;
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Network error verifying passcode.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label
          htmlFor="admin-passcode"
          className="block text-sm font-semibold text-text-primary mb-2"
        >
          Facilitator passcode
        </label>
        <input
          id="admin-passcode"
          name="passcode"
          type="password"
          value={passcode}
          onChange={(e) => {
            setPasscode(e.target.value);
            if (error) setError(null);
          }}
          required
          autoComplete="current-password"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "admin-login-error" : undefined}
          disabled={submitting}
          placeholder="Enter ADMIN_PASSCODE"
          className="w-full min-h-12 rounded-2xl bg-surface-elevated border border-border-ash px-4 text-base text-text-primary placeholder:text-text-muted disabled:opacity-60"
        />
        {error ? (
          <p
            id="admin-login-error"
            role="alert"
            className="mt-2 text-sm font-semibold text-danger-red"
          >
            {error}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={submitting || passcode.length === 0}
        className="w-full min-h-12 rounded-2xl bg-accent-orange text-bg-primary font-display font-bold text-lg px-6 hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
      >
        {submitting ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
