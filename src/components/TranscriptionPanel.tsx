"use client";

import { useEffect, useRef, useState } from "react";
import type { SessionRecord } from "@/lib/db";
import { updateSession } from "@/lib/sessions";
import { isLongAudio } from "@/lib/limits";
import {
  followTranscription,
  formatTimestamp,
  startTranscription,
  transcriptToText,
  type TranscriptionStatus,
} from "@/lib/transcription";

const LANGUAGES = [
  { id: "auto", label: "Détection automatique" },
  { id: "fr", label: "Français" },
  { id: "en", label: "Anglais" },
];

export function TranscriptionPanel({
  session,
  onSeek,
}: {
  session: SessionRecord;
  onSeek: (sec: number) => void;
}) {
  const [language, setLanguage] = useState("auto");
  const [status, setStatus] = useState<TranscriptionStatus>({ phase: "idle" });
  const [copied, setCopied] = useState(false);
  const cancelledRef = useRef(false);

  const jobId = session.transcriptionJobId;
  const hasAudio = session.status === "ready";

  // Reprend le suivi si un job est déjà en cours (page rechargée).
  useEffect(() => {
    cancelledRef.current = false;
    if (jobId) {
      void followTranscription(session.id, jobId, setStatus, () => cancelledRef.current);
    }
    return () => {
      cancelledRef.current = true;
    };
  }, [session.id, jobId]);

  async function onStart() {
    setStatus({ phase: "uploading" });
    try {
      // Le suivi démarre via l'effet ci-dessus, dès que l'id du job est enregistré.
      await startTranscription(session, language);
    } catch (e) {
      setStatus({
        phase: "error",
        message: e instanceof Error ? e.message : "Échec de la transcription.",
      });
    }
  }

  async function onCopy() {
    if (!session.transcript) return;
    await navigator.clipboard.writeText(transcriptToText(session.transcript, true));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const transcript = session.transcript;
  const busy = status.phase === "uploading" || status.phase === "running" || Boolean(jobId);

  return (
    <section className="mt-8">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-medium">Transcription</h2>
        {transcript && (
          <div className="flex items-center gap-3 text-xs text-muted">
            <span>
              {transcript.language.toUpperCase()} · Whisper {transcript.model}
              {transcript.elapsedSec
                ? ` · ${
                    transcript.elapsedSec < 90
                      ? `${Math.round(transcript.elapsedSec)} s`
                      : `${Math.round(transcript.elapsedSec / 60)} min`
                  } de calcul`
                : ""}
            </span>
            <button onClick={onCopy} className="underline underline-offset-2 hover:text-foreground">
              {copied ? "Copié" : "Copier"}
            </button>
          </div>
        )}
      </div>

      {transcript ? (
        <div className="rounded-2xl border border-line bg-card">
          <ul className="max-h-[28rem] divide-y divide-line overflow-y-auto">
            {transcript.segments.map((seg, i) => (
              <li key={i} className="flex gap-3 px-4 py-2.5">
                <button
                  onClick={() => onSeek(seg.start)}
                  className="mt-0.5 shrink-0 font-mono text-xs tabular-nums text-accent hover:underline"
                >
                  {formatTimestamp(seg.start)}
                </button>
                <p className="font-serif text-[15px] leading-6">{seg.text}</p>
              </li>
            ))}
            {transcript.segments.length === 0 && (
              <li className="px-4 py-6 text-sm text-muted">Aucune parole détectée.</li>
            )}
          </ul>
          <div className="border-t border-line px-4 py-2.5 text-right">
            <button
              onClick={() => {
                if (window.confirm("Remplacer la transcription actuelle ?")) {
                  void updateSession(session.id, { transcript: undefined });
                }
              }}
              className="text-xs text-muted underline underline-offset-2 hover:text-foreground"
            >
              Refaire la transcription
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-card p-5">
          {!hasAudio ? (
            <p className="text-sm text-muted">Termine l'enregistrement pour pouvoir transcrire.</p>
          ) : busy ? (
            <div>
              <p className="text-sm">
                {status.phase === "uploading"
                  ? "Envoi de l'audio…"
                  : status.phase === "running" && status.queued
                    ? "En attente…"
                    : "Transcription en cours…"}
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-500"
                  style={{
                    width: `${status.phase === "running" ? Math.round(status.progress * 100) : 0}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-muted">
                {status.phase === "running" ? `${Math.round(status.progress * 100)} %` : ""} Tu peux
                quitter cette page, le calcul continue. La première fois, le modèle est téléchargé.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                aria-label="Langue de l'audio"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
              {isLongAudio(session.durationMs) && (
                <p className="basis-full text-xs text-accent">
                  Audio de plus de 3 h : compte plusieurs dizaines de minutes de calcul.
                </p>
              )}
              <button
                onClick={onStart}
                className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Transcrire avec Whisper
              </button>
            </div>
          )}
          {status.phase === "error" && <p className="mt-3 text-sm text-red-600">{status.message}</p>}
        </div>
      )}
    </section>
  );
}
