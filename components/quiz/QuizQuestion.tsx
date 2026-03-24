"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { QuizQuestion as QuizQuestionType } from "@/types/database";

interface QuizQuestionProps {
  question: QuizQuestionType;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (selectedOption: number, isCorrect: boolean) => void;
}

const OPTION_LABELS = ["A", "B", "C", "D"];

export function QuizQuestion({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
}: QuizQuestionProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  function handleSelect(idx: number) {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const correct = idx === question.correct_option;
    setTimeout(() => onAnswer(idx, correct), 1200);
  }

  function getOptionStyle(idx: number) {
    if (!answered) {
      return {
        background: "rgba(26, 50, 96, 0.8)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "#f0ede6",
      };
    }
    if (idx === question.correct_option) {
      return {
        background: "rgba(45, 214, 138, 0.2)",
        border: "1px solid rgba(45, 214, 138, 0.5)",
        color: "#2dd68a",
      };
    }
    if (idx === selected && idx !== question.correct_option) {
      return {
        background: "rgba(255, 107, 107, 0.15)",
        border: "1px solid rgba(255, 107, 107, 0.4)",
        color: "#ff6b6b",
      };
    }
    return {
      background: "rgba(26, 50, 96, 0.4)",
      border: "1px solid rgba(255,255,255,0.04)",
      color: "#8a9bbf",
    };
  }

  const progressPct = ((questionNumber - 1) / totalQuestions) * 100;

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full px-4 py-6">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-sp-muted mb-2">
          <span>
            Question {questionNumber} / {totalQuestions}
          </span>
          <span>{Math.round(progressPct)}% complété</span>
        </div>
        <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
          <div
            className="h-full bg-sp-accent rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1">
        <h2 className="font-syne font-bold text-xl md:text-2xl text-off-white mb-8 leading-tight">
          {question.question_text}
        </h2>

        {/* 2x2 Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {question.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={answered}
              className="p-4 rounded-xl text-left transition-all duration-200 min-h-[64px] flex items-center gap-3 hover:opacity-90 active:scale-[0.98] disabled:cursor-default"
              style={getOptionStyle(idx)}
            >
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background: answered
                    ? idx === question.correct_option
                      ? "rgba(45, 214, 138, 0.3)"
                      : "rgba(255,255,255,0.05)"
                    : "rgba(79, 255, 176, 0.15)",
                  color: answered
                    ? idx === question.correct_option
                      ? "#2dd68a"
                      : "inherit"
                    : "#4fffb0",
                }}
              >
                {OPTION_LABELS[idx]}
              </span>
              <span className="text-sm leading-snug">{option}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Explanation (shown after answering) */}
      {answered && (
        <div
          className="mt-6 p-4 rounded-xl border animate-fade-up"
          style={{
            background:
              selected === question.correct_option
                ? "rgba(45, 214, 138, 0.08)"
                : "rgba(255, 107, 107, 0.08)",
            borderColor:
              selected === question.correct_option
                ? "rgba(45, 214, 138, 0.25)"
                : "rgba(255, 107, 107, 0.25)",
          }}
        >
          <p
            className="text-xs font-semibold mb-1"
            style={{
              color:
                selected === question.correct_option ? "#2dd68a" : "#ff6b6b",
            }}
          >
            {selected === question.correct_option ? "✓ Correct !" : "✗ Incorrect"}
          </p>
          <p className="text-sm text-off-white/80 leading-relaxed">
            {question.explanation}
          </p>
        </div>
      )}

      {/* Next hint */}
      {answered && questionNumber < totalQuestions && (
        <div className="flex items-center justify-end mt-4 text-sm text-sp-muted">
          <ChevronRight size={16} className="animate-pulse" />
          <span className="ml-1">Question suivante...</span>
        </div>
      )}
    </div>
  );
}
