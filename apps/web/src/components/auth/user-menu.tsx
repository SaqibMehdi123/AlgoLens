"use client";

import { cn } from "@algolens/ui";
import { LayoutDashboard, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

/** Signed-in nav cluster: a Dashboard link, the user's avatar, and a sign-out button. */
export function UserMenu({ name, email, image }: { name?: string | null; email?: string | null; image?: string | null }) {
  const pathname = usePathname();
  const label = name || email || "Account";
  const initial = (label.trim().charAt(0) || "?").toUpperCase();
  const onDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  return (
    <div className="flex items-center gap-1.5">
      <Link
        href="/dashboard"
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[13px] transition-colors",
          onDashboard ? "bg-raised text-foreground" : "text-secondary hover:bg-raised hover:text-foreground",
        )}
      >
        <LayoutDashboard className="size-4" />
        <span className="hidden sm:inline">Dashboard</span>
      </Link>

      <Link href="/profile" aria-label={`Your profile (${label})`} className="grid size-8 place-items-center overflow-hidden rounded-full border border-subtle bg-raised">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="size-full object-cover" />
        ) : (
          <span className="text-xs font-semibold text-foreground">{initial}</span>
        )}
      </Link>

      <button
        type="button"
        onClick={() => void signOut({ callbackUrl: "/" })}
        aria-label="Sign out"
        className="grid size-9 place-items-center rounded-lg text-secondary transition-colors hover:bg-raised hover:text-foreground"
      >
        <LogOut className="size-[18px]" />
      </button>
    </div>
  );
}
