import Link from "next/link";
import {
  BombSceneArt,
  ComicCutoutFrame,
  ComicLeftPanel,
  ComicStageFrame,
  ComicSticker,
} from "@/components/comic-shell";
import { JoinForm } from "@/components/join-form";
import { GAME_CONFIG } from "@/config/game-config";

export default function HomePage() {
  return (
    <ComicStageFrame bannerTitle="Answer It! or BOOM!" bannerTone="orange">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <ComicLeftPanel className="md:col-span-5">
          <ComicCutoutFrame>
            <BombSceneArt variant="join" />
          </ComicCutoutFrame>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <ComicSticker tone="yellow" tilt="left">
              {GAME_CONFIG.baseTimeSeconds}s FUSE
            </ComicSticker>
            <ComicSticker tone="green" tilt="right">
              +{GAME_CONFIG.bonusTimeSeconds}s / RIGHT
            </ComicSticker>
            <ComicSticker tone="orange" tilt="left">
              +{GAME_CONFIG.pointsPerCorrect} PTS
            </ComicSticker>
            <ComicSticker tone="red" tilt="right">
              1 TRY ONLY
            </ComicSticker>
          </div>
        </ComicLeftPanel>

        <div className="md:col-span-7 space-y-5">
          <div className="rounded-2xl bg-bg-primary border border-border-ash p-4 sm:p-5 space-y-2">
            <h2 className="text-xl font-bold text-text-primary">
              Beat the clock before it blows!
            </h2>
            <p className="text-sm sm:text-base text-text-muted leading-relaxed">
              Every cadet starts with{" "}
              <span className="font-display font-bold tabular-nums text-accent-yellow">
                {GAME_CONFIG.baseTimeSeconds}s
              </span>
              . Right answers extend your fuse by{" "}
              <span className="font-display font-bold tabular-nums text-success-green">
                +{GAME_CONFIG.bonusTimeSeconds}s
              </span>{" "}
              and score{" "}
              <span className="font-display font-bold tabular-nums text-accent-orange">
                +{GAME_CONFIG.pointsPerCorrect} pts
              </span>{" "}
              plus streak bonuses.
            </p>
          </div>

          <JoinForm />

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-sm">
            <Link
              href="/scoreboard"
              className="min-h-12 inline-flex items-center text-info-blue font-bold hover:underline"
            >
              Live Scoreboard
            </Link>
            <Link
              href="/admin"
              className="min-h-12 inline-flex items-center text-text-muted font-bold hover:text-text-primary"
            >
              Facilitator Login
            </Link>
          </div>
        </div>
      </div>
    </ComicStageFrame>
  );
}
