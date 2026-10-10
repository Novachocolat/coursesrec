export const MAX_IMPORT_BYTES = 500 * 1024 * 1024;
export const LONG_AUDIO_MS = 3 * 60 * 60 * 1000;

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1_048_576).toFixed(1)} Mo`;
  return `${(bytes / 1_073_741_824).toFixed(1)} Go`;
}

/** Renvoie un message d'erreur si le fichier ne peut pas être importé, sinon null. */
export function checkImportFile(file: { size: number; type: string; name: string }): string | null {
  if (file.type && !file.type.startsWith("audio/") && !file.type.startsWith("video/")) {
    return "Ce fichier n'est pas un audio ou une vidéo.";
  }
  if (file.size === 0) return "Ce fichier est vide.";
  if (file.size > MAX_IMPORT_BYTES) {
    return `Fichier trop volumineux (${formatBytes(file.size)}, maximum ${formatBytes(MAX_IMPORT_BYTES)}). Compresse-le en mp3 ou m4a avant de l'importer.`;
  }
  return null;
}

export function isLongAudio(durationMs: number): boolean {
  return durationMs > LONG_AUDIO_MS;
}
