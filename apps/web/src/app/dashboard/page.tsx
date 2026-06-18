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
  const firstName = (u.name || u.email || "").trim().split(/[\s@]/)[0] || undefined;

  return (
    <div className="mx-auto w-full max-w-[1180px] py-7">
      {/* Profile header */}
      <header className="mb-[22px] flex flex-wrap items-center gap-[18px] rounded-2xl border border-subtle bg-surface px-6 py-[22px]">
        <div className="grid size-[60px] shrink-0 place-items-center overflow-hidden rounded-2xl">
          {u.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={u.image} alt="" className="size-full object-cover" />
          ) : (
            <span className="grid size-full place-items-center bg-linear-to-br from-primary to-visited font-mono text-2xl font-bold text-white">
              {initial}
            </span>
          )}
        </div>
        <div className="min-w-[200px] flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[22px] font-bold text-foreground">{u.name || u.email}</h1>
            {u.role && u.role !== "learner" && (
              <span className="rounded-md border border-primary px-2 py-0.5 font-mono text-[11px] font-semibold text-primary">
                {u.role}
              </span>
            )}
          </div>
          {u.email && <div className="mt-0.5 font-mono text-[13px] text-secondary">{u.email}</div>}
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

      <DashboardStats firstName={firstName} />
    </div>
  );
}
