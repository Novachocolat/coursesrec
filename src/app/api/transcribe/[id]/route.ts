import { getWhisperJob } from "@/lib/server/whisper";

export async function GET(_request: Request, ctx: RouteContext<"/api/transcribe/[id]">) {
  const { id } = await ctx.params;
  try {
    const job = await getWhisperJob(id);
    if (!job) return Response.json({ error: "Job introuvable." }, { status: 404 });
    return Response.json(job);
  } catch {
    return Response.json({ error: "Le service Whisper est injoignable." }, { status: 502 });
  }
}
