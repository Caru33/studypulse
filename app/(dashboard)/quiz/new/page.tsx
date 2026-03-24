"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Brain } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Course } from "@/types/database";
import { MOCK_COURSES } from "@/lib/mock-data";

const IS_MOCK =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project");

function NewQuizContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const preselectedCourseId = searchParams.get("courseId");

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState(preselectedCourseId ?? "");
  const [questionCount, setQuestionCount] = useState(5);
  const [mode, setMode] = useState("adaptive");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadCourses() {
      if (IS_MOCK) { setCourses(MOCK_COURSES); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("courses").select("*").eq("user_id", user.id);
      setCourses((data as Course[]) ?? []);
    }
    loadCourses();
  }, [supabase]);

  async function startQuiz() {
    if (!selectedCourseId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id: selectedCourseId, mode, question_count: questionCount }),
      });
      const data = await res.json();
      if (data.session_id) {
        router.push(`/quiz/${data.session_id}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="font-syne font-bold text-2xl text-off-white">Nouveau quiz</h1>
        <p className="text-sp-muted text-sm mt-1">Configurez votre session de quiz</p>
      </div>

      <div className="glass-card p-6 space-y-5">
        <div>
          <label className="block text-sm text-sp-muted mb-2">Cours</label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm text-off-white outline-none focus:ring-1 focus:ring-sp-accent"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <option value="">Sélectionner un cours...</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-sp-muted mb-2">Mode</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "adaptive", label: "Adaptatif" },
              { id: "review", label: "Révision" },
              { id: "exam_prep", label: "Examen" },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                  mode === id ? "text-navy" : "text-sp-muted border border-white/10 hover:border-white/20"
                }`}
                style={mode === id ? { background: "#4fffb0", color: "#0f1f3d" } : {}}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-sp-muted mb-2">
            Nombre de questions : <span className="text-off-white">{questionCount}</span>
          </label>
          <input
            type="range"
            min={3}
            max={20}
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            className="w-full accent-sp-accent"
          />
          <div className="flex justify-between text-xs text-sp-muted mt-1">
            <span>3</span><span>20</span>
          </div>
        </div>

        <button
          onClick={startQuiz}
          disabled={!selectedCourseId || loading}
          className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-40"
          style={{ background: "#4fffb0", color: "#0f1f3d" }}
        >
          {loading ? (
            "Génération des questions..."
          ) : (
            <>
              <Brain size={18} />
              Commencer le quiz
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function NewQuizPage() {
  return (
    <Suspense fallback={<div className="skeleton h-64 rounded-2xl max-w-lg mx-auto" />}>
      <NewQuizContent />
    </Suspense>
  );
}
