import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <ComingSoon
      pillar="Dashboard & Accounts"
      phase="Phase 0/5 · Roadmap"
      blurb="Auth.js v5 (GitHub, Google, magic link) gates a personal dashboard: continue-learning, streak flame, daily XP ring, due review cards, and a weekly activity heatmap."
      bullets={[
        "Anonymous users keep full access to Visualize & Analyze — auth only gates saving",
        "Continue-learning card, streak with one freeze/week, SM-2 review queue",
        "XP ledger (append-only) with a derived user_stats projection",
      ]}
    />
  );
}
