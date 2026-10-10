"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { courseTypeLabel } from "@/lib/courseTypes";
import { formatDuration, updateSession } from "@/lib/sessions";
import { useRecorder } from "@/hooks/useRecorder";

export function RecordView({ id }: { id: string }) {
  const session = useLiveQuery(() => db.sessions.get(id), [id]);
  if (session === undefined) return <p className="text-sm text-muted">Chargement…</p>;
  if (!session) return <p className="text-sm text-muted">Session introuvable.</p>;
  if (session.source === "file") return <p className="text-sm text-muted">Cette session est un import.</p>;
  return (
    <Recorder
      id={id}
      title={session.title}
      typeLabel={courseTypeLabel(session.courseType)}
      source={session.source === "tab" ? "tab" : "mic"}
      initialNotes={session.userNotes}
    />
  );
}

function Recorder({
  id,
  title,
  typeLabel,
  source,
  initialNotes,
}: {
  id: string;
  title: string;
  typeLabel: string;
  source: "mic" | "tab";
  initialNotes: string;
}) {
  const router = useRouter();
  const { state, elapsedMs, level, error, start, pause, resume, stop } = useRecorder(id, source);
  const [notes, setNotes] = useState(initialNotes);
  const [stopping, setStopping] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sauvegarde différée des notes perso.
  function onNotesChange(value: string) {
    setNotes(value);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void updateSession(id, { userNotes: value }), 500);
  }

  const active = state === "recording" || state === "paused";

  // Empêche la fermeture accidentelle pendant l'enregistrement.
  useEffect(() => {
    if (!active) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [active]);

  async function onStop() {
    setStopping(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await updateSession(id, { userNotes: notes });
    await stop();
    router.push(`/session/${id}`);
  }

  return (
    <div>
      <p className="text-sm text-muted">{typeLabel}</p>
      <h1 className="font-serif text-3xl font-semibold tracking-tight">{title}</h1>

      <div className="mt-8 rounded-2xl border border-line bg-card p-6 text-center">
        <p className="font-mono text-5xl tabular-nums tracking-tight">{formatDuration(elapsedMs)}</p>

        <div
          className="mx-auto mt-5 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-line"
          role="meter"
          aria-label="Niveau sonore"
          aria-valuemin={0}
          aria-valuemax={1}
          aria-valuenow={Number(level.toFixed(2))}
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-75"
            style={{ width: `${Math.round(level * 100)}%` }}
          />
        </div>

        <div className="mt-6 flex items-center justify-center gap-3">
          {(state === "idle" || state === "error" || state === "requesting") && (
            <button
              onClick={start}
              disabled={state === "requesting"}
              className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {state === "requesting" ? "Autorisation…" : "Démarrer l'enregistrement"}
            </button>
          )}
          {state === "recording" && (
            <button
              onClick={pause}
              className="rounded-full border border-line px-5 py-2.5 text-sm font-medium hover:border-muted"
            >
              Pause
            </button>
          )}
          {state === "paused" && (
            <button
              onClick={resume}
              className="rounded-full border border-line px-5 py-2.5 text-sm font-medium hover:border-muted"
            >
              Reprendre
            </button>
          )}
          {active && (
            <button
              onClick={onStop}
              disabled={stopping}
              className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background disabled:opacity-50"
            >
              {stopping ? "Enregistrement…" : "Terminer"}
            </button>
          )}
        </div>

        {state === "recording" && (
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> Enregistrement en
            cours
          </p>
        )}
        {state === "paused" && <p className="mt-4 text-xs text-muted">En pause</p>}
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>

      <div className="mt-8">
        <label htmlFor="notes" className="mb-1.5 block text-sm font-medium">
          Mes notes <span className="font-normal text-muted">(enregistrées automatiquement)</span>
        </label>
        <textarea
          id="notes"
          rows={10}
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Écris ici ce qui te semble important. L'IA s'en servira pour compléter les notes."
          className="w-full rounded-xl border border-line bg-card px-4 py-3 font-serif text-base leading-7 outline-none focus:border-accent"
        />
      </div>
    </div>
  );
}
