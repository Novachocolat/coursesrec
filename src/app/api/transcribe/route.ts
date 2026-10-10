import { createWhisperJob } from "@/lib/server/whisper";

export async function POST(request: Request) {
  const incoming = await request.formData();
  const file = incoming.get("file");
  if (!(file instanceof Blob) || file.size === 0) {
    return Response.json({ error: "Fichier audio manquant." }, { status: 400 });
  }

  const form = new FormData();
  form.set("file", file, "audio");
  form.set("language", String(incoming.get("language") ?? "auto"));
  const prompt = String(incoming.get("prompt") ?? "").slice(0, 800);
  if (prompt) form.set("prompt", prompt);

  try {
    return Response.json(await createWhisperJob(form));
  } catch {
    return Response.json(
      { error: "Le service Whisper est injoignable. Est-il démarré ?" },
      { status: 502 },
    );
  }
}
