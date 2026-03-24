"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast.error(
        error.message === "User already registered"
          ? "Un compte existe déjà avec cet email"
          : error.message
      );
      setLoading(false);
    } else {
      // Auto sign in after signup
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!signInError) {
        router.push("/dashboard?onboarding=true");
        router.refresh();
      } else {
        toast.success(
          "Compte créé ! Vérifiez votre courriel pour confirmer votre compte."
        );
        router.push("/login");
      }
    }
  }

  return (
    <div className="glass-card p-8">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-block">
          <h1 className="font-syne font-bold text-2xl text-off-white">
            Study<span style={{ color: "#4fffb0" }}>Pulse</span>
          </h1>
        </Link>
        <p className="text-sp-muted mt-2 text-sm">
          Créez votre compte gratuitement
        </p>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="block text-sm text-sp-muted mb-1.5">Prénom et nom</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Tremblay"
            required
            className="w-full px-4 py-3 rounded-xl text-sm text-off-white placeholder-sp-muted outline-none focus:ring-1 focus:ring-sp-accent transition-colors"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          />
        </div>

        <div>
          <label className="block text-sm text-sp-muted mb-1.5">Adresse courriel</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@example.com"
            required
            className="w-full px-4 py-3 rounded-xl text-sm text-off-white placeholder-sp-muted outline-none focus:ring-1 focus:ring-sp-accent transition-colors"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          />
        </div>

        <div>
          <label className="block text-sm text-sp-muted mb-1.5">Mot de passe</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8 caractères minimum"
              required
              minLength={8}
              className="w-full px-4 py-3 pr-11 rounded-xl text-sm text-off-white placeholder-sp-muted outline-none focus:ring-1 focus:ring-sp-accent transition-colors"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sp-muted hover:text-off-white p-1"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50 mt-2"
          style={{ background: "#4fffb0", color: "#0f1f3d" }}
        >
          {loading ? "Création du compte..." : "Créer mon compte — gratuit"}
        </button>
      </form>

      <p className="text-center text-xs text-sp-muted mt-4">
        En créant un compte, vous acceptez nos conditions d&apos;utilisation.
      </p>

      <p className="text-center text-sm text-sp-muted mt-4">
        Déjà un compte ?{" "}
        <Link href="/login" className="text-sp-accent hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
