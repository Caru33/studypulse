"use client";

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  color?: string;
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  color = "#4fffb0",
  className = "",
  showLabel = false,
}: ProgressBarProps) {
  const pct = Math.round(Math.max(0, Math.min(100, (value / max) * 100)));

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 h-2 rounded-full overflow-hidden bg-white/8">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-sp-muted min-w-[36px] text-right">
          {pct}%
        </span>
      )}
    </div>
  );
}
