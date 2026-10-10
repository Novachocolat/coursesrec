"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { courseTypeLabel } from "@/lib/courseTypes";
import { TranscriptionPanel } from "./TranscriptionPanel";
import { NotesPanel } from "./NotesPanel";
import { deleteSession, formatDuration, getAudioBlob, updateSession } from "@/lib/sessions";

function extensionFor(mime: string): string {
  if (mime.includes("mp4") || mime.includes("m4a") || mime.includes("aac")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
  if (mime.includes("wav")) return "wav";
  return "webm";
}

export function SessionView({ id }: { id: string }) {
  const router = useRouter();
  const session = useLiveQuery(() => db.sessions.get(id), [id]);
  const chunkCount = useLiveQuery(() => db.chunks.where("sessionId").equals(id).count(), [id]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [blobInfo, setBlobInfo] = useState<{ size: number; type: string } | null>(null);

  useEffect(() => {
    if (!session) return;
    let url: string | null = null;
    let cancelled = false;
    void getAudioBlob(session).then((blob) => {
      if (cancelled || !blob) return;
      url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setBlobInfo({ size: blob.size, type: blob.type });
    });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
    // On ne recharge que si la session ou le nombre de morceaux change.
  }, [session?.id, session?.mimeType, chunkCount]); // eslint-disable-line react-hooks/exhaustive-deps

  if (session === undefined) return <p className="text-sm text-muted">Chargement…</p>;
  if (!session) return <p className="text-sm text-muted">Session introuvable.</p>;

  async function onDelete() {
    if (!window.confirm("Supprimer cette session et son audio ? Action irréversible.")) return;
    await deleteSession(id);
    router.push("/");
  }

  const interrupted = session.status === "recording";

  return (
    <div>
      <p className="text-sm text-muted">
        {courseTypeLabel(session.courseType)} · {formatDuration(session.durationMs)}
      </p>
      <h1 className="font-serif text-3xl font-semibold tracking-tight">{session.title}</h1>

      {interrupted && (
        <p className="mt-4 rounded-xl bg-accent-soft px-4 py-3 text-sm">
          Cet enregistrement a été interrompu. L'audio capté jusque-là est conservé.
        </p>
      )}

      {session.context && (
        <p className="mt-4 rounded-xl border border-line bg-card px-4 py-3 text-sm text-muted">
          <span className="font-medium text-foreground">Contexte : </span>
          {session.context}
        </p>
      )}

      <section className="mt-8">
        <h2 className="mb-2 text-sm font-medium">Audio</h2>
        {audioUrl ? (
          <div className="space-y-2">
            <audio ref={audioRef} controls src={audioUrl} className="w-full" />
            <div className="flex items-center justify-between text-xs text-muted">
              <span>
                {blobInfo ? `${(blobInfo.size / 1_048_576).toFixed(1)} Mo · ${blobInfo.type}` : ""}
              </span>
              <a
                href={audioUrl}
                download={`${session.title.replace(/[^\p{L}\p{N}]+/gu, "-")}.${extensionFor(
                  blobInfo?.type ?? "",
                )}`}
                className="underline underline-offset-2 hover:text-foreground"
              >
                Télécharger
              </a>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">Aucun audio disponible.</p>
        )}
      </section>

      <section className="mt-8">
        <label htmlFor="notes" className="mb-1.5 block text-sm font-medium">
          Mes notes
        </label>
        <textarea
          id="notes"
          rows={8}
          defaultValue={session.userNotes}
          onBlur={(e) => void updateSession(id, { userNotes: e.target.value })}
          className="w-full rounded-xl border border-line bg-card px-4 py-3 font-serif text-base leading-7 outline-none focus:border-accent"
          placeholder="Aucune note."
        />
      </section>

      <TranscriptionPanel
        session={session}
        onSeek={(sec) => {
          const a = audioRef.current;
          if (!a) return;
          a.currentTime = sec;
          void a.play();
        }}
      />

      <NotesPanel session={session} />

      <div className="mt-10 border-t border-line pt-4">
        <button onClick={onDelete} className="text-sm text-red-600 hover:underline">
          Supprimer la session
        </button>
      </div>
    </div>
  );
}
