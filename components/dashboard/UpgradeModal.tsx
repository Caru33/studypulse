"use client";

import { useState } from "react";
import { X, Zap, Check } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  reason?: string;
}

const PRO_FEATURES = [
  "Cours illimités",
  "Questions de quiz illimitées",
  "Flashcards illimitées",
  "Détection avancée des lacunes",
  "Plans d'étude prioritaires",
];

export function UpgradeModal({ open, onClose, reason }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnUrl: window.location.href }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-md border-sp-accent/30"
        style={{
          background: "#1a3260",
          border: "1px solid rgba(79, 255, 176, 0.2)",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sp-accent/20 text-sp-accent mb-2 inline-block">
              RECOMMANDÉ
            </span>
            <h2 className="font-syne font-bold text-xl text-off-white">
              Passez à StudyPulse Pro
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-sp-muted hover:text-off-white transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Reason */}
        {reason && (
          <div className="bg-warning/10 border border-warning/20 rounded-lg px-3 py-2 mb-4">
            <p className="text-sm text-warning">{reason}</p>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-1 mb-4">
          <span className="font-syne font-bold text-4xl text-sp-accent">5$</span>
          <span className="text-sp-muted">/mois</span>
        </div>

        {/* Features */}
        <ul className="space-y-2 mb-6">
          {PRO_FEATURES.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm">
              <Check size={14} className="text-sp-accent flex-shrink-0" />
              <span className="text-off-white">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-navy transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: "#4fffb0", color: "#0f1f3d" }}
        >
          {loading ? (
            <span className="animate-pulse-dot">Chargement...</span>
          ) : (
            <>
              <Zap size={16} />
              Passer à Pro — 5$/mois
            </>
          )}
        </button>

        <p className="text-xs text-sp-muted text-center mt-2">
          Annulable à tout moment · Paiement sécurisé par Stripe
        </p>
      </DialogContent>
    </Dialog>
  );
}
