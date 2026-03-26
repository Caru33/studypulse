"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Layers, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Course } from "@/types/database";
import { MOCK_COURSES } from "@/lib/mock-data";

const IS_MOCK =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project");

export default function FlashcardsIndexPage() {
  const supabase = createClient();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (IS_MOCK) { setCourses(MOCK_COURSES); setLoading(false); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCourses(MOCK_COURSES);
        setLoading(false);
        return;
      }
      const { data } = await supabase.from("courses").select("*").eq("user_id", user.id);
      setCourses(data ?? []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  return (
    <>
      <div className="mb-8">
        <h1 className="font-syne font-bold text-2xl text-off-white">Flashcards</h1>
        <p className="text-sp-muted text-sm mt-1">Révision espacée SM-2</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16">
          <Layers size={40} className="mx-auto mb-3 text-sp-muted" />
          <p className="text-off-white font-medium mb-1">Aucun cours disponible</p>
          <p className="text-sm text-sp-muted mb-4">Ajoutez un cours pour générer des flashcards.</p>
          <Link href="/courses" className="text-sp-accent hover:underline text-sm">
            Aller à mes cours →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/flashcards/${course.id}`}
              className="glass-card p-4 flex items-center gap-4 hover:border-sp-accent/30 transition-all"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,217,61,0.1)" }}
              >
                <Layers size={20} style={{ color: "#ffd93d" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-off-white truncate">{course.title}</p>
                <p className="text-sm text-sp-muted">{course.total_concepts} concepts</p>
              </div>
              <BookOpen size={16} className="text-sp-muted flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
