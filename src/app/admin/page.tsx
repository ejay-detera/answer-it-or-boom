import { Suspense } from "react";
import Link from "next/link";
import { AdminRedirectIfAuthed } from "@/components/admin-gate";
import { AdminLoginForm } from "@/components/admin-login-form";
import {
  BombSceneArt,
  ComicCutoutFrame,
  ComicLeftPanel,
  ComicStageFrame,
  ComicSticker,
} from "@/components/comic-shell";

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 flex items-center justify-center px-4 py-10">
          <p className="text-base text-text-muted">Checking facilitator session...</p>
        </main>
      }
    >
      <AdminRedirectIfAuthed>
        <ComicStageFrame bannerTitle="Facilitator Login" bannerTone="default">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <ComicLeftPanel className="md:col-span-5">
              <ComicCutoutFrame>
                <BombSceneArt variant="admin" />
              </ComicCutoutFrame>

              <div className="flex flex-wrap items-center gap-2.5">
                <ComicSticker tone="orange" tilt="left">
                  START & LOCK
                </ComicSticker>
                <ComicSticker tone="blue" tilt="right">
                  QUESTION POOL
                </ComicSticker>
              </div>
            </ComicLeftPanel>

            <div className="md:col-span-7 space-y-5">
              <div className="rounded-2xl bg-bg-primary border border-border-ash p-4 sm:p-5 space-y-1.5">
                <h2 className="text-xl font-bold text-text-primary">
                  Host Command Console
                </h2>
                <p className="text-sm text-text-muted leading-relaxed">
                  Control the waiting lobby, trigger the synchronized 3-2-1 bomb launch, and manage active quiz questions.
                </p>
              </div>

              <AdminLoginForm />

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-sm">
                <Link
                  href="/"
                  className="min-h-12 inline-flex items-center text-info-blue font-bold hover:underline"
                >
                  Back to Player Join
                </Link>
                <Link
                  href="/scoreboard"
                  className="min-h-12 inline-flex items-center text-text-muted font-bold hover:text-text-primary"
                >
                  Scoreboard
                </Link>
              </div>
            </div>
          </div>
        </ComicStageFrame>
      </AdminRedirectIfAuthed>
    </Suspense>
  );
}
