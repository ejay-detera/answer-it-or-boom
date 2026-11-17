import { Suspense } from "react";
import Link from "next/link";
import { AdminRedirectIfAuthed } from "@/components/admin-gate";
import { AdminLoginForm } from "@/components/admin-login-form";
import { BombMark } from "@/components/status-badge";

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
        <main className="flex-1 flex items-center justify-center px-4 py-10">
          <section className="w-full max-w-md rounded-3xl bg-surface border border-border-ash p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-4">
              <BombMark size={44} />
              <div>
                <h1 className="text-3xl font-bold text-text-primary">
                  Facilitator Login
                </h1>
                <p className="text-sm text-text-muted mt-0.5">
                  Control lobby, bomb timer, and questions
                </p>
              </div>
            </div>

            <AdminLoginForm />

            <div className="pt-4 border-t border-border-ash flex items-center justify-between text-sm">
              <Link href="/" className="text-info-blue font-semibold hover:underline">
                Back to Player Join
              </Link>
              <Link
                href="/scoreboard"
                className="text-text-muted font-semibold hover:text-text-primary"
              >
                Scoreboard
              </Link>
            </div>
          </section>
        </main>
      </AdminRedirectIfAuthed>
    </Suspense>
  );
}
