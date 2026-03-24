"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Zap, CreditCard, ExternalLink } from "lucide-react";
import type { Profile } from "@/types/database";
import { MOCK_PROFILE } from "@/lib/mock-data";

const IS_MOCK =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project");

export default function SettingsPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [university, setUniversity] = useState("");
  const [program, setProgram] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    async function load() {
      if (IS_MOCK) {
        setProfile(MOCK_PROFILE);
        setFullName(MOCK_PROFILE.full_name ?? "");
        setUniversity(MOCK_PROFILE.university ?? "");
        setProgram(MOCK_PROFILE.program ?? "");
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) {
        setProfile(data);
        setFullName(data.full_name ?? "");
        setUniversity(data.university ?? "");
        setProgram(data.program ?? "");
      }
    }
    load();
  }, [supabase]);

  async function handleSaveProfile() {
    if (IS_MOCK) { toast.success("Profil mis à jour (mode démo)"); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ full_name: fullName, university, program }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error("Erreur lors de la sauvegarde");
    else toast.success("Profil mis à jour");
  }

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error(data.error ?? "Erreur");
    } finally { setPortalLoading(false); }
  }

  async function handleUpgrade() {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ return_url: window.location.href }) });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error(data.error ?? "Erreur");
    } finally { setCheckoutLoading(false); }
  }

  async function handleDeleteAccount() {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    if (IS_MOCK) { toast.error("Fonctionnalité désactivée en mode démo"); setDeleteConfirm(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").delete().eq("id", user.id);
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (!profile) {
    return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}</div>;
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-syne font-bold text-2xl text-off-white">Paramètres</h1>
        <p className="text-sp-muted text-sm mt-1">Gérez votre compte et abonnement</p>
      </div>

      {/* Profile section */}
      <section className="glass-card p-6">
        <h2 className="font-syne font-bold text-lg text-off-white mb-4">Profil</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-sp-muted mb-1.5">Nom complet</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm text-off-white outline-none focus:ring-1 focus:ring-sp-accent"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>
          <div>
            <label className="block text-sm text-sp-muted mb-1.5">Université</label>
            <select
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm text-off-white outline-none focus:ring-1 focus:ring-sp-accent"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <option value="">Non spécifié</option>
              {["Université de Montréal","Université Laval","McGill University","Concordia University","UQAM","UQTR","Université de Sherbrooke","Polytechnique Montréal","HEC Montréal","Autre"].map(u => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-sp-muted mb-1.5">Programme</label>
            <input
              type="text"
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              placeholder="Ex: Pharmacie, Génie informatique..."
              className="w-full px-4 py-3 rounded-xl text-sm text-off-white placeholder-sp-muted outline-none focus:ring-1 focus:ring-sp-accent"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "#4fffb0", color: "#0f1f3d" }}
          >
            {saving ? "Sauvegarde..." : "Enregistrer les modifications"}
          </button>
        </div>
      </section>

      {/* Subscription section */}
      <section className="glass-card p-6">
        <h2 className="font-syne font-bold text-lg text-off-white mb-4">Abonnement</h2>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-off-white font-medium">Plan actuel</p>
            <p className="text-sm text-sp-muted">{profile.email}</p>
          </div>
          <span
            className="px-3 py-1 rounded-full text-sm font-semibold"
            style={
              profile.plan === "pro"
                ? { background: "rgba(79,255,176,0.15)", color: "#4fffb0" }
                : { background: "rgba(138,155,191,0.15)", color: "#8a9bbf" }
            }
          >
            {profile.plan === "pro" ? "Pro ⭐" : "Gratuit"}
          </span>
        </div>

        {profile.plan === "free" ? (
          <div>
            <p className="text-sm text-sp-muted mb-3">
              Limites actuelles : 2 cours, 10 questions/jour, 20 flashcards/cours
            </p>
            <button
              onClick={handleUpgrade}
              disabled={checkoutLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "#4fffb0", color: "#0f1f3d" }}
            >
              <Zap size={16} />
              {checkoutLoading ? "Redirection..." : "Passer à Pro — 5$/mois"}
            </button>
          </div>
        ) : (
          <button
            onClick={handlePortal}
            disabled={portalLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm border border-white/15 text-sp-muted hover:text-off-white transition-all disabled:opacity-50"
          >
            <CreditCard size={16} />
            {portalLoading ? "Chargement..." : "Gérer l'abonnement"}
            <ExternalLink size={12} />
          </button>
        )}
      </section>

      {/* Danger zone */}
      <section className="glass-card p-6" style={{ borderColor: "rgba(255,107,107,0.2)" }}>
        <h2 className="font-syne font-bold text-lg text-danger mb-2">Zone de danger</h2>
        <p className="text-sm text-sp-muted mb-4">
          La suppression de votre compte est irréversible. Toutes vos données seront effacées.
        </p>
        <button
          onClick={handleDeleteAccount}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            deleteConfirm
              ? "bg-danger/20 text-danger border border-danger/40"
              : "border border-danger/30 text-danger hover:bg-danger/10"
          }`}
        >
          {deleteConfirm ? "Cliquez à nouveau pour confirmer" : "Supprimer mon compte"}
        </button>
        {deleteConfirm && (
          <button
            onClick={() => setDeleteConfirm(false)}
            className="ml-3 text-sm text-sp-muted hover:text-off-white transition-colors"
          >
            Annuler
          </button>
        )}
      </section>
    </div>
  );
}
