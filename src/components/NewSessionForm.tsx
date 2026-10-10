"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { COURSE_TYPES, type CourseTypeId } from "@/lib/courseTypes";
import type { AudioSource } from "@/lib/db";
import { createSession, importAudioFile } from "@/lib/sessions";
import { checkImportFile, formatBytes, isLongAudio } from "@/lib/limits";

const SOURCES: { id: AudioSource; label: string; hint: string }[] = [
  { id: "mic", label: "Micro", hint: "Cours en salle, dictée" },
  { id: "tab", label: "Onglet + micro", hint: "Visio (Chrome / Edge)" },
  { id: "file", label: "Fichier audio", hint: "mp3, m4a, wav, webm…" },
];

function audioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    const done = (ms: number) => {
      URL.revokeObjectURL(url);
      resolve(ms);
    };
    audio.preload = "metadata";
    audio.onloadedmetadata = () =>
      done(Number.isFinite(audio.duration) ? Math.round(audio.duration * 1000) : 0);
    audio.onerror = () => done(0);
    audio.src = url;
  });
}

const fieldClass =
  "w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent";

export function NewSessionForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [courseType, setCourseType] = useState<CourseTypeId>("lecture");
  const [context, setContext] = useState("");
  const [source, setSource] = useState<AudioSource>("mic");
  const [file, setFile] = useState<File | null>(null);
  const [fileDurationMs, setFileDurationMs] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFileChange(selected: File | null) {
    setError(null);
    setFileDurationMs(0);
    if (!selected) {
      setFile(null);
      return;
    }
    const problem = checkImportFile(selected);
    if (problem) {
      setFile(null);
      setError(problem);
      return;
    }
    setFile(selected);
    setFileDurationMs(await audioDuration(selected));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (source === "file" && !file) {
      setError("Choisis un fichier audio à importer.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const session = await createSession({ title: title || file?.name.replace(/\.[^.]+$/, "") || "", courseType, context, source });
      if (source === "file" && file) {
        await importAudioFile(session.id, file, fileDurationMs || (await audioDuration(file)));
        router.push(`/session/${session.id}`);
      } else {
        router.push(`/record/${session.id}`);
      }
    } catch {
      setError("Impossible de créer la session.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-7">
      <div>
        <label htmlFor="title" className="mb-1.5 block text-sm font-medium">
          Titre
        </label>
        <input
          id="title"
          className={fieldClass}
          placeholder="Ex. Algèbre linéaire — chapitre 3"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Type de session</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {COURSE_TYPES.map((t) => (
            <label
              key={t.id}
              className={`cursor-pointer rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                courseType === t.id
                  ? "border-accent bg-accent-soft"
                  : "border-line bg-card hover:border-muted"
              }`}
            >
              <input
                type="radio"
                name="courseType"
                className="sr-only"
                checked={courseType === t.id}
                onChange={() => setCourseType(t.id)}
              />
              <span className="block font-medium">{t.label}</span>
              <span className="block text-xs text-muted">{t.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="context" className="mb-1.5 block text-sm font-medium">
          Contexte <span className="font-normal text-muted">(facultatif)</span>
        </label>
        <textarea
          id="context"
          rows={3}
          className={fieldClass}
          placeholder="Matière, niveau, noms propres, vocabulaire technique, objectif des notes…"
          value={context}
          onChange={(e) => setContext(e.target.value)}
        />
      </div>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Source audio</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {SOURCES.map((s) => (
            <label
              key={s.id}
              className={`cursor-pointer rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                source === s.id
                  ? "border-accent bg-accent-soft"
                  : "border-line bg-card hover:border-muted"
              }`}
            >
              <input
                type="radio"
                name="source"
                className="sr-only"
                checked={source === s.id}
                onChange={() => setSource(s.id)}
              />
              <span className="block font-medium">{s.label}</span>
              <span className="block text-xs text-muted">{s.hint}</span>
            </label>
          ))}
        </div>

        {source === "file" && (
          <div className="mt-3">
            <input
              ref={fileRef}
              type="file"
              accept="audio/*,video/mp4,video/webm"
              className="sr-only"
              onChange={(e) => void onFileChange(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-xl border border-dashed border-line px-4 py-6 text-sm text-muted transition-colors hover:border-accent hover:text-foreground"
            >
              {file
                ? `${file.name} · ${formatBytes(file.size)}`
                : "Clique pour choisir un fichier audio (500 Mo maximum)"}
            </button>
            {file && isLongAudio(fileDurationMs) && (
              <p className="mt-2 text-xs text-accent">
                Audio de plus de 3 h : la transcription sera longue sur ton ordinateur.
              </p>
            )}
          </div>
        )}
        {source === "tab" && (
          <p className="mt-3 text-xs text-muted">
            Le navigateur te demandera de choisir un onglet : coche « Partager l'audio de
            l'onglet ». Ton micro est mixé avec le son de l'onglet.
          </p>
        )}
      </fieldset>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {source === "file" ? "Importer" : "Continuer vers l'enregistrement"}
      </button>
    </form>
  );
}
