import { Sparkles } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

/** Slim standalone header for the auth pages (the app nav is hidden there). Logo unchanged. */
export function AuthHeader({ right }: { right?: ReactNode }) {
  return (
    <header className="flex items-center gap-4 border-b border-subtle px-6 py-3.5">
      <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-foreground">
        <Sparkles className="size-5 text-primary" />
        <span>AlgoLens</span>
      </Link>
      <div className="ml-auto flex items-center gap-3">
        <ThemeToggle />
        {right}
      </div>
    </header>
  );
}
