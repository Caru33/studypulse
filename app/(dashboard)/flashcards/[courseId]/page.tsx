"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Layers } from "lucide-react";
import { FlashCard } from "@/components/flashcards/FlashCard";
import { createClient } from "@/lib/supabase/client";
import type { Flashcard } from "@/types/database";
import type { DifficultyRating } from "@/lib/sm2";
import { formatInterval } from "@/lib/sm2";
import { MOCK_FLASHCARDS } from "@/lib/mock-data";

const IS_MOCK =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project");

export default function FlashcardsPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const courseId = params.courseId as string;

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewedCount, setReviewedCount] = useState(0);

  useEffect(() => {
    async function loadFlashcards() {
      if (IS_MOCK) {
        const due = MOCK_FLASHCARDS.filter((f) => {
          const today = new Date().toISOString().split("T")[0];
          return f.course_id === courseId && f.next_review_date <= today;
        });
        setCards(due.length > 0 ? due : MOCK_FLASHCARDS.slice(0, 3));
        setLoading(false);
        return;
      }

      const today = new Date().toISOString().split("T")[0];
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("flashcards")
        .select("*")
        .eq("course_id", courseId)
        .eq("user_id", user.id)
        .lte("next_review_date", today)
        .order("next_review_date", { ascending: true });

      if (!data || data.length === 0) {
        // No cards due — generate some
        const res = await fetch("/api/flashcards/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_id: courseId }),
        });
        const genData = await res.json();
        setCards(genData.flashcards ?? []);
      } else {
        setCards(data);
      }
      setLoading(false);
    }
    loadFlashcards();
  }, [courseId, supabase]);

  async function handleRate(rating: DifficultyRating) {
    const card = cards[currentIndex];

    if (!IS_MOCK) {
      await fetch("/api/flashcards/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flashcard_id: card.id, rating }),
      });
    }

    setReviewedCount((n) => n + 1);

    if (currentIndex < cards.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setCompleted(true);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Layers size={40} style={{ color: "#ffd93d" }} className="mx-auto mb-3 animate-pulse" />
          <p className="text-sp-muted">Chargement des flashcards...</p>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(45,214,138,0.15)" }}
        >
          <CheckCircle size={40} style={{ color: "#2dd68a" }} />
        </div>
        <h1 className="font-syne font-bold text-2xl text-off-white mb-2">
          Session terminée !
        </h1>
        <p className="text-sp-muted mb-6">
          {reviewedCount} flashcard{reviewedCount > 1 ? "s" : ""} révisée{reviewedCount > 1 ? "s" : ""}
        </p>

        <div className="glass-card p-4 mb-6 text-left space-y-2">
          <p className="text-sm font-semibold text-off-white mb-2">Prochaines révisions</p>
          {cards.slice(0, 5).map((card) => (
            <div key={card.id} className="flex items-center justify-between text-sm">
              <p className="text-sp-muted truncate flex-1 mr-3">{card.front}</p>
              <span className="text-xs text-sp-accent flex-shrink-0">
                {formatInterval(card.interval_days)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Link
            href={`/courses/${courseId}`}
            className="flex-1 py-3 rounded-xl text-sm border border-white/10 text-sp-muted hover:text-off-white transition-colors text-center"
          >
            Retour au cours
          </Link>
          <Link
            href="/dashboard"
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-center transition-all hover:opacity-90"
            style={{ background: "#4fffb0", color: "#0f1f3d" }}
          >
            Tableau de bord
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/courses/${courseId}`}
          className="flex items-center gap-1.5 text-sm text-sp-muted hover:text-off-white transition-colors"
        >
          <ArrowLeft size={14} />
          Retour
        </Link>
        <div className="text-sm text-sp-muted">
          {currentIndex + 1} / {cards.length}
        </div>
      </div>

      {/* Progress */}
      <div className="h-1.5 bg-white/8 rounded-full mb-8 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${(currentIndex / cards.length) * 100}%`,
            background: "#ffd93d",
          }}
        />
      </div>

      <FlashCard
        front={cards[currentIndex].front}
        back={cards[currentIndex].back}
        onRate={handleRate}
      />
    </div>
  );
}
