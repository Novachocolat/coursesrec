import type { CourseTypeId } from "./courseTypes";
import { courseTypeLabel } from "./courseTypes";
import type { SessionRecord } from "./db";
import { formatTimestamp } from "./transcription";

const TYPE_INSTRUCTIONS: Record<CourseTypeId, string> = {
  lecture: `Structure les notes comme un cours : plan hiérarchique avec titres, définitions et théorèmes mis en évidence, exemples, formules. Termine par « À retenir » (5 à 10 points) et « Questions de révision » (5 questions).`,
  tutorial: `Structure les notes par exercice : énoncé résumé, méthode employée, étapes de résolution, résultat. Relève les erreurs fréquentes et les astuces mentionnées. Termine par « Méthodes à retenir ».`,
  lab: `Structure les notes en étapes ordonnées : objectif, matériel ou outils, manipulations pas à pas, résultats attendus, pièges signalés. Termine par « Checklist » reprenant les étapes.`,
  meeting: `Structure le compte rendu ainsi : participants (si identifiables), ordre du jour, discussions par sujet, décisions prises, actions à mener (qui, quoi, échéance si mentionnée), points ouverts. Reste factuel.`,
  conference: `Structure les notes ainsi : thèse centrale, arguments principaux dans l'ordre, exemples ou données citées, conclusions, puis un court encadré « Questions du public » si pertinent.`,
  interview: `Structure les notes par question posée avec la réponse résumée, en gardant les citations marquantes entre guillemets. Termine par une synthèse des points clés.`,
  other: `Choisis la structure la plus adaptée au contenu et indique-la en une phrase en début de réponse.`,
};

const WORDS_PER_PARAGRAPH_SECONDS = 60;

/** Regroupe les segments en paragraphes d'environ une minute, avec repère horaire. */
export function formatTranscript(session: SessionRecord, timestamps: boolean): string {
  const segments = session.transcript?.segments ?? [];
  if (!timestamps) return segments.map((s) => s.text).join(" ");

  const lines: string[] = [];
  let current: string[] = [];
  let blockStart = 0;
  for (const seg of segments) {
    if (current.length > 0 && seg.start - blockStart >= WORDS_PER_PARAGRAPH_SECONDS) {
      lines.push(`[${formatTimestamp(blockStart)}] ${current.join(" ")}`);
      current = [];
    }
    if (current.length === 0) blockStart = seg.start;
    current.push(seg.text);
  }
  if (current.length > 0) lines.push(`[${formatTimestamp(blockStart)}] ${current.join(" ")}`);
  return lines.join("\n\n");
}

export function buildNotesPrompt(session: SessionRecord, opts: { timestamps: boolean }): string {
  const parts: string[] = [];

  parts.push(
    `Tu es un assistant qui transforme la transcription automatique d'un enregistrement en notes claires et structurées.`,
  );

  parts.push(
    [
      `## Contexte`,
      `- Titre : ${session.title}`,
      `- Type : ${courseTypeLabel(session.courseType)}`,
      session.context ? `- Informations complémentaires : ${session.context}` : null,
      session.durationMs > 0 ? `- Durée : environ ${Math.round(session.durationMs / 60000)} minutes` : null,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  parts.push(
    [
      `## Consignes`,
      TYPE_INSTRUCTIONS[session.courseType],
      ``,
      `Règles générales :`,
      `- Rédige en français, en Markdown (titres, listes, gras pour les termes clés).`,
      `- La transcription vient d'une reconnaissance vocale : elle contient des erreurs (mots mal compris, noms propres, formules). Corrige-les quand le contexte le permet, et signale par « [?] » ce dont tu n'es pas sûr.`,
      `- N'invente rien : si une information n'est pas dans la transcription, ne l'ajoute pas.`,
      `- Supprime les hésitations, répétitions et digressions sans intérêt.`,
      opts.timestamps
        ? `- Les repères [mm:ss] indiquent le moment dans l'enregistrement ; tu peux les citer pour les passages importants.`
        : null,
      session.userNotes.trim()
        ? `- Mes notes personnelles ci-dessous indiquent ce qui m'a semblé important : donne-leur la priorité et intègre-les aux notes.`
        : null,
    ]
      .filter((l) => l !== null)
      .join("\n"),
  );

  if (session.userNotes.trim()) {
    parts.push(`## Mes notes personnelles\n${session.userNotes.trim()}`);
  }

  parts.push(`## Transcription\n${formatTranscript(session, opts.timestamps)}`);

  return parts.join("\n\n");
}

/** Estimation grossière : environ 1,5 token par mot en français. */
export function estimateTokens(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.round(words * 1.5);
}
