import { db, type AudioSource, type SessionRecord } from "./db";
import type { CourseTypeId } from "./courseTypes";

export interface NewSessionInput {
  title: string;
  courseType: CourseTypeId;
  context: string;
  source: AudioSource;
}

export async function createSession(input: NewSessionInput): Promise<SessionRecord> {
  const session: SessionRecord = {
    id: crypto.randomUUID(),
    title: input.title.trim() || "Session sans titre",
    courseType: input.courseType,
    context: input.context.trim(),
    source: input.source,
    status: input.source === "file" ? "ready" : "recording",
    createdAt: Date.now(),
    durationMs: 0,
    mimeType: "",
    userNotes: "",
  };
  await db.sessions.add(session);
  return session;
}

export async function addChunk(sessionId: string, seq: number, blob: Blob) {
  await db.chunks.add({ sessionId, seq, blob });
}

export async function finishSession(id: string, durationMs: number, mimeType: string) {
  await db.sessions.update(id, { status: "ready", durationMs, mimeType });
}

export async function updateSession(id: string, changes: Partial<SessionRecord>) {
  await db.sessions.update(id, changes);
}

export async function getAudioBlob(session: SessionRecord): Promise<Blob | null> {
  const chunks = await db.chunks.where("sessionId").equals(session.id).sortBy("seq");
  if (chunks.length === 0) return null;
  return new Blob(
    chunks.map((c) => c.blob),
    { type: session.mimeType || chunks[0].blob.type },
  );
}

export async function deleteSession(id: string) {
  await db.transaction("rw", db.sessions, db.chunks, async () => {
    await db.chunks.where("sessionId").equals(id).delete();
    await db.sessions.delete(id);
  });
}

export async function importAudioFile(sessionId: string, file: File, durationMs: number) {
  await addChunk(sessionId, 0, file);
  await finishSession(sessionId, durationMs, file.type || "audio/mpeg");
}

export function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
