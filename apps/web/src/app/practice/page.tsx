import { ComingSoon } from "@/components/coming-soon";

export const metadata = { title: "Practice" };

export default function PracticePage() {
  return (
    <ComingSoon
      pillar="Practice"
      phase="Phase 4 · Roadmap"
      blurb="Problems with a sandboxed judge: write code in Monaco, run sample tests instantly in a Web Worker, then submit for server-side judging with per-case verdicts."
      bullets={[
        "Monaco workspace; client-side sample runs in an exec-worker (step-capped)",
        "Server judge: isolated vm context, 2s/128MB, AC/WA/TLE/MLE/RE/CE verdicts",
        "Hidden test cases never serialized to the client; SSE live status",
      ]}
    />
  );
}
