import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function AdminGate({ children }: { children: React.ReactNode }) {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    redirect("/admin");
  }
  return <>{children}</>;
}

export async function AdminRedirectIfAuthed({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAdminAuthenticated();
  if (authed) {
    redirect("/admin/dashboard");
  }
  return <>{children}</>;
}
