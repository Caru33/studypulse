"use client";

import Link from "next/link";
import { BookOpen, Calendar } from "lucide-react";
import { MasteryRing } from "@/components/ui/MasteryRing";
import { getMasteryLevel, getDaysUntilExam, formatExamCountdown } from "@/lib/mastery";
import type { Course } from "@/types/database";

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  const { label, color } = getMasteryLevel(course.mastery_score);
  const daysUntil = getDaysUntilExam(course.exam_date);
  const isUrgent = daysUntil !== null && daysUntil <= 3;

  return (
    <div
      className="glass-card p-5 flex flex-col gap-4 hover:border-sp-accent/30 transition-all duration-200 group"
      style={isUrgent ? { borderColor: "rgba(255, 107, 107, 0.3)" } : {}}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-syne font-bold text-off-white text-base leading-tight truncate group-hover:text-sp-accent transition-colors">
            {course.title}
          </h3>
          {course.description && (
            <p className="text-sp-muted text-sm mt-1 line-clamp-2">
              {course.description}
            </p>
          )}
        </div>
        <MasteryRing score={course.mastery_score} size={56} strokeWidth={4} />
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-sp-muted">
          <BookOpen size={14} />
          <span>{course.total_concepts} concepts</span>
        </div>
        <div
          className="flex items-center gap-1.5 text-sm font-medium"
          style={{ color }}
        >
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
          {label}
        </div>
      </div>

      {/* Exam countdown */}
      {course.exam_date && (
        <div
          className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md w-fit ${
            isUrgent ? "bg-danger/15 text-danger" : "bg-white/5 text-sp-muted"
          }`}
        >
          <Calendar size={12} />
          <span>{formatExamCountdown(daysUntil)}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-2 border-t border-white/8">
        <Link
          href={`/courses/${course.id}`}
          className="flex-1 text-center text-sm py-2 rounded-lg text-sp-muted hover:text-off-white hover:bg-white/5 transition-colors"
        >
          Voir le cours
        </Link>
        <Link
          href={`/quiz/new?courseId=${course.id}`}
          className="flex-1 text-center text-sm py-2 rounded-lg font-medium text-navy bg-sp-accent hover:bg-sp-accent-dim transition-colors"
          style={{ background: "#4fffb0", color: "#0f1f3d" }}
        >
          Quiz adaptatif
        </Link>
      </div>
    </div>
  );
}
