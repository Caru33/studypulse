// SM-2 Spaced Repetition Algorithm
// Based on: https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method

export interface SM2State {
  ease_factor: number; // default 2.5, min 1.3
  interval_days: number; // days until next review
  repetitions: number; // number of successful reviews
}

export interface SM2Result extends SM2State {
  next_review_date: string; // ISO date YYYY-MM-DD
}

/**
 * Calculate next review state using SM-2 algorithm.
 * @param quality - Response quality: 1=blackout, 2=wrong but familiar, 3=correct with difficulty, 4=correct, 5=perfect
 * @param state - Current SM-2 state
 */
export function sm2(quality: number, state: SM2State): SM2Result {
  let { ease_factor, interval_days, repetitions } = state;

  if (quality >= 3) {
    // Correct response
    if (repetitions === 0) {
      interval_days = 1;
    } else if (repetitions === 1) {
      interval_days = 6;
    } else {
      interval_days = Math.round(interval_days * ease_factor);
    }
    repetitions += 1;

    // Update ease factor
    ease_factor =
      ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
    ease_factor = Math.max(1.3, ease_factor);
  } else {
    // Incorrect response — reset
    interval_days = 1;
    repetitions = 0;
    // ease_factor doesn't change on failure (user was just wrong)
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval_days);
  const next_review_date = nextDate.toISOString().split("T")[0];

  return { ease_factor, interval_days, repetitions, next_review_date };
}

// Maps UI difficulty buttons to SM-2 quality scores
export const QUALITY_MAP = {
  facile: 5,
  correct: 4,
  difficile: 2,
  a_revoir: 1,
} as const;

export type DifficultyRating = keyof typeof QUALITY_MAP;

// Returns human-readable label for interval
export function formatInterval(days: number): string {
  if (days === 1) return "demain";
  if (days < 7) return `dans ${days} jours`;
  if (days < 14) return "dans 1 semaine";
  if (days < 30) return `dans ${Math.round(days / 7)} semaines`;
  return `dans ${Math.round(days / 30)} mois`;
}
