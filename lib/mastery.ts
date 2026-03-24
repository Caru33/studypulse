import type { Concept } from "@/types/database";

// =========================================================
// Mastery score update (Bayesian-inspired incremental update)
// =========================================================

/**
 * Update a concept's mastery score after a quiz answer.
 * Correct: score moves toward 1.0 by 20% of the gap
 * Wrong: score decays by 20%
 */
export function updateMasteryScore(
  current: number,
  isCorrect: boolean
): number {
  if (isCorrect) {
    return current + (1 - current) * 0.2;
  }
  return current * 0.8;
}

// =========================================================
// Mastery level classification
// =========================================================

export interface MasteryLevel {
  level: 1 | 2 | 3 | 4 | 5;
  label: string;
  color: string;
  emoji: string;
}

export function getMasteryLevel(score: number): MasteryLevel {
  if (score < 0.2)
    return { level: 1, label: "Débutant", color: "#ff6b6b", emoji: "🔴" };
  if (score < 0.4)
    return {
      level: 2,
      label: "En progression",
      color: "#ffd93d",
      emoji: "🟡",
    };
  if (score < 0.6)
    return {
      level: 3,
      label: "Intermédiaire",
      color: "#8a9bbf",
      emoji: "🔵",
    };
  if (score < 0.8)
    return { level: 4, label: "Avancé", color: "#2dd68a", emoji: "🟢" };
  return { level: 5, label: "Expert", color: "#4fffb0", emoji: "⭐" };
}

// =========================================================
// Adaptive quiz concept selection
// =========================================================

/**
 * Select concepts for a quiz, prioritizing:
 * - Low mastery score (60% weight)
 * - Concepts not tested recently (40% weight)
 */
export function selectConceptsForQuiz(
  concepts: Concept[],
  count: number
): Concept[] {
  const now = Date.now();
  const RECENCY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  const ranked = concepts.map((c) => {
    const recencyMs = c.last_tested_at
      ? now - new Date(c.last_tested_at).getTime()
      : Infinity;
    const recencyWeight = Math.min(recencyMs / RECENCY_WINDOW_MS, 1);
    const priority = (1 - c.mastery_score) * 0.6 + recencyWeight * 0.4;
    return { concept: c, priority };
  });

  return ranked
    .sort((a, b) => b.priority - a.priority)
    .slice(0, count)
    .map((r) => r.concept);
}

// =========================================================
// Exam countdown helper
// =========================================================

export function getDaysUntilExam(examDate: string | null): number | null {
  if (!examDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(examDate);
  const diff = Math.ceil(
    (exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diff;
}

export function formatExamCountdown(days: number | null): string {
  if (days === null) return "Pas d'examen programmé";
  if (days < 0) return "Examen passé";
  if (days === 0) return "Examen aujourd'hui !";
  if (days === 1) return "Examen demain !";
  if (days <= 3) return `Examen dans ${days} jours ⚠️`;
  if (days <= 7) return `Examen dans ${days} jours`;
  return `Examen dans ${days} jours`;
}
