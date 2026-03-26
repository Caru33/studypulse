"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Brain, BookOpen, ArrowRight } from "lucide-react";
import { MasteryRing } from "@/components/ui/MasteryRing";
import { createClient } from "@/lib/supabase/client";
import type { Course } from "@/types/database";
import { MOCK_COURSES } from "@/lib/mock-data";

const IS_MOCK =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project");

const QUIZ_MODES = [
  {
    id: "adaptive",
    label: "Adaptatif",
    desc: "L'IA sélectionne les concepts où tu as le plus de lacunes",
  },
  {
    id: "review",
    label: "Révision complète",
    desc: "Tous les concepts dans l'ordre, pour une révision systématique",
  },
  {
    id: "exam_prep",
    label: "Préparation examen",
    desc: "20 questions en mode simulation d'examen",
  },
] as const;

export default function NewQuizPage() {
  const router = useRouter();
  const supabase = createClient();

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<string>("adaptive");
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    async function load() {
      if (IS_MOCK) {
        setCourses(MOCK_COURSES);
        if (MOCK_COURSES.length > 0) setSelectedCourse(MOCK_COURSES[0].id);
        setLoading(false);
        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setCourses(MOCK_COURSES);
        if (MOCK_COURSES.length > 0) setSelectedCourse(MOCK_COURSES[0].id);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("courses")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      const loaded = data ?? [];
      setCourses(loaded);
      if (loaded.length > 0) setSelectedCourse(loaded[0].id);
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function startQuiz() {
    if (!selectedCourse) return;
    setStarting(true);
    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: selectedCourse,
          mode: selectedMode,
          question_count: selectedMode === "exam_prep" ? 20 : 5,
        }),
      });
      const data = await res.json();
      if (data.session_id) {
        if (data.questions) {
          sessionStorage.setItem(`quiz-${data.session_id}`, JSON.stringify(data.questions));
        }
        router.push(`/quiz/${data.session_id}`);
      }
    } finally {
      setStarting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl">
        {[1, 2].map((i) => (
          <div key={i} className="skeleton h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-20">
        <BookOpen size={48} className="mx-auto mb-4 text-sp-muted" />
        <h2 className="font-syne font-bold text-xl text-off-white mb-2">
          Aucun cours disponible
        </h2>
        <p className="text-sp-muted mb-6">Ajoutez un cours pour pouvoir commencer un quiz.</p>
        <Link
          href="/courses"
          className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
          style={{ background: "#4fffb0", color: "#0f1f3d" }}
        >
          Ajouter un cours
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-syne font-bold text-2xl text-off-white mb-8">Nouveau quiz</h1>

      {/* Step 1 — Course selection */}
      <section className="mb-8">
        <h2 className="font-syne font-bold text-xs text-sp-muted uppercase tracking-widest mb-3">
          1 — Choisir un cours
        </h2>
        <div className="space-y-2">
          {courses.map((course) => (
            <button
              key={course.id}
              onClick={() => setSelectedCourse(course.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                selectedCourse === course.id
                  ? "border-sp-accent/50 bg-sp-accent/5"
                  : "border-white/8 hover:border-white/20"
              }`}
            >
              <MasteryRing score={course.mastery_score} size={48} strokeWidth={4} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-off-white truncate">{course.title}</p>
                <p className="text-xs text-sp-muted mt-0.5">
                  {course.total_concepts} concepts
                  {course.exam_date
                    ? ` · Examen ${
                        new Date(course.exam_date).toLocaleDateString("fr-CA", {
                          month: "short",
                          day: "numeric",
                        })
                      }`
                    : ""}
                </p>
              </div>
              {selectedCourse === course.id && (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "#4fffb0" }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ background: "#0f1f3d" }} />
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Step 2 — Mode selection */}
      <section className="mb-8">
        <h2 className="font-syne font-bold text-xs text-sp-muted uppercase tracking-widest mb-3">
          2 — Choisir un mode
        </h2>
        <div className="space-y-2">
          {QUIZ_MODES.map(({ id, label, desc }) => (
            <button
              key={id}
              onClick={() => setSelectedMode(id)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
                selectedMode === id
                  ? "border-sp-accent/50 bg-sp-accent/5"
                  : "border-white/8 hover:border-white/20"
              }`}
            >
              <div>
                <p className="font-medium text-off-white">{label}</p>
                <p className="text-xs text-sp-muted mt-0.5">{desc}</p>
              </div>
              <Brain
                size={18}
                style={{ color: selectedMode === id ? "#4fffb0" : "#8a9bbf" }}
              />
            </button>
          ))}
        </div>
      </section>

      {/* Start button */}
      <button
        onClick={startQuiz}
        disabled={!selectedCourse || starting}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-base transition-all hover:opacity-90 disabled:opacity-40"
        style={{ background: "#4fffb0", color: "#0f1f3d" }}
      >
        {starting ? (
          <>
            <div className="w-4 h-4 rounded-full border-2 border-navy border-t-transparent animate-spin" />
            Génération du quiz...
          </>
        ) : (
          <>
            Commencer le quiz
            <ArrowRight size={18} />
          </>
        )}
      </button>
    </div>
  );
}
