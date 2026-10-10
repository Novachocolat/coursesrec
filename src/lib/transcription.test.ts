import { describe, expect, it } from "vitest";
import { formatTimestamp, transcriptToText } from "./transcription";
import type { Transcript } from "./db";

const transcript: Transcript = {
  language: "fr",
  model: "small",
  createdAt: 0,
  segments: [
    { start: 0, end: 4, text: "Bonjour." },
    { start: 65, end: 70, text: "Suite du cours." },
  ],
};

describe("formatTimestamp", () => {
  it("formate en m:ss sous une heure", () => {
    expect(formatTimestamp(0)).toBe("0:00");
    expect(formatTimestamp(65.9)).toBe("1:05");
  });

  it("formate en h:mm:ss à partir d'une heure", () => {
    expect(formatTimestamp(3600)).toBe("1:00:00");
    expect(formatTimestamp(5025)).toBe("1:23:45");
  });
});

describe("transcriptToText", () => {
  it("joint les segments par des espaces", () => {
    expect(transcriptToText(transcript)).toBe("Bonjour. Suite du cours.");
  });

  it("ajoute les repères horaires ligne par ligne", () => {
    expect(transcriptToText(transcript, true)).toBe("[0:00] Bonjour.\n[1:05] Suite du cours.");
  });
});
