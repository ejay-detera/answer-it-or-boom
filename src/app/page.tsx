import Link from "next/link";
import { JoinForm } from "@/components/join-form";
import { BombMark } from "@/components/status-badge";
import { GAME_CONFIG } from "@/config/game-config";

export default function HomePage() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-3xl bg-surface border border-border-ash p-6 sm:p-8">
        <div className="flex items-center gap-4 mb-6">
          <BombMark size={48} />
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

        <JoinForm />

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
