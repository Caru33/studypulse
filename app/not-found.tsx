import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="font-syne font-bold text-[8rem] leading-none" style={{ color: "rgba(79,255,176,0.15)" }}>
        404
      </h1>
      <h2 className="font-syne font-bold text-2xl text-off-white mt-4">
        Page introuvable
      </h2>
      <p className="text-sp-muted mt-2 max-w-sm">
        La page que vous cherchez n&apos;existe pas ou a été déplacée.
      </p>
      <Link
        href="/"
        className="mt-8 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
        style={{ background: "#4fffb0", color: "#0f1f3d" }}
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
