import Link from "next/link";
import { Brain, Layers, BookOpen, Clock } from "lucide-react";
import type { StudyPlanDay as StudyPlanDayType } from "@/types/database";

interface StudyPlanDayProps {
  day: StudyPlanDayType;
  isToday?: boolean;
}

const ACTIVITY_CONFIG = {
  quiz: {
    icon: Brain,
    label: "Quiz",
    color: "#4fffb0",
    bg: "rgba(79, 255, 176, 0.1)",
    href: (courseId: string) => `/quiz/new?courseId=${courseId}`,
  },
  flashcards: {
    icon: Layers,
    label: "Flashcards",
    color: "#ffd93d",
    bg: "rgba(255, 217, 61, 0.1)",
    href: (courseId: string) => `/flashcards/${courseId}`,
  },
  review: {
    icon: BookOpen,
    label: "Révision",
    color: "#8a9bbf",
    bg: "rgba(138, 155, 191, 0.1)",
    href: (courseId: string) => `/courses/${courseId}`,
  },
};

export function StudyPlanDay({ day, isToday = false }: StudyPlanDayProps) {
  return (
    <div
      className={`glass-card p-4 ${
        isToday ? "border-sp-accent/30" : ""
      }`}
      style={isToday ? { borderColor: "rgba(79,255,176,0.2)" } : {}}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p
            className={`font-syne font-bold text-sm ${
              isToday ? "text-sp-accent" : "text-off-white"
            }`}
          >
            {isToday ? "Aujourd'hui" : day.day_label}
          </p>
          {!isToday && (
            <p className="text-xs text-sp-muted">{day.date}</p>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-sp-muted">
          <Clock size={12} />
          <span>{day.total_minutes} min</span>
        </div>
      </div>

      <div className="space-y-2">
        {day.sessions.map((session, i) => {
          const config = ACTIVITY_CONFIG[session.activity];
          const Icon = config.icon;

          return (
            <Link
              key={i}
              href={config.href(session.course_id)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group"
              style={{ background: config.bg }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${config.color}20` }}
              >
                <Icon size={14} style={{ color: config.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-off-white truncate group-hover:text-sp-accent transition-colors">
                  {session.course_title}
                </p>
                <p className="text-xs text-sp-muted truncate">{session.focus}</p>
              </div>
              <div className="flex-shrink-0 text-xs text-sp-muted">
                {session.duration_minutes} min
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
