import type { SubmissionEvent } from "@algolens/api-contracts";
import { getSubmission, subscribeToSubmission } from "@/lib/submissions";
import { problemResponse } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/submissions/:id/events — SSE stream (TRD §8 / app-flow journey 5).
 * Every connection starts with a full snapshot, so EventSource's automatic reconnect is
 * idempotent by construction — a dropped connection re-syncs on the next snapshot.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const current = getSubmission(id);
  if (!current) return problemResponse(404, "Submission not found");

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (event: SubmissionEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      send({ type: "snapshot", submission: current });

      const isFinal = (status: string) => status !== "queued" && status !== "running";

      if (isFinal(current.status)) {
        send({ type: "done", submission: current });
        controller.close();
        return;
      }

      const unsubscribe = subscribeToSubmission(id, (event) => {
        send(event);
        if (event.type === "done") {
          unsubscribe();
          clearInterval(heartbeat);
          controller.close();
        }
      });

      // Keep proxies from buffering/idling the connection out.
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: ping\n\n`));
      }, 15_000);
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
