"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, X, CheckCircle, Loader } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
}

type UploadState = "idle" | "uploading" | "analyzing" | "done" | "error";

export function UploadModal({ open, onClose }: UploadModalProps) {
  const router = useRouter();
  const [state, setState] = useState<UploadState>("idle");
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<{
    title: string;
    conceptCount: number;
    courseId: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".pdf")) {
      setError("Seuls les fichiers PDF sont acceptés");
      setState("error");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Le fichier est trop volumineux (maximum 10 Mo)");
      setState("error");
      return;
    }

    setState("uploading");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      setState("analyzing");

      const res = await fetch("/api/courses/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'upload");
      }

      setResult({
        title: data.title,
        conceptCount: data.concept_count,
        courseId: data.course_id,
      });
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setState("error");
    }
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleClose() {
    if (state === "done") {
      router.refresh();
    }
    setState("idle");
    setResult(null);
    setError(null);
    onClose();
  }

  function handleViewCourse() {
    if (result) {
      router.push(`/courses/${result.courseId}`);
    }
    handleClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className="max-w-md"
        style={{ background: "#1a3260", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-syne font-bold text-lg text-off-white">
            Ajouter un cours
          </h2>
          <button
            onClick={handleClose}
            className="text-sp-muted hover:text-off-white transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Idle state — drop zone */}
        {(state === "idle" || state === "error") && (
          <>
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                dragOver
                  ? "border-sp-accent bg-sp-accent/5"
                  : "border-white/15 hover:border-white/30"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload
                size={32}
                className="mx-auto mb-3"
                style={{ color: dragOver ? "#4fffb0" : "#8a9bbf" }}
              />
              <p className="text-off-white font-medium mb-1">
                Glissez votre PDF ici
              </p>
              <p className="text-sp-muted text-sm">
                ou cliquez pour sélectionner un fichier
              </p>
              <p className="text-xs text-sp-muted mt-2">PDF · Maximum 10 Mo</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />

            {state === "error" && error && (
              <div className="mt-3 px-3 py-2 rounded-lg bg-danger/10 border border-danger/20">
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}
          </>
        )}

        {/* Uploading / Analyzing */}
        {(state === "uploading" || state === "analyzing") && (
          <div className="py-8 flex flex-col items-center gap-4">
            <div className="relative">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "rgba(79,255,176,0.1)" }}
              >
                <Loader
                  size={28}
                  style={{ color: "#4fffb0" }}
                  className="animate-spin"
                />
              </div>
              <span
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse-dot"
                style={{ background: "#4fffb0" }}
              />
            </div>
            <div className="text-center">
              <p className="font-semibold text-off-white">
                {state === "uploading"
                  ? "Envoi du fichier..."
                  : "StudyPulse analyse votre cours..."}
              </p>
              <p className="text-sm text-sp-muted mt-1">
                {state === "analyzing"
                  ? "Extraction des concepts clés avec l'IA"
                  : "Chargement en cours"}
              </p>
            </div>
          </div>
        )}

        {/* Done */}
        {state === "done" && result && (
          <div className="py-6 flex flex-col items-center gap-4 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "rgba(45,214,138,0.1)" }}
            >
              <CheckCircle size={32} style={{ color: "#2dd68a" }} />
            </div>
            <div>
              <p className="font-syne font-bold text-off-white text-lg">
                {result.title}
              </p>
              <p className="text-sm text-sp-muted mt-1">
                {result.conceptCount} concepts extraits et analysés
              </p>
            </div>
            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-sp-muted hover:text-off-white hover:border-white/20 transition-colors text-sm"
              >
                Fermer
              </button>
              <button
                onClick={handleViewCourse}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
                style={{ background: "#4fffb0", color: "#0f1f3d" }}
              >
                Voir le cours
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
