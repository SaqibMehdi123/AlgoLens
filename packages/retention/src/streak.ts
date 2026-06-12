/**
 * Streak computation in the USER'S timezone (docs/03 note 4). Days are bucketed by local
 * calendar date, not UTC — so a learner in Karachi (UTC+5) who studies at 01:00 local
 * (= 20:00 UTC the previous day) still gets credit for the correct local day. Streaks tolerate
 * isolated one-day gaps when freezes are available (PRD D7: one freeze/week).
 */
const MS_PER_DAY = 86_400_000;

/** Local calendar date "YYYY-MM-DD" for a timestamp, given a tz offset in minutes (Karachi = 300). */
export function dayKey(timestamp: number, tzOffsetMinutes: number): string {
  return new Date(timestamp + tzOffsetMinutes * 60_000).toISOString().slice(0, 10);
}

function dayNumber(key: string): number {
  return Math.round(Date.parse(`${key}T00:00:00Z`) / MS_PER_DAY);
}

export interface StreakResult {
  current: number;
  longest: number;
  freezesUsed: number;
  /** Whether the user has been active on the current local day. */
  activeToday: boolean;
}

/**
 * @param activityDayKeys  local day keys on which the user earned XP (any order, dupes ok)
 * @param todayKey         the user's current local day key
 * @param freezesAvailable number of freezes that may bridge isolated missed days
 */
export function computeStreak(
  activityDayKeys: string[],
  todayKey: string,
  freezesAvailable = 0,
): StreakResult {
  const days = new Set(activityDayKeys.map(dayNumber));
  if (days.size === 0) return { current: 0, longest: 0, freezesUsed: 0, activeToday: false };

  const sorted = [...days].sort((a, b) => a - b);
  const minDay = sorted[0]!;

  // Longest run of consecutive active days anywhere in history.
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    run = sorted[i]! - sorted[i - 1]! === 1 ? run + 1 : 1;
    if (run > longest) longest = run;
  }

  const today = dayNumber(todayKey);
  const activeToday = days.has(today);

  // Grace for the in-progress day: if today isn't done yet, measure from yesterday.
  let cursor = activeToday ? today : today - 1;
  let current = 0;
  let freezesLeft = freezesAvailable;
  let freezesUsed = 0;
  while (cursor >= minDay) {
    if (days.has(cursor)) {
      current += 1;
      cursor -= 1;
    } else if (freezesLeft > 0) {
      // Only bridge a gap that has earlier activity to connect to.
      freezesLeft -= 1;
      freezesUsed += 1;
      cursor -= 1;
    } else {
      break;
    }
  }

  return { current, longest, freezesUsed, activeToday };
}
