import { ReviewSession } from "@/components/review/review-session";

export const metadata = {
  title: "Review",
  description: "Your daily spaced-repetition review queue.",
};

export default function ReviewPage() {
  return <ReviewSession />;
}
