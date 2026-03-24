"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { QuizQuestion } from "@/components/quiz/QuizQuestion";
import { LevelUpConfetti } from "@/components/ui/LevelUpConfetti";
import { MasteryRing } from "@/components/ui/MasteryRing";
import { ArrowLeft, Trophy, Brain } from "lucide-react";
import type { QuizQuestion as QuizQuestionType, LevelUpEvent } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { MOCK_QUIZ_QUESTIONS } from "@/lib/mock-data";

const IS_MOCK =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project");

type QuizState = "loading" | "quiz" | "results";

interface Answer {
  question_id: string;
  selected_option: number;
}

export default function QuizSessionPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const sessionId = params.sessionId as string;

  const [state, setState] = useState<QuizState>("loading");
  const [questions, setQuestions] = useState<QuizQuestionType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [results, setResults] = useState<{ score: number; correct: number; total: number; level_ups: LevelUpEvent[] } | null>(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    async function loadSession() {
      if (IS_MOCK) {
        // Use mock questions with sessionId injected
        const mockQs = MOCK_QUIZ_QUESTIONS.map((q) => ({ ...q, session_id: sessionId }));
        setQuestions(mockQs);
        setState("quiz");
        startTimeRef.current = Date.now();
        return;
      }

      const { data } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (!data || data.length === 0) {
        router.push("/quiz/new");
        return;
      }
      setQuestions(data);
      setState("quiz");
      startTimeRef.current = Date.now();
    }
    loadSession();
  }, [sessionId, supabase, router]);

  async function handleAnswer(selectedOption: number, isCorrect: boolean) {
    const question = questions[currentIndex];
    const newAnswers = [...answers, { question_id: question.id, selected_option: selectedOption }];
    setAnswers(newAnswers);

    // Short delay to show correct/incorrect before moving on
    await new Promise((r) => setTimeout(r, 1200));

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      // Last question — submit
      const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);

      if (IS_MOCK) {
        const correct = newAnswers.filter(
          (a, i) => a.selected_option === questions[i].correct_option
        ).length;
        setResults({
          score: correct / questions.length,
          correct,
          total: questions.length,
          level_ups: [],
        });
      } else {
        const res = await fetch("/api/quiz/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            answers: newAnswers,
            duration_seconds: durationSeconds,
          }),
        });
        const data = await res.json();
        setResults(data);
      }
      setState("results");
    }
  }

  if (state === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Brain size={40} style={{ color: "#4fffb0" }} className="mx-auto mb-3 animate-pulse" />
          <p className="text-sp-muted">Chargement des questions...</p>
        </div>
      </div>
    );
  }

  if (state === "results" && results) {
    const pct = Math.round(results.score * 100);
    return (
      <>
        <LevelUpConfetti events={results.level_ups} />
        <div className="max-w-lg mx-auto text-center py-8">
          <Trophy size={48} style={{ color: pct >= 70 ? "#4fffb0" : "#ffd93d" }} className="mx-auto mb-4" />
          <h1 className="font-syne font-bold text-3xl text-off-white mb-2">
            {pct >= 80 ? "Excellent !" : pct >= 60 ? "Bien joué !" : "Continuez !"}
          </h1>
          <p className="text-sp-muted mb-8">Session terminée</p>

          <div className="glass-card p-6 mb-6">
            <MasteryRing score={results.score} size={100} strokeWidth={8} />
            <p className="text-2xl font-bold text-off-white mt-4">
              {results.correct} / {results.total}
            </p>
            <p className="text-sp-muted text-sm">bonnes réponses</p>
          </div>

          {results.level_ups.length > 0 && (
            <div className="glass-card p-4 mb-6 text-left">
              <p className="font-semibold text-sp-accent text-sm mb-2">
                ⭐ Niveaux atteints !
              </p>
              {results.level_ups.map((e) => (
                <p key={e.concept_id} className="text-sm text-off-white">
                  {e.concept_title} → niveau {e.new_level}
                </p>
              ))}
            </div>
          )}

          {/* Per-question breakdown */}
          <div className="glass-card p-4 mb-6 text-left space-y-2">
            <p className="font-semibold text-off-white text-sm mb-3">Détail des réponses</p>
            {questions.map((q, i) => {
              const ans = answers[i];
              const correct = ans?.selected_option === q.correct_option;
              return (
                <div key={q.id} className="flex items-start gap-2">
                  <span className={`text-lg leading-none ${correct ? "text-sp-accent" : "text-danger"}`}>
                    {correct ? "✓" : "✗"}
                  </span>
                  <p className="text-sm text-sp-muted leading-snug line-clamp-2">{q.question_text}</p>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="flex-1 py-3 rounded-xl text-sm border border-white/10 text-sp-muted hover:text-off-white transition-colors text-center"
            >
              Tableau de bord
            </Link>
            <Link
              href="/quiz/new"
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-center transition-all hover:opacity-90"
              style={{ background: "#4fffb0", color: "#0f1f3d" }}
            >
              Nouveau quiz
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/quiz/new"
          className="flex items-center gap-1.5 text-sm text-sp-muted hover:text-off-white transition-colors"
        >
          <ArrowLeft size={14} />
          Quitter
        </Link>
      </div>
      <div className="flex-1">
        <QuizQuestion
          question={questions[currentIndex]}
          questionNumber={currentIndex + 1}
          totalQuestions={questions.length}
          onAnswer={handleAnswer}
        />
      </div>
    </div>
  );
}
