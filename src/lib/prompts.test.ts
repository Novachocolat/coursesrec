import { describe, expect, it } from "vitest";
import { buildNotesPrompt, estimateTokens, formatTranscript } from "./prompts";
import type { SessionRecord } from "./db";

function makeSession(over: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: "s1",
    title: "Algèbre linéaire",
    courseType: "lecture",
    context: "L2 maths",
    source: "mic",
    status: "ready",
    createdAt: 0,
    durationMs: 5_400_000,
    mimeType: "audio/webm",
    userNotes: "",
    transcript: {
      language: "fr",
      model: "small",
      createdAt: 0,
      segments: [
        { start: 0, end: 8, text: "Bonjour." },
        { start: 30, end: 40, text: "Définition." },
        { start: 70, end: 80, text: "Théorème." },
      ],
    },
    ...over,
  };
}

describe("formatTranscript", () => {
  it("regroupe par minute avec repères quand demandé", () => {
    const out = formatTranscript(makeSession(), true);
    expect(out).toBe("[0:00] Bonjour. Définition.\n\n[1:10] Théorème.");
  });

  it("renvoie un texte continu sans repères", () => {
    expect(formatTranscript(makeSession(), false)).toBe("Bonjour. Définition. Théorème.");
  });

  it("gère l'absence de transcription", () => {
    expect(formatTranscript(makeSession({ transcript: undefined }), true)).toBe("");
  });
});

describe("buildNotesPrompt", () => {
  it("contient le titre, le type, le contexte et la transcription", () => {
    const p = buildNotesPrompt(makeSession(), { timestamps: false });
    expect(p).toContain("Titre : Algèbre linéaire");
    expect(p).toContain("Type : Cours magistral");
    expect(p).toContain("Informations complémentaires : L2 maths");
    expect(p).toContain("Bonjour. Définition. Théorème.");
    expect(p).toContain("environ 90 minutes");
  });

  it("adapte les consignes au type de session", () => {
    const meeting = buildNotesPrompt(makeSession({ courseType: "meeting" }), { timestamps: false });
    expect(meeting).toContain("décisions prises");
    expect(meeting).not.toContain("Questions de révision");
  });

  it("n'inclut les notes perso que si elles existent", () => {
    const without = buildNotesPrompt(makeSession(), { timestamps: false });
    expect(without).not.toContain("## Mes notes personnelles");

    const withNotes = buildNotesPrompt(makeSession({ userNotes: "Penser au spectral" }), {
      timestamps: false,
    });
    expect(withNotes).toContain("## Mes notes personnelles\nPenser au spectral");
  });

  it("omet la ligne de contexte vide", () => {
    const p = buildNotesPrompt(makeSession({ context: "" }), { timestamps: false });
    expect(p).not.toContain("Informations complémentaires");
  });

  it("n'explique les repères horaires que s'ils sont présents", () => {
    expect(buildNotesPrompt(makeSession(), { timestamps: true })).toContain("[mm:ss]");
    expect(buildNotesPrompt(makeSession(), { timestamps: false })).not.toContain("[mm:ss]");
  });
});

describe("estimateTokens", () => {
  it("compte environ 1,5 token par mot", () => {
    expect(estimateTokens("un deux trois quatre")).toBe(6);
  });
});
