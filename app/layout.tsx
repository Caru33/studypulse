import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "StudyPulse — L'étude intelligente pour les étudiants québécois",
  description:
    "Transformez vos temps morts en sessions d'étude intelligentes. Quiz adaptatif, flashcards SM-2, plan d'étude personnalisé par IA.",
  keywords: ["étude", "quiz", "flashcards", "étudiant", "université", "cégep", "IA"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full" suppressHydrationWarning>
      <head>
        {/* Load fonts via standard link tag to avoid next/font network errors in CI */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap"
          rel="stylesheet"
        />
        <style>{`
          :root {
            --font-syne: 'Syne', sans-serif;
            --font-dm-sans: 'DM Sans', sans-serif;
          }
        `}</style>
      </head>
      <body className="h-full antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#1a3260",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#f0ede6",
            },
          }}
        />
      </body>
    </html>
  );
}
