import { Suspense } from "react";
import { AdminGate } from "@/components/admin-gate";
import { AdminQuestionsView } from "@/components/admin-questions-view";

export default function AdminQuestionsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 flex items-center justify-center px-4 py-10">
          <p className="text-base text-text-muted">Loading question pool...</p>
        </main>
      }
    >
      <AdminGate>
        <AdminQuestionsView />
      </AdminGate>
    </Suspense>
  );
}
