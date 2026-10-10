# Développement

Tout tourne dans Docker : aucune installation de Node nécessaire sur la machine.

## Lancer

```bash
docker compose up
```

Deux services :

| Service | Rôle | Port |
|---|---|---|
| `web` | Site Next.js en mode dev (`npm run dev`) | 3000 |
| `whisper` | Transcription locale (faster-whisper) via une petite API de jobs | 9000 (interne) |

Les `node_modules` et le cache `.next` vivent dans des volumes Docker, pas sur l'hôte. Le modèle Whisper est dans le volume `whisper_models`.

## Commandes ponctuelles

```bash
docker compose run --rm web npm test        # tests unitaires (Vitest)
docker compose run --rm web npm run lint
docker compose run --rm web npm run build
docker compose run --rm web npm install <paquet>
```

## Structure

```
src/
  app/                 Pages (accueil, /new, /record/[id], /session/[id]) et routes /api/transcribe
  components/          Écrans et panneaux (enregistrement, transcription, notes)
  hooks/useRecorder.ts Enregistrement (MediaRecorder, pause, morceaux persistés)
  lib/
    db.ts              Schéma IndexedDB (Dexie)
    sessions.ts        Création, morceaux audio, suppression
    transcription.ts   Envoi à Whisper et suivi du job
    prompts.ts         Génération du prompt de notes par type de session
    limits.ts          Limites d'import
    server/whisper.ts  Client du service Whisper (côté serveur)
whisper/               Image Docker du service de transcription (server.py)
```

## Notes de conception

- **Aucune base côté serveur** : sessions, audio et notes sont dans IndexedDB. Les routes API ne font que relayer vers Whisper.
- **Chaque morceau audio est écrit en local avant tout envoi** (toutes les 5 s) pour survivre à un plantage.
- **Le service Whisper traite un job à la fois** ; les autres attendent.
- **Next.js** : le projet utilise `cacheComponents`. Les pages dynamiques qui lisent `params` doivent être enveloppées dans `<Suspense>`.
- **Versions figées dans `whisper/Dockerfile`** : `faster-whisper` et `av` (une version plus récente de `av` casse le décodage).

## Versions et publication

SemVer, dans `package.json`. À chaque version : mettre à jour le [CHANGELOG](../CHANGELOG.md) et la [feuille de route](roadmap.md). Si l'architecture change, mettre à jour [architecture.md](architecture.md).
