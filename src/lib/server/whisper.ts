const WHISPER_URL = process.env.WHISPER_URL ?? "http://localhost:9000";

export interface WhisperJob {
  id: string;
  status: "queued" | "running" | "done" | "error";
  progress: number;
  model: string;
  language?: string;
  duration?: number;
  elapsed?: number;
  error?: string;
  segments?: { start: number; end: number; text: string }[];
}

export async function createWhisperJob(form: FormData): Promise<{ id: string }> {
  const res = await fetch(`${WHISPER_URL}/jobs`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Whisper a répondu ${res.status}`);
  return res.json();
}

export async function getWhisperJob(id: string): Promise<WhisperJob | null> {
  const res = await fetch(`${WHISPER_URL}/jobs/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Whisper a répondu ${res.status}`);
  return res.json();
}
