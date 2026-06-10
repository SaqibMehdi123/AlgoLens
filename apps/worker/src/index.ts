/**
 * AlgoLens worker host (apps/worker).
 *
 * Phase 4+ runs BullMQ consumers here: the JS judge (isolated vm context), Judge0 orchestration,
 * AI explanation jobs, OG-image generation (satori), and the streak-freeze cron. For now it exposes
 * the job-name registry and a no-op bootstrap so the deployable shape exists from Phase 0.
 */
export const QUEUES = {
  judge: "judge",
  ai: "ai",
  ogImage: "og-image",
  streakFreeze: "streak-freeze",
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

export function describeWorker(): string {
  return `AlgoLens worker — queues: ${Object.values(QUEUES).join(", ")}`;
}

async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(describeWorker());
  // BullMQ Workers are registered here in Phase 4.
}

if (process.argv[1]?.endsWith("index.ts")) {
  void main();
}
