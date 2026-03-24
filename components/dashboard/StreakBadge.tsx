interface StreakBadgeProps {
  streak: number;
  className?: string;
}

export function StreakBadge({ streak, className = "" }: StreakBadgeProps) {
  if (streak === 0) {
    return (
      <div className={`flex items-center gap-1.5 text-sp-muted text-sm ${className}`}>
        <span>🔥</span>
        <span>Commencez votre streak !</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-sm font-semibold ${className}`}
      style={{
        background: "rgba(255, 109, 0, 0.15)",
        border: "1px solid rgba(255, 109, 0, 0.3)",
        color: "#ff9642",
      }}
    >
      <span>🔥</span>
      <span>
        {streak} jour{streak > 1 ? "s" : ""}
      </span>
    </div>
  );
}
