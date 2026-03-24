"use client";

import { useEffect } from "react";
import type { LevelUpEvent } from "@/types/database";

interface LevelUpConfettiProps {
  events: LevelUpEvent[];
}

export function LevelUpConfetti({ events }: LevelUpConfettiProps) {
  useEffect(() => {
    if (events.length === 0) return;

    import("canvas-confetti").then((module) => {
      const confetti = module.default;
      // Fire confetti for each level-up
      events.forEach((_, i) => {
        setTimeout(() => {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#4fffb0", "#2dd68a", "#f0ede6", "#ffd93d"],
          });
        }, i * 400);
      });
    });
  }, [events]);

  if (events.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-2 pointer-events-none">
      {events.map((e) => (
        <div
          key={e.concept_id}
          className="glass-card px-4 py-3 animate-fade-up"
          style={{ borderColor: "rgba(79,255,176,0.4)" }}
        >
          <p className="text-sm font-semibold text-sp-accent">
            ⭐ Niveau {e.new_level} atteint !
          </p>
          <p className="text-xs text-sp-muted mt-0.5 truncate max-w-[200px]">
            {e.concept_title}
          </p>
        </div>
      ))}
    </div>
  );
}
