"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(data);
    }
    loadProfile();
  }, [supabase]);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full z-30">
        <Sidebar profile={profile} />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-50 flex flex-col h-full shadow-2xl">
            <Sidebar profile={profile} onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-[240px] min-h-screen flex flex-col">
        {/* Mobile top bar */}
        <div
          className="lg:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b border-white/8"
          style={{ background: "#0f1f3d" }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-sp-muted hover:text-off-white p-1"
            aria-label="Ouvrir le menu"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <h1 className="font-syne font-bold text-lg text-off-white">
            Study<span style={{ color: "#4fffb0" }}>Pulse</span>
          </h1>
          <div className="w-8" />
        </div>

        <div className="flex-1 px-4 py-6 md:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
