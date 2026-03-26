"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, ArrowLeft, Trophy, RotateCcw } from "lucide-react";
import { QuizQuestion } from "@/components/quiz/QuizQuestion";
import { LevelUpConfetti } from "@/components/ui/LevelUpConfetti";
import { MOCK_QUIZ_QUESTIONS } from "@/lib/mock-data";
import type { QuizQuestion as QuizQuestionType } from "@/types/database";

const IS_MOCK =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project");

interface Answer {
  question_id: string;
  concept_id: string;
  answer: number;
  is_correct: boolean;
}

export default function QuizSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [questions, setQuestions] = useState<QuizQuestionType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [completed, setCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [loading, setLoading] = useState(true);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    // 1. Try sessionStorage (populated by courses/new quiz pages before redirect)
    const stored =
      typeof window !== "undefined" ? sessionStorage.getItem(`quiz-${sessionId}`) : null;
    if (stored) {
      try {
        setQuestions(JSON.parse(stored));
        setLoading(false);
        return;
      } catch {
        // malformed JSON, fall through
      }
    }

    // 2. Mock fallback
    if (IS_MOCK || sessionId.startsWith("mock-")) {
      const qs: QuizQuestionType[] = Array.from({ length: 5 }, (_, i) => ({
        ...MOCK_QUIZ_QUESTIONS[i % MOCK_QUIZ_QUESTIONS.length],
        id: `${MOCK_QUIZ_QUESTIONS[i % MOCK_QUIZ_QUESTIONS.length].id}-${i}`,
        session_id: sessionId,
      }));
      setQuestions(qs);
      setLoading(false);
      return;
    }

    // 3. Real mode: questions should have been in sessionStorage.
    // If we arrive here, the session was likely navigated to directly.
    // Show an empty state with a helpful message.
    setLoading(false);
  }, [sessionId]);

  async function handleAnswer(selectedOption: number, isCorrect: boolean) {
    const q = questions[currentIndex];
    const newAnswer: Answer = {
      question_id: q.id,
      concept_id: q.concept_id,
      answer: selectedOption,
      is_correct: isCorrect,
    };

    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);

    if (currentIndex < questions.length - 1) {
      setTimeout(() => setCurrentIndex((i) => i + 1), 1400);
    } else {
      // Last question — finalize
      const correct = updatedAnswers.filter((a) => a.is_correct).length;
      const score = questions.length > 0 ? correct / questions.length : 0;
      setFinalScore(score);

      // Submit to API (fire and forget)
      if (!IS_MOCK && !sessionId.startsWith("mock-")) {
        fetch("/api/quiz/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            answers: updatedAnswers,
            duration_seconds: Math.floor((Date.now() - startTimeRef.current) / 1000),
          }),
        }).catch(console.error);
      }

      // Clean up sessionStorage
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(`quiz-${sessionId}`);
      }

      if (score >= 0.7) setShowConfetti(true);
      setTimeout(() => setCompleted(true), 1400);
    }
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-sp-accent border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-sp-muted">Chargement du quiz...</p>
        </div>
      </div>
    );
  }

  // ── Empty ──
  if (!loading && questions.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-sp-muted mb-4">Aucune question trouvée pour cette session.</p>
        <Link href="/courses" className="text-sp-accent hover:underline">
          Retour aux cours
        </Link>
      </div>
    );
  }

  // ── Results screen ──
  if (completed) {
    const correct = answers.filter((a) => a.is_correct).length;
    const pct = Math.round(finalScore * 100);

    return (
      <div className="max-w-md mx-auto py-8 text-center">
        {showConfetti && <LevelUpConfetti />}

        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{
            background:
              finalScore >= 0.7 ? "rgba(79,255,176,0.1)" : "rgba(255,107,107,0.1)",
          }}
        >
          {finalScore >= 0.7 ? (
            <Trophy size={44} style={{ color: "#4fffb0" }} />
          ) : (
            <XCircle size={44} style={{ color: "#ff6b6b" }} />
          )}
        </div>

        <h1 className="font-syne font-bold text-4xl text-off-white mb-1">{pct}%</h1>
        <p className="text-sp-muted mb-2">
          {correct} bonne{correct > 1 ? "s" : ""} réponse{correct > 1 ? "s" : ""} sur{" "}
          {questions.length}
        </p>
        <p
          className="text-sm font-medium mb-8"
          style={{ color: finalScore >= 0.7 ? "#4fffb0" : "#ff6b6b" }}
        >
          {finalScore >= 0.9
            ? "Excellent ! Maîtrise parfaite 🌟"
            : finalScore >= 0.7
            ? "Très bien ! Continue comme ça 💪"
            : finalScore >= 0.5
            ? "Pas mal, quelques lacunes à combler 📚"
            : "Ces concepts nécessitent plus de révision 🔄"}
        </p>

        {/* Answer recap */}
        <div className="glass-card p-4 mb-6 text-left">
          <p className="text-sm font-semibold text-off-white mb-3">Récapitulatif</p>
          <div className="space-y-2">
            {answers.map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                {a.is_correct ? (
                  <CheckCircle
                    size={14}
                    style={{ color: "#2dd68a" }}
                    className="flex-shrink-0"
                  />
                ) : (
                  <XCircle
                    size={14}
                    style={{ color: "#ff6b6b" }}
                    className="flex-shrink-0"
                  />
                )}
                <span className={a.is_correct ? "text-off-white" : "text-sp-muted"}>
                  Question {i + 1}
                </span>
                <span
                  className="ml-auto text-xs font-medium"
                  style={{ color: a.is_correct ? "#2dd68a" : "#ff6b6b" }}
                >
                  {a.is_correct ? "✓" : "✗"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href="/courses"
            className="flex-1 py-3 rounded-xl text-sm border border-white/10 text-sp-muted hover:text-off-white transition-colors text-center flex items-center justify-center gap-2"
          >
            <ArrowLeft size={14} />
            Mes cours
          </Link>
          <button
            onClick={() => router.back()}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 flex items-center justify-center gap-2"
            style={{ background: "#4fffb0", color: "#0f1f3d" }}
          >
            <RotateCcw size={14} />
            Rejouer
          </button>
        </div>
      </div>
    );
  }

  // ── Active quiz ──
  return (
    <div className="min-h-[70vh] flex flex-col">
      <QuizQuestion
        question={questions[currentIndex]}
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
        onAnswer={handleAnswer}
      />
    </div>
  );
}
