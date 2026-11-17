import { Suspense } from "react";
import { AdminDashboardView } from "@/components/admin-dashboard-view";
import { AdminGate } from "@/components/admin-gate";

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 flex items-center justify-center px-4 py-10">
          <p className="text-base text-text-muted">Loading facilitator dashboard...</p>
        </main>
      }
    >
      <AdminGate>
        <AdminDashboardView />
      </AdminGate>
    </Suspense>
  );
}
