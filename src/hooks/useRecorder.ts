"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { addChunk, finishSession } from "@/lib/sessions";
import type { AudioSource } from "@/lib/db";

export type RecorderState = "idle" | "requesting" | "recording" | "paused" | "stopped" | "error";

const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/mp4",
  "audio/webm",
  "audio/ogg;codecs=opus",
];
const TIMESLICE_MS = 5000;
// Débit modeste : suffisant pour la parole, garde un fichier léger sur 1h30.
const AUDIO_BITS_PER_SECOND = 48_000;

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  return MIME_CANDIDATES.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
}

async function openStreams(source: AudioSource) {
  const mic = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true },
  });
  if (source === "mic") return { stream: mic, cleanup: [mic] as MediaStream[], ctx: null };

  // Audio d'onglet : Chrome/Edge exigent de demander la vidéo, on ne garde que le son.
  let display: MediaStream;
  try {
    display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
  } catch (e) {
    mic.getTracks().forEach((t) => t.stop());
    throw e;
  }
  display.getVideoTracks().forEach((t) => t.stop());
  if (display.getAudioTracks().length === 0) {
    mic.getTracks().forEach((t) => t.stop());
    throw new Error(
      "Aucun son partagé. Choisis un onglet et coche « Partager l'audio de l'onglet ».",
    );
  }

  const ctx = new AudioContext();
  const dest = ctx.createMediaStreamDestination();
  ctx.createMediaStreamSource(mic).connect(dest);
  ctx.createMediaStreamSource(new MediaStream(display.getAudioTracks())).connect(dest);
  return { stream: dest.stream, cleanup: [mic, display], ctx };
}

export function useRecorder(sessionId: string, source: AudioSource) {
  const [state, setState] = useState<RecorderState>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const cleanupRef = useRef<MediaStream[]>([]);
  const ctxRef = useRef<AudioContext | null>(null);
  const seqRef = useRef(0);
  const pendingWrites = useRef<Promise<unknown>[]>([]);
  const mimeRef = useRef("");
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  // Chronomètre : temps accumulé hors pause + début du segment en cours.
  const accumulatedRef = useRef(0);
  const segmentStartRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const currentElapsed = () =>
    accumulatedRef.current +
    (segmentStartRef.current !== null ? performance.now() - segmentStartRef.current : 0);

  const releaseResources = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    cleanupRef.current.forEach((s) => s.getTracks().forEach((t) => t.stop()));
    cleanupRef.current = [];
    void ctxRef.current?.close();
    ctxRef.current = null;
    void wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
  }, []);

  useEffect(() => () => releaseResources(), [releaseResources]);

  const startMeter = useCallback((stream: MediaStream) => {
    const ctx = ctxRef.current ?? new AudioContext();
    ctxRef.current = ctx;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const data = new Uint8Array(analyser.fftSize);
    let last = 0;
    const tick = (now: number) => {
      rafRef.current = requestAnimationFrame(tick);
      if (now - last < 66) return;
      last = now;
      analyser.getByteTimeDomainData(data);
      let peak = 0;
      for (const v of data) peak = Math.max(peak, Math.abs(v - 128));
      setLevel(Math.min(1, peak / 64));
      setElapsedMs(currentElapsed());
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setState("requesting");
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        throw new Error("Ce navigateur ne permet pas l'enregistrement audio.");
      }
      const { stream, cleanup, ctx } = await openStreams(source);
      cleanupRef.current = cleanup;
      ctxRef.current = ctx;

      const mimeType = pickMimeType();
      mimeRef.current = mimeType;
      const recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: AUDIO_BITS_PER_SECOND,
      });
      mimeRef.current = recorder.mimeType || mimeType;

      recorder.ondataavailable = (e) => {
        if (e.data.size === 0) return;
        const seq = seqRef.current++;
        // On écrit chaque morceau en local immédiatement : rien n'est perdu si l'onglet plante.
        pendingWrites.current.push(addChunk(sessionId, seq, e.data));
      };
      recorder.onerror = () => {
        setError("L'enregistrement a rencontré une erreur.");
        setState("error");
      };
      // Le partage d'onglet peut être coupé par l'utilisateur depuis le navigateur.
      stream.getAudioTracks().forEach((t) =>
        t.addEventListener("ended", () => {
          if (recorderRef.current?.state !== "inactive") recorderRef.current?.stop();
        }),
      );

      recorderRef.current = recorder;
      recorder.start(TIMESLICE_MS);
      accumulatedRef.current = 0;
      segmentStartRef.current = performance.now();
      startMeter(stream);
      setState("recording");

      try {
        wakeLockRef.current = (await navigator.wakeLock?.request("screen")) ?? null;
      } catch {
        // Le wake lock est un confort, pas une exigence.
      }
    } catch (e) {
      releaseResources();
      const message =
        e instanceof DOMException && e.name === "NotAllowedError"
          ? "Accès refusé. Autorise le micro (ou le partage d'onglet) dans le navigateur."
          : e instanceof Error
            ? e.message
            : "Impossible de démarrer l'enregistrement.";
      setError(message);
      setState("error");
    }
  }, [sessionId, source, startMeter, releaseResources]);

  const pause = useCallback(() => {
    const r = recorderRef.current;
    if (!r || r.state !== "recording") return;
    r.pause();
    accumulatedRef.current = currentElapsed();
    segmentStartRef.current = null;
    setState("paused");
  }, []);

  const resume = useCallback(() => {
    const r = recorderRef.current;
    if (!r || r.state !== "paused") return;
    r.resume();
    segmentStartRef.current = performance.now();
    setState("recording");
  }, []);

  const stop = useCallback(async (): Promise<number> => {
    const r = recorderRef.current;
    if (!r) return 0;
    const duration = currentElapsed();
    segmentStartRef.current = null;
    accumulatedRef.current = duration;
    if (r.state !== "inactive") {
      await new Promise<void>((resolve) => {
        r.addEventListener("stop", () => resolve(), { once: true });
        r.stop();
      });
    }
    await Promise.all(pendingWrites.current);
    await finishSession(sessionId, duration, mimeRef.current);
    releaseResources();
    setElapsedMs(duration);
    setLevel(0);
    setState("stopped");
    return duration;
  }, [sessionId, releaseResources]);

  return { state, elapsedMs, level, error, start, pause, resume, stop };
}
