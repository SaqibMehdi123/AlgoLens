"use client";

import { cn } from "@algolens/ui";
import { Activity, BookOpen, Brain, FlaskConical, Play, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { statsSnapshot } from "@/lib/retention";
import { UserMenu } from "./auth/user-menu";
import { useRetention } from "./retention/widgets";
import { ThemeToggle } from "./theme-toggle";

const pillars = [
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/visualize", label: "Visualize", icon: Play },
  { href: "/analyze", label: "Analyze", icon: Activity },
  { href: "/practice", label: "Practice", icon: FlaskConical },
];

export function SiteNav() {
  const pathname = usePathname();
  const dueCount = statsSnapshot(useRetention()).dueCount;
  const { data: session, status } = useSession();

  // Auth pages render their own standalone header (AuthHeader); hide the app nav there.
  if (pathname === "/login" || pathname === "/register") return null;

  return (
    <header className="sticky top-0 z-40 border-b border-subtle bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-[1280px] items-center gap-1 px-4 sm:px-6">
        <Link href="/" className="mr-4 flex items-center gap-2 font-semibold tracking-tight">
          <Sparkles className="size-5 text-primary" />
          <span>AlgoLens</span>
        </Link>

        <nav className="flex items-center gap-0.5">
          {pillars.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[13px] transition-colors",
                  active
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-secondary hover:bg-raised hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/review"
            aria-label={`Review${dueCount > 0 ? ` — ${dueCount} due` : ""}`}
            className={cn(
              "relative grid size-9 place-items-center rounded-lg transition-colors",
              pathname === "/review"
                ? "bg-primary/10 text-primary"
                : "text-secondary hover:bg-raised hover:text-foreground",
            )}
          >
            <Brain className="size-[18px]" />
            {dueCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {dueCount > 9 ? "9+" : dueCount}
              </span>
            )}
          </Link>
          <ThemeToggle />

          {status === "loading" ? (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-raised" aria-hidden />
          ) : session?.user ? (
            <UserMenu
              name={session.user.name}
              email={session.user.email}
              image={session.user.image}
            />
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                href="/login"
                className={cn(
                  "rounded-lg px-3 py-1.5 font-mono text-[13px] font-semibold transition-colors",
                  pathname === "/login"
                    ? "bg-raised text-foreground"
                    : "text-secondary hover:bg-raised hover:text-foreground",
                )}
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-primary px-3.5 py-1.5 font-mono text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
