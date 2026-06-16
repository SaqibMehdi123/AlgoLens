import {
  Activity,
  ArrowRight,
  BookOpen,
  Eye,
  FlaskConical,
  Gauge,
  GitBranch,
  Play,
  Repeat,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { HeroViz } from "@/components/hero-viz";

export const metadata = {
  description:
    "AlgoLens teaches data structures & algorithms by letting you watch them run step by step, prove how they scale, and practice in a real judge — built on CLRS, Sedgewick, and the Competitive Programmer's Handbook.",
};

const stats = [
  { value: "12", label: "algorithms visualized" },
  { value: "9", label: "structured lessons" },
  { value: "32", label: "practice problems" },
  { value: "5", label: "languages" },
];

const pillars = [
  {
    icon: Play,
    title: "Visualize",
    body: "Every algorithm is a generator that yields typed steps; the player is a pure function of (trace, frame). Step backward exactly, scrub instantly, and watch the pseudocode line behind each move light up.",
    points: ["Play / pause / step / scrub / speed", "Backward stepping is exact", "Shareable deep links to any frame"],
    href: "/visualize",
    cta: "Open the playground",
  },
  {
    icon: BookOpen,
    title: "Learn",
    body: "A curriculum of interview- and contest-focused lessons with embedded visualizations, two quizzes each, and a wrong-answer replay that jumps you to the exact step that explains your mistake.",
    points: ["Hook → intuition → proof → practice", "Cited to CLRS, Sedgewick, CP Handbook", "Quizzes link back to the visualization"],
    href: "/learn",
    cta: "Browse the curriculum",
  },
  {
    icon: Activity,
    title: "Analyze",
    body: "Paste a function and get an honest complexity estimate: static AST analysis and empirical curve-fitting side by side, each with its own confidence. When they disagree, we show you — never a single overconfident oracle.",
    points: ["Static + empirical, shown together", "Confidence and method always visible", "Runs your code in a sandboxed worker"],
    href: "/analyze",
    cta: "See the Complexity Lab",
  },
  {
    icon: FlaskConical,
    title: "Practice",
    body: "Implement a function LeetCode-style in your language, run sample tests instantly in a sandboxed worker, then submit for server-side judging with per-case verdicts. Hidden tests never reach the client.",
    points: ["JS / TS judged today; C++/Java/Python next", "Per-case AC/WA/TLE/MLE/RE verdicts", "Spaced repetition keeps it from fading"],
    href: "/practice",
    cta: "Browse problems",
  },
];

const steps = [
  { n: 1, title: "Watch it run", body: "See the algorithm move, one labelled step at a time — no hand-waving, no static diagrams." },
  { n: 2, title: "Learn the why", body: "Read the lesson, take the quizzes, and replay the exact step where the intuition clicks." },
  { n: 3, title: "Prove the cost", body: "Drop your implementation into the Complexity Lab and watch it scale against the curve." },
  { n: 4, title: "Practice & retain", body: "Solve the linked problem, then let spaced repetition resurface it before you forget." },
];

const principles = [
  { icon: Eye, title: "Trace, don't animate", body: "Algorithms emit a serialized trace; rendering is a pure function of it. That one decision buys exact backward stepping, scrubbing, deterministic tests, and shareable URLs." },
  { icon: Gauge, title: "Honest complexity", body: "Two independent methods — static analysis and measured growth — each with a confidence. Disagreement is surfaced, not hidden behind a single confident-sounding answer." },
  { icon: ShieldCheck, title: "Sandboxed judging", body: "Untrusted code runs only in isolated workers / a hardened judge — never on the main thread. Hidden test cases are never serialized to the browser." },
  { icon: Repeat, title: "Built to stick", body: "An SM-2 spaced-repetition scheduler, streaks, and XP turn a one-time read into durable recall — the difference between 'I saw that' and 'I can write that.'" },
];

const sources = [
  "CLRS — Introduction to Algorithms",
  "Sedgewick & Wayne — Algorithms (4th ed.)",
  "Competitive Programmer's Handbook",
  "cp-algorithms.com",
  "Cracking the Coding Interview",
];

export default function Home() {
  return (
    <div className="pb-24">
      {/* Hero */}
      <section className="relative grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
        <div
          className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-[420px] w-[820px] max-w-full -translate-x-1/2 rounded-full opacity-60 blur-3xl"
          style={{ background: "radial-gradient(closest-side, color-mix(in srgb, var(--primary) 22%, transparent), transparent)" }}
          aria-hidden
        />
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-subtle bg-surface px-3 py-1 text-xs font-medium text-secondary">
            <Sparkles className="size-3.5 text-primary" />
            Production-grade DSA learning platform
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            See the algorithm.
            <br />
            <span className="text-primary">Prove the complexity.</span>
            <br />
            Then write it.
          </h1>
          <p className="mt-5 max-w-[54ch] text-lg text-secondary">
            AlgoLens is where developers actually understand data structures &amp; algorithms — by
            watching them run step by step, measuring how they scale, and practicing in a real judge
            until it sticks. Four connected pillars, one visualization engine.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Get started — free
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/visualize"
              className="rounded-lg border border-subtle bg-surface px-5 py-2.5 font-medium text-foreground transition-colors hover:bg-raised"
            >
              Explore — no signup
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted">
            Visualize, Learn, Analyze &amp; Practice all work instantly — an account just syncs your
            progress across devices.
          </p>
        </div>
        <HeroViz />
      </section>

      {/* Stats band */}
      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-subtle bg-subtle sm:grid-cols-4">
        {stats.map(({ value, label }) => (
          <div key={label} className="bg-surface p-6 text-center">
            <div className="text-3xl font-bold text-foreground">{value}</div>
            <div className="mt-1 text-sm text-secondary">{label}</div>
          </div>
        ))}
      </section>

      {/* Four pillars */}
      <section className="mt-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Four pillars, one continuous loop</h2>
          <p className="mt-3 text-secondary">
            Context is never lost between tools — the same trace engine powers every screen, so what
            you watch is what you analyze and what you practice.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {pillars.map(({ icon: Icon, title, body, points, href, cta }) => (
            <div
              key={title}
              className="group rounded-2xl border border-subtle bg-surface p-6 transition-colors hover:border-primary/40"
            >
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-raised text-primary">
                  <Icon className="size-5" />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-secondary">{body}</p>
              <ul className="mt-4 space-y-1.5">
                {points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-secondary">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                    {p}
                  </li>
                ))}
              </ul>
              <Link
                href={href}
                className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                {cta}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mt-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">How a concept actually lands</h2>
          <p className="mt-3 text-secondary">From &ldquo;I&rsquo;ve heard of it&rdquo; to &ldquo;I can write it under pressure,&rdquo; in four moves.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ n, title, body }) => (
            <div key={n} className="rounded-2xl border border-subtle bg-surface p-6">
              <div className="grid size-9 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                {n}
              </div>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Principles */}
      <section className="mt-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Built on principles, not vibes</h2>
          <p className="mt-3 text-secondary">
            The engineering decisions that make AlgoLens trustworthy rather than just pretty.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {principles.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-4 rounded-2xl border border-subtle bg-surface p-6">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-raised text-primary">
                <Icon className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-secondary">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Canon / credibility */}
      <section className="mt-20 rounded-2xl border border-subtle bg-surface p-8 sm:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-primary">
              <GitBranch className="size-5" />
              <span className="text-sm font-medium uppercase tracking-wide">Grounded in the canon</span>
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              Researched from the books that define the field
            </h2>
            <p className="mt-3 text-secondary">
              Lessons are written for interviews and competitive programming, then cross-checked and
              cited against the standard references — not improvised. Every claim traces back to a
              source you can go read.
            </p>
          </div>
          <ul className="flex flex-wrap gap-2 lg:max-w-sm">
            {sources.map((s) => (
              <li
                key={s}
                className="rounded-full border border-subtle bg-raised px-3 py-1.5 text-sm text-secondary"
              >
                {s}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Final CTA */}
      <section
        className="mt-20 overflow-hidden rounded-2xl border border-subtle p-10 text-center sm:p-14"
        style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--primary) 14%, var(--surface)), var(--surface))" }}
      >
        <h2 className="text-3xl font-semibold tracking-tight">Watch it, prove it, then write it.</h2>
        <p className="mx-auto mt-3 max-w-[52ch] text-secondary">
          Start free — no credit card. Your progress, streaks, and review schedule follow you across
          devices the moment you create an account.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Create your free account
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/learn"
            className="rounded-lg border border-subtle bg-surface px-6 py-3 font-medium text-foreground transition-colors hover:bg-raised"
          >
            Start with a lesson
          </Link>
        </div>
      </section>
    </div>
  );
}
