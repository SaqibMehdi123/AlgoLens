import { getTrack, tracks } from "@algolens/content";
import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TrackOutline, TrackProgressBar } from "@/components/learn/track-progress";

export function generateStaticParams() {
  return tracks.map((t) => ({ track: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ track: string }> }) {
  const { track } = await params;
  const meta = getTrack(track);
  return meta ? { title: meta.title, description: meta.description } : { title: "Learn" };
}

export default async function TrackOverviewPage({ params }: { params: Promise<{ track: string }> }) {
  const { track } = await params;
  const meta = getTrack(track);
  if (!meta) notFound();

  return (
    <div className="mx-auto w-full max-w-[880px] py-8">
      <Link
        href="/learn"
        className="inline-flex items-center gap-1.5 font-mono text-[12.5px] text-secondary transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All tracks
      </Link>

      <div className="mb-3.5 mt-5 flex flex-wrap items-start gap-[18px]">
        <div className="grid size-[52px] shrink-0 place-items-center rounded-[14px] bg-primary/10 text-primary">
          <BookOpen className="size-6" />
        </div>
        <div className="min-w-[240px] flex-1">
          <h1 className="text-[28px] font-bold tracking-[-0.02em] text-foreground">{meta.title}</h1>
          <p className="mt-1.5 max-w-[560px] text-[15px] leading-relaxed text-secondary">
            {meta.description}
          </p>
        </div>
      </div>

      <div className="mb-7">
        <TrackProgressBar track={meta} />
      </div>

      <TrackOutline track={meta} />
    </div>
  );
}
