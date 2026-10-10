"use client";

import { useMemo, useState } from "react";
import Markdown from "react-markdown";
import type { SessionRecord } from "@/lib/db";
import { updateSession } from "@/lib/sessions";
import { courseTypeLabel } from "@/lib/courseTypes";
import { buildNotesPrompt, estimateTokens } from "@/lib/prompts";

export function NotesPanel({ session }: { session: SessionRecord }) {
  const [timestamps, setTimestamps] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pasted, setPasted] = useState("");
  const [editing, setEditing] = useState(false);

  const prompt = useMemo(
    () => (session.transcript ? buildNotesPrompt(session, { timestamps }) : ""),
    [session, timestamps],
  );

  if (!session.transcript) {
    return (
      <section className="mt-8 rounded-2xl border border-dashed border-line px-5 py-6 text-sm text-muted">
        Les notes IA seront disponibles une fois la transcription terminée.
      </section>
    );
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function saveNotes() {
    const text = pasted.trim();
    if (!text) return;
    await updateSession(session.id, { aiNotes: text });
    setPasted("");
    setEditing(false);
  }

  function downloadMarkdown() {
    const blob = new Blob([session.aiNotes ?? ""], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${session.title.replace(/[^\p{L}\p{N}]+/gu, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const tokens = estimateTokens(prompt);
  const hasNotes = Boolean(session.aiNotes);

  return (
    <section className="mt-8">
      <h2 className="mb-2 text-sm font-medium">Notes IA</h2>

      {hasNotes && !editing ? (
        <div className="rounded-2xl border border-line bg-card">
          <div className="notes-prose px-6 py-5">
            <Markdown>{session.aiNotes}</Markdown>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-4 border-t border-line px-4 py-2.5 text-xs text-muted">
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(session.aiNotes ?? "");
              }}
              className="underline underline-offset-2 hover:text-foreground"
            >
              Copier le Markdown
            </button>
            <button
              onClick={downloadMarkdown}
              className="underline underline-offset-2 hover:text-foreground"
            >
              Télécharger .md
            </button>
            <button
              onClick={() => {
                setPasted(session.aiNotes ?? "");
                setEditing(true);
              }}
              className="underline underline-offset-2 hover:text-foreground"
            >
              Modifier / remplacer
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5 rounded-2xl border border-line bg-card p-5">
          <div>
            <p className="text-sm font-medium">1. Copie le prompt</p>
            <p className="mt-1 text-xs text-muted">
              Il contient les consignes adaptées au type « {courseTypeLabel(session.courseType)} », ton
              contexte, tes notes et la transcription. Colle-le dans Claude, ChatGPT, Gemini…
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                onClick={copyPrompt}
                className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                {copied ? "Copié ✓" : "Copier le prompt"}
              </button>
              <label className="flex items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={timestamps}
                  onChange={(e) => setTimestamps(e.target.checked)}
                />
                Repères horaires
              </label>
              <span className="text-xs text-muted">≈ {tokens.toLocaleString("fr-FR")} tokens</span>
              <button
                onClick={() => setShowPrompt((v) => !v)}
                className="text-xs text-muted underline underline-offset-2 hover:text-foreground"
              >
                {showPrompt ? "Masquer" : "Voir le prompt"}
              </button>
            </div>
            {showPrompt && (
              <textarea
                readOnly
                value={prompt}
                rows={12}
                className="mt-3 w-full rounded-xl border border-line bg-background px-3 py-2 font-mono text-xs leading-5 outline-none"
              />
            )}
          </div>

          <div>
            <p className="text-sm font-medium">2. Colle la réponse de l'IA</p>
            <textarea
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              rows={8}
              placeholder="Colle ici les notes générées (Markdown)…"
              className="mt-2 w-full rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <div className="mt-2 flex items-center gap-3">
              <button
                onClick={saveNotes}
                disabled={!pasted.trim()}
                className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background disabled:opacity-40"
              >
                Enregistrer les notes
              </button>
              {editing && (
                <button
                  onClick={() => {
                    setEditing(false);
                    setPasted("");
                  }}
                  className="text-sm text-muted underline underline-offset-2"
                >
                  Annuler
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
