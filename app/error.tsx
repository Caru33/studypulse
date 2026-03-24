"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-2xl"
        style={{ background: "rgba(255,107,107,0.1)" }}
      >
        ⚠️
      </div>
      <h2 className="font-syne font-bold text-2xl text-off-white mb-2">
        Une erreur s&apos;est produite
      </h2>
      <p className="text-sp-muted max-w-sm mb-6">
        Quelque chose a mal tourné. Veuillez réessayer ou retourner à l&apos;accueil.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-xl text-sm border border-white/15 text-sp-muted hover:text-off-white transition-colors"
        >
          Réessayer
        </button>
        <Link
          href="/dashboard"
          className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
          style={{ background: "#4fffb0", color: "#0f1f3d" }}
        >
          Tableau de bord
        </Link>
      </div>
    </div>
  );
}
