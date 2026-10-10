import { describe, expect, it } from "vitest";
import { MAX_IMPORT_BYTES, checkImportFile, formatBytes, isLongAudio } from "./limits";

const file = (over: Partial<{ size: number; type: string; name: string }> = {}) => ({
  size: 10_000_000,
  type: "audio/mpeg",
  name: "cours.mp3",
  ...over,
});

describe("checkImportFile", () => {
  it("accepte un audio de taille raisonnable", () => {
    expect(checkImportFile(file())).toBeNull();
  });

  it("accepte une vidéo (extraction audio)", () => {
    expect(checkImportFile(file({ type: "video/mp4" }))).toBeNull();
  });

  it("refuse un fichier au-delà de la limite", () => {
    expect(checkImportFile(file({ size: MAX_IMPORT_BYTES + 1 }))).toMatch(/trop volumineux/);
  });

  it("accepte un fichier pile à la limite", () => {
    expect(checkImportFile(file({ size: MAX_IMPORT_BYTES }))).toBeNull();
  });

  it("refuse un fichier vide", () => {
    expect(checkImportFile(file({ size: 0 }))).toMatch(/vide/);
  });

  it("refuse un type qui n'est ni audio ni vidéo", () => {
    expect(checkImportFile(file({ type: "application/pdf" }))).toMatch(/pas un audio/);
  });

  it("accepte un type inconnu (certains navigateurs ne le fournissent pas)", () => {
    expect(checkImportFile(file({ type: "" }))).toBeNull();
  });
});

describe("isLongAudio", () => {
  it("signale au-delà de 3 h seulement", () => {
    expect(isLongAudio(3 * 3600 * 1000)).toBe(false);
    expect(isLongAudio(3 * 3600 * 1000 + 1)).toBe(true);
  });
});

describe("formatBytes", () => {
  it("choisit l'unité adaptée", () => {
    expect(formatBytes(512)).toBe("1 Ko");
    expect(formatBytes(5 * 1_048_576)).toBe("5.0 Mo");
    expect(formatBytes(1_610_612_736)).toBe("1.5 Go");
  });
});
