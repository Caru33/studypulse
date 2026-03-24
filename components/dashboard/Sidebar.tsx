"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Brain,
  Layers,
  Settings,
  LogOut,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types/database";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/courses", label: "Mes cours", icon: BookOpen },
  { href: "/quiz/new", label: "Quiz", icon: Brain },
  { href: "/flashcards", label: "Flashcards", icon: Layers },
  { href: "/settings", label: "Paramètres", icon: Settings },
];

interface SidebarProps {
  profile: Profile | null;
  onClose?: () => void;
}

export function Sidebar({ profile, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div
      className="flex flex-col h-full w-[240px]"
      style={{
        background: "#1a3260",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/6">
        <Link href="/dashboard" onClick={onClose}>
          <h1 className="font-syne font-bold text-xl text-off-white">
            Study<span style={{ color: "#4fffb0" }}>Pulse</span>
          </h1>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "text-sp-accent"
                  : "text-sp-muted hover:text-off-white hover:bg-white/5"
              }`}
              style={
                isActive
                  ? { background: "rgba(79,255,176,0.1)" }
                  : undefined
              }
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4 space-y-2 border-t border-white/6 pt-3">
        {/* Upgrade banner (free plan only) */}
        {profile?.plan === "free" && (
          <Link
            href="#"
            onClick={async (e) => {
              e.preventDefault();
              const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ return_url: window.location.href }),
              });
              const data = await res.json();
              if (data.url) window.location.href = data.url;
            }}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all hover:opacity-90"
            style={{
              background: "rgba(79,255,176,0.12)",
              border: "1px solid rgba(79,255,176,0.2)",
              color: "#4fffb0",
            }}
          >
            <Zap size={16} />
            <span className="font-medium">Passer à Pro — 5$/mois</span>
          </Link>
        )}

        {/* Profile */}
        {profile && (
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-off-white truncate">
              {profile.full_name ?? profile.email}
            </p>
            <p className="text-xs text-sp-muted truncate">{profile.email}</p>
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-sp-muted hover:text-danger hover:bg-danger/10 transition-all"
        >
          <LogOut size={16} />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
