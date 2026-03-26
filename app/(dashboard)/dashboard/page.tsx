"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CourseCard } from "@/components/dashboard/CourseCard";
import { StudyPlanDay } from "@/components/dashboard/StudyPlanDay";
import { StreakBadge } from "@/components/dashboard/StreakBadge";
import { Brain, BookOpen, RefreshCw, Plus, Calendar } from "lucide-react";
import type { Course, StudyPlan, Profile } from "@/types/database";
import { getDaysUntilExam } from "@/lib/mastery";
import { MOCK_COURSES, MOCK_STUDY_PLAN, MOCK_PROFILE } from "@/lib/mock-data";

const IS_MOCK =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project");

function OnboardingModal({ onClose }: { onClose: () => void }) {
  const [university, setUniversity] = useState("");
  const [program, setProgram] = useState("");
  const supabase = createClient();

  async function handleSave() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && university) {
      await supabase.from("profiles").update({ university, program }).eq("id", user.id);
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-card p-8 max-w-md w-full animate-fade-up">
        <h2 className="font-syne font-bold text-2xl text-off-white mb-2">
          Bienvenue sur StudyPulse ! 🎉
        </h2>
        <p className="text-sp-muted text-sm mb-6">
          Dites-nous en plus pour personnaliser votre expérience.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-sp-muted mb-1.5">
              Votre université
            </label>
            <select
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm text-off-white outline-none focus:ring-1 focus:ring-sp-accent"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <option value="">Sélectionner...</option>
              <option>Université de Montréal</option>
              <option>Université Laval</option>
              <option>McGill University</option>
              <option>Concordia University</option>
              <option>UQAM</option>
              <option>UQTR</option>
              <option>Université de Sherbrooke</option>
              <option>Polytechnique Montréal</option>
              <option>HEC Montréal</option>
              <option>Autre</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-sp-muted mb-1.5">
              Votre programme
            </label>
            <input
              type="text"
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              placeholder="Ex: Pharmacie, Génie informatique..."
              className="w-full px-4 py-3 rounded-xl text-sm text-off-white placeholder-sp-muted outline-none focus:ring-1 focus:ring-sp-accent"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm text-sp-muted border border-white/10 hover:border-white/20 transition-colors"
          >
            Passer
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: "#4fffb0", color: "#0f1f3d" }}
          >
            Commencer
          </button>
        </div>
      </div>
    </div>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [streak, setStreak] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (searchParams.get("onboarding") === "true") {
      setShowOnboarding(true);
      router.replace("/dashboard");
    }
    if (searchParams.get("upgraded") === "true") {
      router.replace("/dashboard");
    }
  }, [searchParams, router]);

  useEffect(() => {
    async function load() {
      if (IS_MOCK) {
        setProfile(MOCK_PROFILE);
        setCourses(MOCK_COURSES);
        setStudyPlan(MOCK_STUDY_PLAN);
        setStreak(3);
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // No auth in demo mode — fall back to mock data
        setProfile(MOCK_PROFILE);
        setCourses(MOCK_COURSES);
        setStudyPlan(MOCK_STUDY_PLAN);
        setStreak(3);
        setLoading(false);
        return;
      }

      const [profileRes, coursesRes, planRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("courses").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }),
        supabase.from("study_plans").select("*").eq("user_id", user.id).eq("is_active", true).order("generated_at", { ascending: false }).limit(1).single(),
      ]);

      setProfile(profileRes.data);
      setCourses(coursesRes.data ?? []);
      setStudyPlan(planRes.data);

      // Get streak via RPC
      const { data: streakData } = await supabase.rpc("get_study_streak", { p_user_id: user.id });
      setStreak(streakData ?? 0);
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function generatePlan() {
    setGeneratingPlan(true);
    try {
      const res = await fetch("/api/study-plan/generate", { method: "POST" });
      const data = await res.json();
      if (data.plan) setStudyPlan(data.plan);
    } finally {
      setGeneratingPlan(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  const nextExam = courses
    .filter((c) => c.exam_date)
    .map((c) => ({ ...c, days: getDaysUntilExam(c.exam_date) ?? Infinity }))
    .filter((c) => c.days >= 0)
    .sort((a, b) => a.days - b.days)[0];

  const today = new Date().toISOString().split("T")[0];
  const todayPlanDay = studyPlan?.plan_data?.days?.find((d) => d.date === today);

  return (
    <>
      {showOnboarding && (
        <OnboardingModal onClose={() => setShowOnboarding(false)} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-syne font-bold text-2xl text-off-white">
            Bonjour, {profile?.full_name?.split(" ")[0] ?? "étudiant·e"} 👋
          </h1>
          <p className="text-sp-muted text-sm mt-1">
            {new Date().toLocaleDateString("fr-CA", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        <StreakBadge streak={streak} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's plan */}
          {todayPlanDay ? (
            <div>
              <h2 className="font-syne font-bold text-lg text-off-white mb-3">
                Plan du jour
              </h2>
              <StudyPlanDay day={todayPlanDay} isToday />
            </div>
          ) : (
            <div className="glass-card p-6 text-center">
              <Brain size={32} className="mx-auto mb-3" style={{ color: "#4fffb0" }} />
              <h3 className="font-syne font-bold text-off-white mb-1">
                Pas encore de plan d&apos;étude
              </h3>
              <p className="text-sm text-sp-muted mb-4">
                Générez un plan personnalisé basé sur vos cours et examens.
              </p>
              <button
                onClick={generatePlan}
                disabled={generatingPlan || courses.length === 0}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-40 flex items-center gap-2 mx-auto"
                style={{ background: "#4fffb0", color: "#0f1f3d" }}
              >
                {generatingPlan ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Génération...
                  </>
                ) : (
                  "Générer mon plan"
                )}
              </button>
            </div>
          )}

          {/* Courses */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-syne font-bold text-lg text-off-white">
                Mes cours
              </h2>
              <Link
                href="/courses"
                className="text-sm text-sp-accent hover:underline"
              >
                Voir tous
              </Link>
            </div>

            {courses.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <BookOpen size={32} className="mx-auto mb-3 text-sp-muted" />
                <p className="text-off-white font-medium mb-1">
                  Aucun cours pour l&apos;instant
                </p>
                <p className="text-sm text-sp-muted mb-4">
                  Ajoutez votre premier cours PDF pour commencer.
                </p>
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
                  style={{ background: "#4fffb0", color: "#0f1f3d" }}
                >
                  <Plus size={14} />
                  Ajouter un cours
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {courses.slice(0, 4).map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: stats sidebar */}
        <div className="space-y-4">
          {/* Next exam */}
          {nextExam && (
            <div
              className="glass-card p-4"
              style={
                nextExam.days <= 3
                  ? { borderColor: "rgba(255,107,107,0.3)" }
                  : {}
              }
            >
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={16} style={{ color: nextExam.days <= 3 ? "#ff6b6b" : "#4fffb0" }} />
                <span className="text-sm font-semibold text-off-white">
                  Prochain examen
                </span>
              </div>
              <p className="font-syne font-bold text-off-white truncate">{nextExam.title}</p>
              <p
                className="text-sm mt-1 font-medium"
                style={{ color: nextExam.days <= 3 ? "#ff6b6b" : "#4fffb0" }}
              >
                {nextExam.days === 0
                  ? "Aujourd'hui !"
                  : nextExam.days === 1
                  ? "Demain !"
                  : `Dans ${nextExam.days} jours`}
              </p>
            </div>
          )}

          {/* Overall stats */}
          <div className="glass-card p-4">
            <h3 className="font-syne font-bold text-sm text-off-white mb-3">
              Statistiques
            </h3>
            <div className="space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-sp-muted">Cours actifs</span>
                <span className="text-off-white font-medium">{courses.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-sp-muted">Concepts total</span>
                <span className="text-off-white font-medium">
                  {courses.reduce((s, c) => s + c.total_concepts, 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-sp-muted">Maîtrise moyenne</span>
                <span className="font-medium" style={{ color: "#4fffb0" }}>
                  {courses.length > 0
                    ? Math.round(
                        (courses.reduce((s, c) => s + c.mastery_score, 0) /
                          courses.length) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Regenerate plan */}
          {studyPlan && (
            <button
              onClick={generatePlan}
              disabled={generatingPlan}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-sp-muted border border-white/10 hover:border-white/20 transition-all disabled:opacity-40"
            >
              <RefreshCw size={14} className={generatingPlan ? "animate-spin" : ""} />
              {generatingPlan ? "Mise à jour..." : "Mettre à jour le plan"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}</div>}>
      <DashboardContent />
    </Suspense>
  );
}
