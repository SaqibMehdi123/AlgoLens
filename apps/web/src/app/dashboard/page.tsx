import { Button } from "@algolens/ui";
import { LogOut } from "lucide-react";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";

export const metadata = { title: "Dashboard" };

/** Dashboard (docs/05 §5.2). Gated: signed-out visitors are sent to /login. The profile header is
 * server-rendered from the session; progress widgets below are device-local (ADR-0003/0005). */
export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const u = session.user;
  const label = u.name || u.email || "there";
  const initial = (label.trim().charAt(0) || "?").toUpperCase();

  return (
    <div className="py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-subtle bg-surface p-6">
        <div className="flex items-center gap-4">
          <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full border border-subtle bg-raised">
            {u.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={u.image} alt="" className="size-full object-cover" />
            ) : (
              <span className="text-xl font-semibold text-foreground">{initial}</span>
            )}
          </div>
          <div>
            <p className="text-sm text-muted">Welcome back,</p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {u.name || u.email}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-secondary">
              {u.email && <span>{u.email}</span>}
              {u.role && u.role !== "learner" && (
                <span className="rounded-full bg-raised px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-muted">
                  {u.role}
                </span>
              )}
            </div>
          </div>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <Button type="submit" variant="secondary">
            <LogOut className="size-4" />
            Sign out
          </Button>
        </form>
      </header>

      <DashboardStats />
    </div>
  );
}
