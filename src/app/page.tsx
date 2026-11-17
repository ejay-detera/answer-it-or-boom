import Link from "next/link";
import { GAME_CONFIG } from "@/config/game-config";

export default function HomePage() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-3xl bg-surface border border-border-ash p-6 sm:p-8 shadow-lg">
        <div className="flex items-center gap-4 mb-6">
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <circle
              cx="22"
              cy="28"
              r="14"
              fill="#2A2F40"
              stroke="#FF7A1A"
              strokeWidth="2.5"
            />
            <path
              d="M27 15C29 10 34 8 38 9"
              stroke="#FFC933"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M39 5V13M35 9H43"
              stroke="#FF7A1A"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-text-primary">
              Answer It! or BOOM!
            </h1>
            <p className="text-sm text-text-muted mt-1">
              Cadet onboarding quiz race
            </p>
          </div>
        </div>

        <p className="text-base text-text-primary leading-relaxed mb-6">
          Start with{" "}
          <span className="font-display font-bold tabular-nums text-accent-yellow">
            {GAME_CONFIG.baseTimeSeconds}s
          </span>{" "}
          on the fuse. Every right answer adds{" "}
          <span className="font-display font-bold tabular-nums text-success-green">
            +{GAME_CONFIG.bonusTimeSeconds}s
          </span>{" "}
          and{" "}
          <span className="font-display font-bold tabular-nums text-accent-orange">
            +{GAME_CONFIG.pointsPerCorrect} pts
          </span>
          . You get one try per session.
        </p>

        <form className="space-y-4">
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
              minLength={GAME_CONFIG.playerNameMin}
              maxLength={GAME_CONFIG.playerNameMax}
              required
              placeholder="Enter your cadet name"
              className="w-full min-h-12 rounded-2xl bg-surface-elevated border border-border-ash px-4 text-base text-text-primary placeholder:text-text-muted"
            />
          </div>

          <button
            type="submit"
            disabled
            aria-disabled="true"
            className="w-full min-h-12 rounded-2xl bg-accent-orange text-bg-primary font-display font-bold text-lg px-6 cursor-not-allowed opacity-85"
          >
            Join Session (Backend Wiring Pending)
          </button>
          <p className="text-xs text-text-muted">
            Session join activates once Supabase schema and server actions are connected.
          </p>
        </form>

        <div className="mt-6 pt-5 border-t border-border-ash flex items-center justify-between text-sm">
          <Link href="/scoreboard" className="text-info-blue font-semibold hover:underline">
            Live Scoreboard
          </Link>
          <Link href="/admin" className="text-text-muted font-semibold hover:text-text-primary">
            Facilitator Login
          </Link>
        </div>
      </section>
    </main>
  );
}
