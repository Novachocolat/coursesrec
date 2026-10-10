import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import {
  addChunk,
  createSession,
  deleteSession,
  finishSession,
  formatDuration,
  getAudioBlob,
  importAudioFile,
  updateSession,
} from "./sessions";

beforeEach(async () => {
  await db.sessions.clear();
  await db.chunks.clear();
});

describe("createSession", () => {
  it("crée une session d'enregistrement avec des valeurs par défaut", async () => {
    const s = await createSession({ title: "  ", courseType: "lecture", context: " ctx ", source: "mic" });
    expect(s.title).toBe("Session sans titre");
    expect(s.context).toBe("ctx");
    expect(s.status).toBe("recording");
    expect(await db.sessions.get(s.id)).toBeDefined();
  });

  it("marque directement prête une session importée", async () => {
    const s = await createSession({ title: "Import", courseType: "other", context: "", source: "file" });
    expect(s.status).toBe("ready");
  });
});

describe("audio", () => {
  it("réassemble les morceaux dans l'ordre de séquence", async () => {
    const s = await createSession({ title: "T", courseType: "lecture", context: "", source: "mic" });
    await addChunk(s.id, 2, new Blob(["C"]));
    await addChunk(s.id, 0, new Blob(["A"]));
    await addChunk(s.id, 1, new Blob(["B"]));
    await finishSession(s.id, 1000, "audio/webm");

    const session = (await db.sessions.get(s.id))!;
    expect(session.status).toBe("ready");
    expect(session.durationMs).toBe(1000);

    const blob = (await getAudioBlob(session))!;
    expect(await blob.text()).toBe("ABC");
    expect(blob.type).toBe("audio/webm");
  });

  it("renvoie null sans morceaux", async () => {
    const s = await createSession({ title: "T", courseType: "lecture", context: "", source: "mic" });
    expect(await getAudioBlob(s)).toBeNull();
  });

  it("n'assemble que les morceaux de la session demandée", async () => {
    const a = await createSession({ title: "A", courseType: "lecture", context: "", source: "mic" });
    const b = await createSession({ title: "B", courseType: "lecture", context: "", source: "mic" });
    await addChunk(a.id, 0, new Blob(["a"]));
    await addChunk(b.id, 0, new Blob(["b"]));
    expect(await (await getAudioBlob(a))!.text()).toBe("a");
  });

  it("importe un fichier comme un unique morceau", async () => {
    const s = await createSession({ title: "F", courseType: "other", context: "", source: "file" });
    await importAudioFile(s.id, new File(["data"], "cours.mp3", { type: "audio/mpeg" }), 42_000);
    const session = (await db.sessions.get(s.id))!;
    expect(session.durationMs).toBe(42_000);
    expect(session.mimeType).toBe("audio/mpeg");
    expect(await db.chunks.where("sessionId").equals(s.id).count()).toBe(1);
  });
});

describe("updateSession / deleteSession", () => {
  it("met à jour les notes", async () => {
    const s = await createSession({ title: "T", courseType: "lecture", context: "", source: "mic" });
    await updateSession(s.id, { userNotes: "important" });
    expect((await db.sessions.get(s.id))!.userNotes).toBe("important");
  });

  it("supprime la session et tous ses morceaux", async () => {
    const s = await createSession({ title: "T", courseType: "lecture", context: "", source: "mic" });
    await addChunk(s.id, 0, new Blob(["x"]));
    await deleteSession(s.id);
    expect(await db.sessions.get(s.id)).toBeUndefined();
    expect(await db.chunks.where("sessionId").equals(s.id).count()).toBe(0);
  });
});

describe("formatDuration", () => {
  it("formate mm:ss puis h:mm:ss", () => {
    expect(formatDuration(0)).toBe("00:00");
    expect(formatDuration(65_000)).toBe("01:05");
    expect(formatDuration(3_725_000)).toBe("1:02:05");
  });
});
