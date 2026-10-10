import type { SessionRecord, Transcript } from "./db";
import { getAudioBlob, updateSession } from "./sessions";

export type TranscriptionStatus =
  | { phase: "idle" }
  | { phase: "uploading" }
  | { phase: "running"; progress: number; queued: boolean }
  | { phase: "error"; message: string };

interface JobResponse {
  status: "queued" | "running" | "done" | "error";
  progress: number;
  model: string;
  language?: string;
  elapsed?: number;
  error?: string;
  segments?: { start: number; end: number; text: string }[];
}

const POLL_MS = 2500;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Envoie l'audio à Whisper et mémorise l'id du job pour pouvoir reprendre le suivi. */
export async function startTranscription(
  session: SessionRecord,
  language: string,
): Promise<string> {
  const blob = await getAudioBlob(session);
  if (!blob) throw new Error("Aucun audio à transcrire.");

  const form = new FormData();
  form.set("file", blob, "audio");
  form.set("language", language);
  // Titre + contexte aident Whisper sur le vocabulaire et les noms propres.
  form.set("prompt", [session.title, session.context].filter(Boolean).join(". "));

  const res = await fetch("/api/transcribe", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Échec de l'envoi pour transcription.");
  await updateSession(session.id, { transcriptionJobId: data.id });
  return data.id as string;
}

/** Suit un job jusqu'à la fin, enregistre le résultat dans la session. */
export async function followTranscription(
  sessionId: string,
  jobId: string,
  onStatus: (s: TranscriptionStatus) => void,
  isCancelled: () => boolean,
): Promise<void> {
  while (!isCancelled()) {
    const res = await fetch(`/api/transcribe/${jobId}`, { cache: "no-store" });
    if (res.status === 404) {
      // Le service a redémarré : le job n'existe plus.
      await updateSession(sessionId, { transcriptionJobId: undefined });
      onStatus({ phase: "error", message: "La transcription a été perdue (service redémarré). Relance-la." });
      return;
    }
    if (!res.ok) {
      onStatus({ phase: "error", message: "Le service de transcription est injoignable." });
      return;
    }
    const job: JobResponse = await res.json();

    if (job.status === "error") {
      await updateSession(sessionId, { transcriptionJobId: undefined });
      onStatus({ phase: "error", message: job.error ?? "La transcription a échoué." });
      return;
    }
    if (job.status === "done") {
      const transcript: Transcript = {
        language: job.language ?? "?",
        model: job.model,
        segments: job.segments ?? [],
        createdAt: Date.now(),
        elapsedSec: job.elapsed,
      };
      await updateSession(sessionId, { transcript, transcriptionJobId: undefined });
      onStatus({ phase: "idle" });
      return;
    }
    onStatus({ phase: "running", progress: job.progress, queued: job.status === "queued" });
    await sleep(POLL_MS);
  }
}

export function formatTimestamp(sec: number): string {
  const s = Math.floor(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

export function transcriptToText(t: Transcript, withTimestamps = false): string {
  return t.segments
    .map((s) => (withTimestamps ? `[${formatTimestamp(s.start)}] ${s.text}` : s.text))
    .join(withTimestamps ? "\n" : " ");
}
