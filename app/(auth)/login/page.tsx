"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(
        error.message === "Invalid login credentials"
          ? "Email ou mot de passe incorrect"
          : error.message
      );
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      toast.error("Erreur avec Google : " + error.message);
      setGoogleLoading(false);
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
          Connectez-vous pour continuer
        </p>
      </div>

      {/* Google OAuth */}
      <button
        onClick={handleGoogleLogin}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-white/10 text-off-white hover:bg-white/5 transition-all mb-6 text-sm font-medium disabled:opacity-50"
      >
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {googleLoading ? "Connexion..." : "Continuer avec Google"}
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-white/8" />
        <span className="text-xs text-sp-muted">ou</span>
        <div className="flex-1 h-px bg-white/8" />
      </div>

      {/* Email/password form */}
      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div>
          <label className="block text-sm text-sp-muted mb-1.5">Adresse courriel</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@example.com"
            required
            className="w-full px-4 py-3 rounded-xl text-sm text-off-white placeholder-sp-muted transition-colors outline-none focus:ring-1 focus:ring-sp-accent"
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
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 pr-11 rounded-xl text-sm text-off-white placeholder-sp-muted transition-colors outline-none focus:ring-1 focus:ring-sp-accent"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sp-muted hover:text-off-white transition-colors p-1"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "#4fffb0", color: "#0f1f3d" }}
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>

      <p className="text-center text-sm text-sp-muted mt-6">
        Pas encore de compte ?{" "}
        <Link href="/signup" className="text-sp-accent hover:underline">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
