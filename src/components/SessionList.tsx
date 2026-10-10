"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { courseTypeLabel } from "@/lib/courseTypes";
import { formatDuration } from "@/lib/sessions";

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function SessionList() {
  const sessions = useLiveQuery(() => db.sessions.orderBy("createdAt").reverse().toArray(), []);

  if (sessions === undefined) {
    return <p className="text-sm text-muted">Chargement…</p>;
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line px-6 py-16 text-center">
        <h2 className="font-serif text-xl font-semibold">Aucune session pour le moment</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          Enregistre un cours ou une réunion, ou importe un fichier audio. Tout reste dans ton
          navigateur.
        </p>
        <Link
          href="/new"
          className="mt-6 inline-block rounded-full bg-accent px-5 py-2 text-sm font-medium text-white"
        >
          Créer ma première session
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-line rounded-2xl border border-line bg-card">
      {sessions.map((s) => {
        const interrupted = s.status === "recording";
        return (
          <li key={s.id}>
            <Link
              href={`/session/${s.id}`}
              className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-accent-soft"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{s.title}</p>
                <p className="mt-0.5 text-sm text-muted">
                  {courseTypeLabel(s.courseType)} · {dateFmt.format(s.createdAt)}
                </p>
              </div>
              <div className="shrink-0 text-right text-sm text-muted">
                {interrupted ? (
                  <span className="rounded-full bg-accent-soft px-2 py-0.5 text-accent">
                    Interrompue
                  </span>
                ) : (
                  <span className="tabular-nums">{formatDuration(s.durationMs)}</span>
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
