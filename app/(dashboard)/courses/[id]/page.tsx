"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Brain, Layers, ArrowLeft, Calendar, BookOpen } from "lucide-react";
import { MasteryRing } from "@/components/ui/MasteryRing";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getMasteryLevel, getDaysUntilExam, formatExamCountdown } from "@/lib/mastery";
import { createClient } from "@/lib/supabase/client";
import type { Course, Concept } from "@/types/database";
import { MOCK_COURSES, MOCK_CONCEPTS } from "@/lib/mock-data";

const IS_MOCK =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project");

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "concepts" | "quiz" | "flashcards">("overview");
  const [loading, setLoading] = useState(true);
  const [quizLoading, setQuizLoading] = useState(false);
  const [flashcardLoading, setFlashcardLoading] = useState(false);

  useEffect(() => {
    async function load() {
      if (IS_MOCK) {
        const found = MOCK_COURSES.find((c) => c.id === courseId);
        if (found) {
          setCourse(found);
          setConcepts(MOCK_CONCEPTS[courseId] ?? []);
        }
        setLoading(false);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [courseRes, conceptsRes] = await Promise.all([
        supabase.from("courses").select("*").eq("id", courseId).eq("user_id", user.id).single(),
        supabase.from("concepts").select("*").eq("course_id", courseId).order("mastery_score", { ascending: true }),
      ]);

      if (!courseRes.data) { router.push("/courses"); return; }
      setCourse(courseRes.data);
      setConcepts(conceptsRes.data ?? []);
      setLoading(false);
    }
    load();
  }, [courseId, supabase, router]);

  async function startQuiz(mode = "adaptive") {
    setQuizLoading(true);
    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id: courseId, mode, question_count: 5 }),
      });
      const data = await res.json();
      if (data.session_id) {
        // Store questions in sessionStorage so the quiz page can retrieve them
        if (data.questions) {
          sessionStorage.setItem(`quiz-${data.session_id}`, JSON.stringify(data.questions));
        }
        router.push(`/quiz/${data.session_id}`);
      }
    } finally {
      setQuizLoading(false);
    }
  }

  async function generateFlashcards() {
    setFlashcardLoading(true);
    try {
      await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id: courseId }),
      });
      router.push(`/flashcards/${courseId}`);
    } finally {
      setFlashcardLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48 rounded-lg" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  if (!course) return null;

  const { label: masteryLabel, color: masteryColor } = getMasteryLevel(course.mastery_score);
  const daysUntil = getDaysUntilExam(course.exam_date);
  const TABS = [
    { id: "overview", label: "Vue d'ensemble" },
    { id: "concepts", label: `Concepts (${concepts.length})` },
    { id: "quiz", label: "Quiz" },
    { id: "flashcards", label: "Flashcards" },
  ] as const;

  return (
    <>
      {/* Back */}
      <Link
        href="/courses"
        className="inline-flex items-center gap-2 text-sm text-sp-muted hover:text-off-white mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Retour aux cours
      </Link>

      {/* Course header */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="font-syne font-bold text-2xl text-off-white leading-tight">
              {course.title}
            </h1>
            {course.description && (
              <p className="text-sp-muted mt-2 text-sm">{course.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <span
                className="text-sm font-medium px-3 py-1 rounded-full"
                style={{ background: `${masteryColor}20`, color: masteryColor }}
              >
                {masteryLabel}
              </span>
              {course.exam_date && (
                <span
                  className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md ${
                    daysUntil !== null && daysUntil <= 3
                      ? "bg-danger/15 text-danger"
                      : "bg-white/5 text-sp-muted"
                  }`}
                >
                  <Calendar size={12} />
                  {formatExamCountdown(daysUntil)}
                </span>
              )}
              <span className="text-xs text-sp-muted flex items-center gap-1">
                <BookOpen size={12} />
                {course.total_concepts} concepts
              </span>
            </div>
          </div>
          <MasteryRing score={course.mastery_score} size={90} strokeWidth={6} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit" style={{ background: "rgba(26,50,96,0.6)" }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "text-navy"
                : "text-sp-muted hover:text-off-white"
            }`}
            style={activeTab === tab.id ? { background: "#4fffb0", color: "#0f1f3d" } : {}}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="glass-card p-5">
            <Brain size={24} style={{ color: "#4fffb0" }} className="mb-3" />
            <h3 className="font-syne font-bold text-off-white mb-1">Quiz adaptatif</h3>
            <p className="text-sm text-sp-muted mb-4">
              L&apos;algorithme sélectionne les concepts où vous avez le plus de lacunes.
            </p>
            <button
              onClick={() => startQuiz("adaptive")}
              disabled={quizLoading}
              className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "#4fffb0", color: "#0f1f3d" }}
            >
              {quizLoading ? "Génération..." : "Commencer le quiz"}
            </button>
          </div>

          <div className="glass-card p-5">
            <Layers size={24} style={{ color: "#ffd93d" }} className="mb-3" />
            <h3 className="font-syne font-bold text-off-white mb-1">Flashcards</h3>
            <p className="text-sm text-sp-muted mb-4">
              Révision espacée SM-2 pour une mémorisation à long terme.
            </p>
            <button
              onClick={generateFlashcards}
              disabled={flashcardLoading}
              className="w-full py-2.5 rounded-xl font-semibold text-sm border border-white/15 text-sp-muted hover:text-off-white hover:border-white/30 transition-all disabled:opacity-50"
            >
              {flashcardLoading ? "Génération..." : "Générer les flashcards"}
            </button>
          </div>
        </div>
      )}

      {activeTab === "concepts" && (
        <div className="space-y-2">
          {concepts.map((concept) => {
            const { color, label } = getMasteryLevel(concept.mastery_score);
            return (
              <div key={concept.id} className="glass-card p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h4 className="font-medium text-off-white">{concept.title}</h4>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: `${color}15`, color }}
                  >
                    {label}
                  </span>
                </div>
                <ProgressBar value={concept.mastery_score * 100} color={color} className="mb-2" />
                <p className="text-sm text-sp-muted line-clamp-2">{concept.content}</p>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "quiz" && (
        <div className="space-y-4">
          <div className="glass-card p-5">
            <h3 className="font-syne font-bold text-off-white mb-1">Modes de quiz</h3>
            <p className="text-sm text-sp-muted mb-4">Choisissez le mode adapté à votre session.</p>
            <div className="space-y-2">
              {[
                { mode: "adaptive", label: "Adaptatif", desc: "Priorité aux concepts les plus faibles" },
                { mode: "review", label: "Révision complète", desc: "Tous les concepts dans l'ordre" },
                { mode: "exam_prep", label: "Préparation examen", desc: "20 questions, simulation examen" },
              ].map(({ mode, label, desc }) => (
                <button
                  key={mode}
                  onClick={() => startQuiz(mode)}
                  disabled={quizLoading}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-white/8 hover:border-sp-accent/30 hover:bg-white/3 transition-all disabled:opacity-50 text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-off-white">{label}</p>
                    <p className="text-xs text-sp-muted">{desc}</p>
                  </div>
                  <Brain size={16} style={{ color: "#4fffb0" }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "flashcards" && (
        <div className="glass-card p-5 text-center">
          <Layers size={32} style={{ color: "#ffd93d" }} className="mx-auto mb-3" />
          <h3 className="font-syne font-bold text-off-white mb-2">Flashcards pour ce cours</h3>
          <p className="text-sm text-sp-muted mb-5">
            Les flashcards utilisent l&apos;algorithme SM-2 pour planifier les révisions au moment optimal.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={generateFlashcards}
              disabled={flashcardLoading}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "#4fffb0", color: "#0f1f3d" }}
            >
              {flashcardLoading ? "Génération..." : "Générer les flashcards"}
            </button>
            <Link
              href={`/flashcards/${courseId}`}
              className="px-5 py-2.5 rounded-xl text-sm border border-white/15 text-sp-muted hover:text-off-white transition-colors"
            >
              Réviser maintenant
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
