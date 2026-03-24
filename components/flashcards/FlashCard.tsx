"use client";

import { useState, useRef } from "react";
import type { DifficultyRating } from "@/lib/sm2";

interface FlashCardProps {
  front: string;
  back: string;
  onRate: (rating: DifficultyRating) => void;
}

const DIFFICULTY_BUTTONS: {
  rating: DifficultyRating;
  label: string;
  color: string;
  bg: string;
}[] = [
  { rating: "a_revoir", label: "À revoir", color: "#ff6b6b", bg: "rgba(255,107,107,0.15)" },
  { rating: "difficile", label: "Difficile", color: "#ffd93d", bg: "rgba(255,217,61,0.15)" },
  { rating: "correct", label: "Correct", color: "#2dd68a", bg: "rgba(45,214,138,0.15)" },
  { rating: "facile", label: "Facile", color: "#4fffb0", bg: "rgba(79,255,176,0.15)" },
];

export function FlashCard({ front, back, onRate }: FlashCardProps) {
  const [flipped, setFlipped] = useState(false);
  const touchStartX = useRef<number | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(diff) < 60) return; // ignore small swipes

    if (!flipped) {
      setFlipped(true);
      return;
    }
    // After flip: swipe right = facile, left = à_revoir
    onRate(diff > 0 ? "facile" : "a_revoir");
  }

  return (
    <div className="w-full max-w-lg mx-auto select-none">
      {/* 3D card */}
      <div
        className="relative cursor-pointer"
        style={{ perspective: "1000px", height: "280px" }}
        onClick={() => setFlipped((f) => !f)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            transformStyle: "preserve-3d",
            transition: "transform 0.55s ease",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 glass-card flex flex-col items-center justify-center p-8 text-center"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            <p className="text-xs text-sp-muted mb-3 uppercase tracking-wider">
              Question
            </p>
            <p className="font-syne font-bold text-lg text-off-white leading-snug">
              {front}
            </p>
            <p className="text-xs text-sp-muted mt-4">Appuyez pour révéler</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 glass-card flex flex-col items-center justify-center p-8 text-center"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background: "rgba(36, 61, 114, 0.9)",
              borderColor: "rgba(79, 255, 176, 0.15)",
            }}
          >
            <p
              className="text-xs font-semibold mb-3 uppercase tracking-wider"
              style={{ color: "#4fffb0" }}
            >
              Réponse
            </p>
            <p className="text-off-white leading-relaxed whitespace-pre-line">{back}</p>
          </div>
        </div>
      </div>

      {/* Difficulty buttons — only visible after flip */}
      <div
        className={`mt-5 grid grid-cols-4 gap-2 transition-all duration-300 ${
          flipped ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {DIFFICULTY_BUTTONS.map(({ rating, label, color, bg }) => (
          <button
            key={rating}
            onClick={(e) => {
              e.stopPropagation();
              onRate(rating);
            }}
            className="py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95 min-h-[48px]"
            style={{ background: bg, color, border: `1px solid ${color}30` }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Swipe hint */}
      {flipped && (
        <p className="text-center text-xs text-sp-muted mt-3">
          Ou glissez ← difficile · facile →
        </p>
      )}
    </div>
  );
}
