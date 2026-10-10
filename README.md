# CoursesRec

Enregistre un cours ou une réunion, transcris-le, obtiens des notes structurées. Voir [PLAN.md](PLAN.md).

## Lancer le projet (Docker)

```bash
docker compose up
```

Puis ouvre http://localhost:3000. Les dépendances sont installées dans un volume Docker.

Deux services démarrent : `web` (le site) et `whisper` (transcription locale, modèle `small`).
Le modèle est téléchargé au premier lancement d'une transcription, puis conservé dans un volume.
Pour changer de modèle, modifie `WHISPER_MODEL` dans `docker-compose.yml` (`small`, `medium`, `large-v3-turbo`).

Commandes ponctuelles :

```bash
docker compose run --rm web npm test
docker compose run --rm web npm run lint
docker compose run --rm web npm run build
```

## Versions

La version est dans `package.json` (SemVer) et affichée en bas du site. L'historique est dans [CHANGELOG.md](CHANGELOG.md), la feuille de route dans [PLAN.md](PLAN.md).

## État

- Phase 0 : fondations (Next.js, stockage local IndexedDB)
- Phase 1 : enregistrement micro / onglet, import de fichier, bibliothèque de sessions
- Phase 2 : transcription locale avec Whisper, affichage horodaté
- Phase 3 : notes IA par copier-coller (le site génère le prompt, aucune clé API requise)

Les données restent dans le navigateur (IndexedDB). L'audio n'est envoyé qu'à ton propre conteneur Whisper, sur ta machine.
