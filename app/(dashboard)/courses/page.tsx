"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { Plus, BookOpen } from "lucide-react";
import { CourseCard } from "@/components/dashboard/CourseCard";
import { UploadModal } from "@/components/upload/UploadModal";
import { UpgradeModal } from "@/components/dashboard/UpgradeModal";
import { createClient } from "@/lib/supabase/client";
import type { Course } from "@/types/database";
import { MOCK_COURSES } from "@/lib/mock-data";

const IS_MOCK =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project");

export default function CoursesPage() {
  const supabase = createClient();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");

  async function loadCourses() {
    if (IS_MOCK) {
      setCourses(MOCK_COURSES);
      setLoading(false);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setCourses(MOCK_COURSES);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("courses")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    setCourses(data ?? []);
    setLoading(false);
  }

  useEffect(() => { loadCourses(); }, []);

  async function handleAddCourse() {
    if (IS_MOCK) { setUploadOpen(true); return; }

    // Check limit before opening modal
    const res = await fetch("/api/courses/upload", { method: "HEAD" }).catch(() => null);
    // Just open the modal and let the API route handle the gate
    setUploadOpen(true);
  }

  return (
    <>
      <UploadModal
        open={uploadOpen}
        onClose={() => { setUploadOpen(false); loadCourses(); }}
      />
      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        reason={upgradeReason}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-syne font-bold text-2xl text-off-white">Mes cours</h1>
          <p className="text-sp-muted text-sm mt-1">
            {courses.length} cours · {courses.reduce((s, c) => s + c.total_concepts, 0)} concepts
          </p>
        </div>
        <button
          onClick={handleAddCourse}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
          style={{ background: "#4fffb0", color: "#0f1f3d" }}
        >
          <Plus size={16} />
          Ajouter un cours
        </button>
      </div>

      {/* Courses grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-52 rounded-2xl" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(79,255,176,0.1)" }}
          >
            <BookOpen size={36} style={{ color: "#4fffb0" }} />
          </div>
          <h2 className="font-syne font-bold text-xl text-off-white mb-2">
            Aucun cours pour l&apos;instant
          </h2>
          <p className="text-sp-muted max-w-sm mb-6">
            Ajoutez votre premier cours en téléversant un PDF. StudyPulse extraira
            automatiquement les concepts clés.
          </p>
          <button
            onClick={handleAddCourse}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover:opacity-90"
            style={{ background: "#4fffb0", color: "#0f1f3d" }}
          >
            <Plus size={16} />
            Ajouter mon premier cours
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}

          {/* Add more card */}
          <button
            onClick={handleAddCourse}
            className="border-2 border-dashed border-white/15 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-sp-accent/50 hover:bg-white/3 transition-all text-sp-muted hover:text-sp-accent"
          >
            <Plus size={28} />
            <span className="text-sm font-medium">Ajouter un cours</span>
          </button>
        </div>
      )}

      {/* FAB on mobile */}
      <button
        onClick={handleAddCourse}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center lg:hidden z-20 transition-all hover:scale-105 active:scale-95"
        style={{ background: "#4fffb0" }}
        aria-label="Ajouter un cours"
      >
        <Plus size={24} color="#0f1f3d" />
      </button>
    </>
  );
}
