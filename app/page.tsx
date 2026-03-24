"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// =========================================================
// Reveal hook (replaces IntersectionObserver script)
// =========================================================
function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

// =========================================================
// Landing Nav
// =========================================================
function LandingNav() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 md:px-[60px] py-5"
      style={{
        background: "linear-gradient(to bottom, rgba(15,31,61,0.95), transparent)",
        backdropFilter: "blur(12px)",
      }}
    >
      <Link
        href="/"
        className="font-syne font-extrabold text-[1.4rem] no-underline"
        style={{ letterSpacing: "-0.02em", color: "#f0ede6" }}
      >
        Study<span style={{ color: "#4fffb0" }}>Pulse</span>
      </Link>
      <Link
        href="/signup"
        className="font-syne font-bold text-[0.85rem] tracking-[0.04em] px-[22px] py-[10px] rounded-full no-underline transition-all hover:-translate-y-0.5"
        style={{ background: "#4fffb0", color: "#0f1f3d" }}
      >
        Commencer gratuitement
      </Link>
    </nav>
  );
}

// =========================================================
// Hero
// =========================================================
function HeroSection() {
  return (
    <div className="relative z-10 min-h-screen flex flex-col justify-center items-start px-6 md:px-[60px] pt-[120px] pb-[80px] max-w-[1200px] mx-auto">
      <div
        className="inline-flex items-center gap-2 text-[0.78rem] font-medium tracking-[0.08em] uppercase px-4 py-[7px] rounded-full mb-8"
        style={{
          background: "rgba(79,255,176,0.1)",
          border: "1px solid rgba(79,255,176,0.25)",
          color: "#4fffb0",
          opacity: 0,
          animation: "fadeUp 0.6s 0.2s forwards",
        }}
      >
        <span style={{ fontSize: "0.5rem", animation: "pulseDot 2s infinite" }}>●</span>
        IA • Éducation • Québec
      </div>

      <h1
        className="font-syne font-extrabold max-w-[800px]"
        style={{
          fontSize: "clamp(2.8rem, 6vw, 5.2rem)",
          lineHeight: 1.08,
          letterSpacing: "-0.03em",
          opacity: 0,
          animation: "fadeUp 0.7s 0.35s forwards",
          color: "#f0ede6",
        }}
      >
        Transforme ton{" "}
        <em className="not-italic" style={{ color: "#4fffb0" }}>
          temps mort
        </em>{" "}
        en étude intelligente
      </h1>

      <p
        className="text-[1.15rem] max-w-[520px] mt-6 font-light"
        style={{ color: "#8a9bbf", opacity: 0, animation: "fadeUp 0.7s 0.5s forwards" }}
      >
        L&apos;assistant IA qui connaît ton contexte académique — plus besoin de
        tout ré-expliquer à chaque session.
      </p>

      <div
        className="flex gap-4 mt-11 items-center flex-wrap"
        style={{ opacity: 0, animation: "fadeUp 0.7s 0.65s forwards" }}
      >
        <Link
          href="/signup"
          className="inline-flex items-center gap-2.5 font-syne font-bold text-base px-8 py-4 rounded-full no-underline transition-all hover:-translate-y-1"
          style={{ background: "#4fffb0", color: "#0f1f3d" }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Commencer gratuitement
        </Link>
        <Link
          href="#solution"
          className="inline-flex items-center gap-2 text-[0.95rem] no-underline opacity-70 hover:opacity-100 transition-opacity"
          style={{ color: "#f0ede6" }}
        >
          Voir comment ça fonctionne →
        </Link>
      </div>

      <div
        className="flex gap-12 mt-[72px] flex-wrap"
        style={{ opacity: 0, animation: "fadeUp 0.7s 0.8s forwards" }}
      >
        {[
          { num: "10+", label: "entrevues étudiantes validées" },
          { num: "1h30", label: "de transport récupérées / jour" },
          { num: "5$/mois", label: "version complète" },
        ].map(({ num, label }) => (
          <div key={num}>
            <div className="font-syne font-extrabold text-[2rem] leading-none" style={{ color: "#4fffb0" }}>
              {num}
            </div>
            <div className="text-[0.82rem] mt-1" style={{ color: "#8a9bbf" }}>
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =========================================================
// Problem
// =========================================================
function ProblemSection() {
  return (
    <section
      className="relative z-10"
      style={{
        background: "rgba(255,255,255,0.015)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="max-w-[1200px] mx-auto px-6 md:px-[60px] py-[100px]">
        <p className="reveal text-[0.75rem] font-medium tracking-[0.12em] uppercase mb-4" style={{ color: "#4fffb0" }}>
          Le problème
        </p>
        <h2 className="reveal font-syne font-extrabold max-w-[600px]" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.12, letterSpacing: "-0.02em", color: "#f0ede6" }}>
          Les étudiants perdent du temps — pas par manque d&apos;effort
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14">
          {[
            { icon: "⏱️", title: "Approche linéaire inefficace", desc: "Les étudiants relisent tout leur matériel sans prioriser, perdant du temps sur ce qu'ils maîtrisent déjà." },
            { icon: "🤖", title: "IA sans contexte académique", desc: "ChatGPT ne connaît pas ton plan de cours ni tes règles académiques — chaque session nécessite un long prompting." },
            { icon: "🚇", title: "Mobilité non exploitée", desc: "1h à 1h30 de transport en commun par jour, sans outil conçu pour étudier efficacement sur mobile." },
          ].map(({ icon, title, desc }) => (
            <div
              key={title}
              className="reveal rounded-[20px] p-9 transition-all duration-300 hover:-translate-y-1 cursor-default"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="w-12 h-12 rounded-[14px] flex items-center justify-center text-2xl mb-5" style={{ background: "rgba(79,255,176,0.1)" }}>
                {icon}
              </div>
              <h3 className="font-syne font-bold text-[1.1rem] mb-2.5" style={{ color: "#f0ede6" }}>{title}</h3>
              <p className="text-[0.9rem] leading-relaxed" style={{ color: "#8a9bbf" }}>{desc}</p>
            </div>
          ))}
        </div>

        <p className="reveal text-[0.82rem] text-center mt-10 pt-6" style={{ color: "#8a9bbf", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          Basé sur <strong style={{ color: "#f0ede6" }}>10+ entrevues</strong> avec des étudiants du cégep et de l&apos;université au Québec (Université de Montréal, pharmacie, psychologie)
        </p>
      </div>
    </section>
  );
}

// =========================================================
// Solution (with interactive phone mockup)
// =========================================================
function SolutionSection() {
  const [activeOption, setActiveOption] = useState(1);

  return (
    <section id="solution" className="relative z-10">
      <div className="max-w-[1200px] mx-auto px-6 md:px-[60px] py-[100px]">
        <p className="reveal text-[0.75rem] font-medium tracking-[0.12em] uppercase mb-4" style={{ color: "#4fffb0" }}>
          La solution
        </p>
        <h2 className="reveal font-syne font-extrabold max-w-[600px]" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.12, letterSpacing: "-0.02em", color: "#f0ede6" }}>
          L&apos;app qui connaît vraiment ton cours
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-16 mt-16 items-start">
          {/* Benefits list */}
          <div className="flex flex-col gap-5">
            {[
              { num: "01", title: "Téléverse ton matériel une fois", desc: "PDF, PowerPoints, plans de cours — StudyPulse assimile ton contexte académique. Fini le prompting répété." },
              { num: "02", title: "Quiz adaptatifs qui ciblent tes lacunes", desc: "L'IA identifie ce que tu maîtrises moins et concentre tes révisions là où c'est vraiment utile." },
              { num: "03", title: "Conçu pour le mobile et le transport", desc: "Flashcards et révisions optimisées pour ton téléphone — transforme chaque trajet en session productive." },
              { num: "04", title: "Plan d'étude synchronisé à tes examens", desc: "Intégration calendrier pour planifier automatiquement selon tes échéances réelles." },
            ].map(({ num, title, desc }) => (
              <div
                key={num}
                className="reveal flex gap-5 items-start p-7 rounded-2xl border transition-all duration-300 cursor-default hover:-translate-y-0.5"
                style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
              >
                <div className="font-syne font-extrabold text-[1.6rem] leading-none min-w-9" style={{ color: "#4fffb0", opacity: 0.35 }}>
                  {num}
                </div>
                <div>
                  <h4 className="font-syne font-bold text-base mb-1.5" style={{ color: "#f0ede6" }}>{title}</h4>
                  <p className="text-[0.88rem]" style={{ color: "#8a9bbf" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Phone mockup */}
          <div
            className="reveal rounded-[36px] p-8 flex flex-col gap-4 lg:sticky lg:top-[100px]"
            style={{
              background: "linear-gradient(145deg, #1a2f5a, #0f1f3d)",
              border: "1px solid rgba(255,255,255,0.08)",
              minHeight: "480px",
              boxShadow: "0 40px 80px rgba(0,0,0,0.4)",
            }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-syne font-bold text-[1.1rem]" style={{ color: "#f0ede6" }}>StudyPulse</span>
              <span className="text-[0.72rem] font-medium px-2.5 py-1 rounded-full" style={{ background: "rgba(79,255,176,0.15)", color: "#4fffb0" }}>● En direct</span>
            </div>

            <div className="rounded-2xl p-[18px_20px]" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-[0.72rem] uppercase tracking-[0.08em] mb-2" style={{ color: "#8a9bbf" }}>Prochain examen</p>
              <p className="font-syne font-bold text-[0.95rem]" style={{ color: "#f0ede6" }}>Pharmacologie — Chapitre 4-7</p>
              <p className="text-[0.82rem] mt-1" style={{ color: "#8a9bbf" }}>Dans 3 jours · 2h d&apos;étude recommandées</p>
            </div>

            <div className="rounded-2xl p-[18px_20px]" style={{ background: "rgba(79,255,176,0.07)", border: "1px solid rgba(79,255,176,0.2)" }}>
              <p className="text-[0.72rem] uppercase tracking-[0.08em] mb-3" style={{ color: "#8a9bbf" }}>Quiz ciblé · Lacune détectée</p>
              <p className="text-[0.88rem] mb-3" style={{ color: "#f0ede6" }}>Quel mécanisme explique la résistance aux bêta-lactamines ?</p>
              <div className="flex flex-col gap-2">
                {["Efflux actif de la molécule", "Production de bêta-lactamases ✓", "Modification du site cible"].map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveOption(i)}
                    className="rounded-[10px] px-3.5 py-2.5 text-[0.82rem] text-left transition-all duration-200"
                    style={
                      activeOption === i
                        ? { background: "rgba(79,255,176,0.15)", border: "1px solid rgba(79,255,176,0.4)", color: "#4fffb0" }
                        : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#f0ede6" }
                    }
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-[16px_20px]" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-[0.78rem] mb-2.5" style={{ color: "#8a9bbf" }}>Progression · Chapitre 5</p>
              <div className="rounded-full h-1.5 overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="h-full rounded-full" style={{ width: "68%", background: "linear-gradient(90deg, #2dd68a, #4fffb0)", transition: "width 1s ease" }} />
              </div>
              <div className="flex justify-between text-[0.75rem] mt-1.5" style={{ color: "#8a9bbf" }}>
                <span>68% maîtrisé</span><span>12 lacunes restantes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// =========================================================
// Pricing
// =========================================================
function PricingSection() {
  return (
    <section className="relative z-10" style={{ background: "rgba(255,255,255,0.015)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="max-w-[1200px] mx-auto px-6 md:px-[60px] py-[100px]">
        <p className="reveal text-[0.75rem] font-medium tracking-[0.12em] uppercase mb-4" style={{ color: "#4fffb0" }}>Tarification</p>
        <h2 className="reveal font-syne font-extrabold max-w-[600px]" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.12, letterSpacing: "-0.02em", color: "#f0ede6" }}>
          Accessible à tous les étudiants
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-14 max-w-[800px]">
          {/* Free */}
          <div className="reveal rounded-[24px] p-10" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}>
            <p className="text-[0.78rem] uppercase tracking-[0.1em] mb-4" style={{ color: "#8a9bbf" }}>Gratuit</p>
            <div className="font-syne font-extrabold text-[3rem] leading-none mb-1.5" style={{ color: "#f0ede6" }}>0<span className="text-base font-normal" style={{ color: "#8a9bbf" }}> $</span></div>
            <p className="text-[0.85rem] mb-7" style={{ color: "#8a9bbf" }}>Pour commencer à étudier intelligemment</p>
            <ul className="space-y-3 mb-8">
              {[
                { t: "Upload de matériel de cours (PDFs, slides)", ok: true },
                { t: "Quiz basiques générés par l'IA", ok: true },
                { t: "Flashcards pour mobile", ok: true },
                { t: "Détection des lacunes avancée", ok: false },
                { t: "Intégration calendrier complète", ok: false },
                { t: "Historique de progression", ok: false },
              ].map(({ t, ok }) => (
                <li key={t} className="text-[0.9rem] flex gap-2.5" style={{ color: ok ? "#f0ede6" : "#8a9bbf", opacity: ok ? 1 : 0.4 }}>
                  <span style={{ color: ok ? "#4fffb0" : "#8a9bbf", fontWeight: 700, flexShrink: 0 }}>{ok ? "✓" : "–"}</span>
                  {t}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="block text-center border rounded-full font-syne font-semibold text-[0.9rem] py-3.5 no-underline transition-all" style={{ borderColor: "rgba(255,255,255,0.08)", color: "#f0ede6" }}>
              Commencer gratuitement
            </Link>
          </div>

          {/* Pro */}
          <div className="reveal rounded-[24px] p-10 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(79,255,176,0.1), rgba(79,255,176,0.03))", border: "1px solid rgba(79,255,176,0.35)" }}>
            <div className="absolute top-5 right-5 font-syne font-bold text-[0.62rem] tracking-[0.08em] px-2.5 py-1 rounded-full" style={{ background: "#4fffb0", color: "#0f1f3d" }}>RECOMMANDÉ</div>
            <p className="text-[0.78rem] uppercase tracking-[0.1em] mb-4" style={{ color: "#8a9bbf" }}>StudyPulse Pro</p>
            <div className="font-syne font-extrabold text-[3rem] leading-none mb-1.5" style={{ color: "#f0ede6" }}>
              <sup className="text-[1.2rem] align-top mt-2">$</sup>5<span className="text-base font-normal" style={{ color: "#8a9bbf" }}> /mois</span>
            </div>
            <p className="text-[0.85rem] mb-7" style={{ color: "#8a9bbf" }}>L&apos;expérience complète, moins cher qu&apos;un café</p>
            <ul className="space-y-3 mb-8">
              {["Tout du plan gratuit", "Détection automatique des lacunes", "Intégration calendrier complète", "Historique et suivi de progression", "Notifications quotidiennes intelligentes", "Intégration Notebook LM & Quizlet"].map((t) => (
                <li key={t} className="text-[0.9rem] flex gap-2.5" style={{ color: "#f0ede6" }}>
                  <span style={{ color: "#4fffb0", fontWeight: 700, flexShrink: 0 }}>✓</span>{t}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="block text-center rounded-full font-syne font-bold text-[0.9rem] py-3.5 no-underline transition-all hover:-translate-y-0.5" style={{ background: "#4fffb0", color: "#0f1f3d" }}>
              Essayer Pro gratuitement
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// =========================================================
// Testimonials
// =========================================================
function TestimonialsSection() {
  return (
    <section className="relative z-10">
      <div className="max-w-[1200px] mx-auto px-6 md:px-[60px] py-[100px]">
        <p className="reveal text-[0.75rem] font-medium tracking-[0.12em] uppercase mb-4" style={{ color: "#4fffb0" }}>Ce que disent les étudiants</p>
        <h2 className="reveal font-syne font-extrabold max-w-[600px]" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.12, letterSpacing: "-0.02em", color: "#f0ede6" }}>
          Validé par 10+ entrevues au Québec
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-14">
          {[
            { i: "ML", q: "Je perds tellement de temps à décider quoi étudier avant même de commencer. Si une app pouvait juste me dire par où partir selon mes lacunes, ça changerait tout.", n: "Marie-Lou", r: "Étudiante en pharmacie · Université de Montréal" },
            { i: "TG", q: "ChatGPT c'est bien, mais je dois tout ré-expliquer mon cours à chaque fois. Quelque chose qui connaît déjà mon contexte académique, ça serait vraiment utile.", n: "Thomas G.", r: "Étudiant en psychologie · UdeM" },
            { i: "SB", q: "Je fais 1h30 de transport par jour. Si je pouvais utiliser ce temps pour réviser avec des quiz adaptés à mon cours au lieu de scroller, je serais tellement plus serein avant mes examens.", n: "Sofia B.", r: "Étudiante en sciences · Cégep" },
            { i: "KD", q: "Le problème c'est pas que je travaille pas — c'est que je travaille sur les mauvaises choses. J'aurais besoin d'un outil qui sait vraiment où sont mes trous.", n: "Karim D.", r: "Étudiant en administration · HEC Montréal" },
          ].map(({ i, q, n, r }) => (
            <div key={n} className="reveal rounded-[20px] p-8 relative" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}>
              <div className="absolute top-4 left-7 font-syne text-[4rem] leading-none" style={{ color: "#4fffb0", opacity: 0.2 }}>&ldquo;</div>
              <p className="text-[0.95rem] leading-[1.7] italic mt-5" style={{ color: "rgba(240,237,230,0.85)" }}>{q}</p>
              <div className="flex items-center gap-3 mt-5">
                <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center font-syne font-bold text-[0.85rem] flex-shrink-0" style={{ background: "linear-gradient(135deg, #2dd68a, #1a3260)", color: "#0f1f3d" }}>{i}</div>
                <div>
                  <p className="font-semibold text-[0.88rem]" style={{ color: "#f0ede6" }}>{n}</p>
                  <p className="text-[0.8rem]" style={{ color: "#8a9bbf" }}>{r}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// =========================================================
// CTA
// =========================================================
function CTASection() {
  return (
    <section id="telecharger" className="relative z-10 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="max-w-[700px] mx-auto px-6 py-[120px]">
        <p className="text-[0.75rem] font-medium tracking-[0.12em] uppercase mb-4" style={{ color: "#4fffb0" }}>Commencer maintenant</p>
        <h2 className="reveal font-syne font-extrabold" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.12, letterSpacing: "-0.02em", color: "#f0ede6" }}>
          Commence à étudier intelligemment — dès aujourd&apos;hui
        </h2>
        <p className="reveal mt-5 text-base" style={{ color: "#8a9bbf" }}>Application web gratuite. Aucune installation requise.</p>
        <div className="reveal flex gap-5 justify-center mt-11 flex-wrap items-center">
          {[
            { icon: "🚀", sub: "Commencer sur", name: "StudyPulse Web", href: "/signup" },
            { icon: "🔑", sub: "Déjà un compte", name: "Se connecter", href: "/login" },
          ].map(({ icon, sub, name, href }) => (
            <Link
              key={name}
              href={href}
              className="inline-flex items-center gap-3 px-7 py-3.5 rounded-2xl no-underline font-medium transition-all hover:-translate-y-0.5"
              style={{ background: "#f0ede6", color: "#0f1f3d" }}
            >
              <span className="text-[1.6rem] leading-none">{icon}</span>
              <span>
                <span className="text-[0.7rem] opacity-60 block">{sub}</span>
                <span className="font-syne font-bold text-[0.95rem] block">{name}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// =========================================================
// Main Page
// =========================================================
export default function LandingPage() {
  useReveal();

  return (
    <>
      {/* Fixed blob backgrounds */}
      <div className="fixed rounded-full pointer-events-none z-0" style={{ width: 600, height: 600, background: "rgba(79,255,176,0.06)", top: -200, right: -200, filter: "blur(120px)" }} />
      <div className="fixed rounded-full pointer-events-none z-0" style={{ width: 500, height: 500, background: "rgba(26,50,96,0.6)", bottom: "10%", left: -150, filter: "blur(120px)" }} />

      <LandingNav />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <PricingSection />
      <TestimonialsSection />
      <CTASection />

      {/* Footer */}
      <footer className="relative z-10 flex justify-between items-center max-w-[1200px] mx-auto px-6 md:px-[60px] py-10 flex-col md:flex-row gap-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="font-syne font-extrabold text-[1.2rem]" style={{ letterSpacing: "-0.02em", color: "#f0ede6" }}>
          Study<span style={{ color: "#4fffb0" }}>Pulse</span>
        </div>
        <div className="text-[0.82rem]" style={{ color: "#8a9bbf" }}>
          © 2026 StudyPulse · Équipe G · ENTR11000 HEC Montréal
        </div>
      </footer>
    </>
  );
}
