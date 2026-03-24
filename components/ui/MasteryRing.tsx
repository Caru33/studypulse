"use client";

import { getMasteryLevel } from "@/lib/mastery";

interface MasteryRingProps {
  score: number; // 0.0 to 1.0
  size?: number; // px
  strokeWidth?: number;
  showLabel?: boolean;
  className?: string;
}

export function MasteryRing({
  score,
  size = 60,
  strokeWidth = 5,
  showLabel = false,
  className = "",
}: MasteryRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(1, score)));
  const { color, label } = getMasteryLevel(score);
  const percentage = Math.round(score * 100);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)" }}
        aria-label={`Maîtrise : ${percentage}%`}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      {/* Center text */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ fontSize: size * 0.22 }}
      >
        <span className="font-bold" style={{ color }}>
          {percentage}%
        </span>
      </div>
      {showLabel && (
        <span
          className="ml-2 text-sm font-medium"
          style={{ color }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
