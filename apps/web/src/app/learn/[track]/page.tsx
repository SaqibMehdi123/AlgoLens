import { getTrack, tracks } from "@algolens/content";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TrackOutline } from "@/components/learn/track-progress";

export function generateStaticParams() {
  return tracks.map((t) => ({ track: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ track: string }> }) {
  const { track } = await params;
  const meta = getTrack(track);
  return meta ? { title: meta.title, description: meta.description } : { title: "Learn" };
}

export default async function TrackOverviewPage({
  params,
}: {
  params: Promise<{ track: string }>;
}) {
  const { track } = await params;
  const meta = getTrack(track);
  if (!meta) notFound();

  return (
    <div className="py-10">
      <Link
        href="/learn"
        className="inline-flex items-center gap-1 text-sm text-secondary transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        All tracks
      </Link>
      <header className="mb-8 mt-3">
        <h1 className="text-3xl font-semibold tracking-tight">{meta.title}</h1>
        <p className="mt-2 max-w-[64ch] text-secondary">{meta.description}</p>
      </header>
      <div className="max-w-3xl">
        <TrackOutline track={meta} />
      </div>
    </div>
  );
}
