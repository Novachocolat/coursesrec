# Architecture

État actuel (v1.0.0). Les évolutions prévues sont dans la [feuille de route](roadmap.md).

## Décisions de conception

| Sujet | Choix |
|---|---|
| Usage | Projet personnel / apprentissage |
| Entrées audio | Micro, audio d'un onglet (visio), import de fichier |
| Stack | Next.js (App Router, TypeScript), Tailwind, lancé via Docker Compose |
| Transcription | Whisper en local (faster-whisper, modèle `small`) dans un conteneur dédié |
| Notes IA | Pas d'API payante : le site génère un prompt à copier dans une IA, puis on colle la réponse |
| Langues | Français et anglais, détection automatique |
| Comptes | Aucun. Données dans le navigateur (IndexedDB) |
| Style | Minimaliste type Notion / Granola, clair et sombre |

## Vue d'ensemble

```
Navigateur                                   Docker (ta machine)
──────────                                   ───────────────────
MediaRecorder (micro / onglet)  ─┐
Import de fichier               ─┴─► morceaux audio ─► IndexedDB (Dexie)
                                                          │
                      POST /api/transcribe ◄──────────────┘  (audio assemblé)
                              │
                       service `web` (Next.js) ──► service `whisper` (jobs)
                              ▲                          │
                      GET /api/transcribe/[id] ◄─────────┘  (progression, segments)
                              │
                  transcription ► IndexedDB ► prompt de notes ► (copier) ► IA de ton choix
                                                    ▲                          │
                                       notes IA collées dans la session ◄──────┘
```

- Aucune base côté serveur : les routes API ne font que relayer vers Whisper.
- Le service Whisper traite un job à la fois, expose une progression et conserve le résultat en mémoire jusqu'à son redémarrage.

## Choix techniques

- **Enregistrement** : `MediaRecorder` avec un `timeslice` de 5 s ; chaque morceau est écrit dans IndexedDB avant tout envoi. Format détecté à l'exécution (webm/opus sur Chrome et Firefox, mp4 sur Safari), débit audio de 48 kbit/s. Verrou d'écran (Wake Lock) et avertissement avant fermeture de l'onglet.
- **Audio d'onglet** : `getDisplayMedia`, mixé avec le micro par Web Audio. Chrome et Edge uniquement.
- **Transcription** : amorce de vocabulaire avec le titre et le contexte de la session, filtre de silences (VAD), horodatage par segment.
- **Notes** : `src/lib/prompts.ts` assemble contexte, consignes selon le type de session, notes personnelles et transcription (avec repères de minute en option).
- **Limites** : import de 500 Mo maximum, avertissement au-delà de 3 h d'audio (`src/lib/limits.ts`).

## Écrans

1. **Accueil** : liste des sessions (titre, type, date, durée, état).
2. **Nouvelle session** : titre, type, contexte, source audio.
3. **Enregistrement** : minuteur, niveau sonore, pause / terminer, notes personnelles auto-sauvegardées.
4. **Session** : lecteur audio, notes perso, transcription horodatée cliquable, notes IA (prompt, collage, rendu Markdown).

## Risques connus

- **Safari / iOS** : format audio différent, enregistrement en arrière-plan limité, pas d'audio d'onglet.
- **Cours longs (1 à 3 h)** : poids du fichier, durée de transcription sur processeur, fenêtre de contexte de l'IA utilisée.
- **Qualité en français** : vocabulaire technique, accents, acoustique de salle. Le contexte de session et un bon micro comptent beaucoup.
- **Vie privée** : l'audio reste local, mais le prompt contient la transcription et part chez l'IA où il est collé. Prévenir les participants d'une réunion.
- **Stockage navigateur** : IndexedDB peut être purgé par le navigateur (voir la feuille de route : sauvegarde et stockage persistant).
