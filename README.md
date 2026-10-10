# CoursesRec

🇫🇷 [Français](#-français) · 🇬🇧 [English](#-english)

---

## 🇫🇷 Français

Enregistre un cours ou une réunion, obtiens la transcription, puis des notes structurées par l'IA de ton choix.

### Ce que ça fait

- **Enregistre** au micro, l'audio d'un onglet (visio) ou **importe** un fichier audio.
- **Transcrit** automatiquement en français ou en anglais, **sur ton ordinateur** (Whisper).
- **Prépare un prompt** adapté au type de session (cours, TD, réunion…) à coller dans Claude, ChatGPT ou autre.
- **Garde les notes** générées, mises en forme, avec export Markdown.
- **Aucun compte, aucune clé API**, aucun abonnement.

### Prérequis

- [Docker](https://www.docker.com/products/docker-desktop/) installé et démarré.
- Un navigateur récent. Chrome ou Edge sont nécessaires pour capter l'audio d'un onglet.
- Environ 2 Go d'espace disque (images Docker et modèle de transcription).

### Démarrage

```bash
docker compose up
```

Ouvre ensuite **http://localhost:3000**.

Le premier lancement est long (construction de l'image, installation des dépendances). Le modèle de transcription (~500 Mo) est téléchargé lors de la première transcription, puis conservé.

Pour arrêter : `Ctrl+C`, ou `docker compose down`.

### Utilisation

1. **Nouvelle session** : donne un titre, choisis le type (cours magistral, TD, réunion…) et ajoute un contexte (matière, vocabulaire, noms propres). Plus c'est précis, meilleures sont les notes.
2. **Choisis la source** : micro, onglet + micro, ou fichier audio.
3. **Enregistre**. Tu peux mettre en pause et prendre tes propres notes pendant ce temps. Clique sur **Terminer** à la fin.
4. **Transcris** : clique sur « Transcrire avec Whisper ». Tu peux quitter la page, le calcul continue.
5. **Génère les notes** : clique sur « Copier le prompt », colle-le dans l'IA de ton choix, puis colle sa réponse dans le site et enregistre.

### Bon à savoir

| Sujet | Détail |
|---|---|
| **Confidentialité** | L'audio reste sur ta machine : il n'est envoyé qu'au service Whisper local. Le prompt contient la transcription : il part chez l'IA où tu le colles, selon ses règles. |
| **Stockage** | Tes sessions sont dans ton navigateur. Elles peuvent être effacées si tu vides les données du site ou si le disque manque de place. Télécharge l'audio et copie tes notes pour les conserver. |
| **Limites** | Import : 500 Mo maximum. Au-delà de 3 h d'audio, la transcription devient très longue. |
| **Durée de transcription** | Elle dépend de ton ordinateur (calcul sur processeur). Compte plusieurs minutes pour 1 h 30. |
| **Langues** | Français et anglais, avec détection automatique. |
| **Enregistrement interrompu** | L'audio déjà capté est conservé, mais on ne peut pas encore reprendre l'enregistrement. |

### Dépannage

- **« Le service Whisper est injoignable »** : vérifie que `docker compose up` tourne toujours.
- **La transcription ne démarre pas / reste à 0 %** : la première fois, le modèle est en cours de téléchargement. Patiente quelques minutes.
- **« Aucun son partagé »** (audio d'onglet) : dans la fenêtre de partage, choisis un **onglet** et coche « Partager l'audio de l'onglet ».
- **Le micro est refusé** : autorise-le dans les réglages du site de ton navigateur.
- **Repartir de zéro côté Docker** : `docker compose down -v` (supprime aussi le modèle téléchargé, pas tes sessions du navigateur).

### Changer la qualité de transcription

Dans `docker-compose.yml`, service `whisper`, modifie `WHISPER_MODEL` :

| Modèle | Taille | Usage |
|---|---|---|
| `small` (défaut) | ~500 Mo | Bon compromis, rapide |
| `medium` | ~1,5 Go | Meilleur sur le vocabulaire technique, plus lent |
| `large-v3-turbo` | ~1,6 Go | Meilleure qualité, le plus lent |

Puis relance avec `docker compose up -d --force-recreate whisper`.

### Versions

La version est affichée en bas du site. L'historique est dans [CHANGELOG.md](CHANGELOG.md), la suite prévue dans la [feuille de route](docs/roadmap.md). Pour les développeurs : [documentation](docs/README.md).

---

## 🇬🇧 English

Record a lecture or a meeting, get the transcript, then structured notes written by the AI of your choice.

### What it does

- **Records** from the microphone or a browser tab's audio (video calls), or **imports** an audio file.
- **Transcribes** French or English automatically, **on your own computer** (Whisper).
- **Builds a prompt** tailored to the session type (lecture, tutorial, meeting…) to paste into Claude, ChatGPT or any other AI.
- **Keeps the generated notes**, nicely formatted, with Markdown export.
- **No account, no API key**, no subscription.

### Requirements

- [Docker](https://www.docker.com/products/docker-desktop/) installed and running.
- A recent browser. Chrome or Edge are required to capture a tab's audio.
- About 2 GB of disk space (Docker images and the transcription model).

### Getting started

```bash
docker compose up
```

Then open **http://localhost:3000**.

The first start is slow (image build, dependency install). The transcription model (~500 MB) is downloaded on the first transcription, then kept.

To stop: `Ctrl+C`, or `docker compose down`.

### How to use

1. **New session**: give it a title, pick the type (lecture, tutorial, meeting…) and add some context (subject, vocabulary, proper names). The more precise, the better the notes.
2. **Choose the source**: microphone, tab + microphone, or audio file.
3. **Record**. You can pause and type your own notes meanwhile. Click **Terminer** (Finish) when done.
4. **Transcribe**: click "Transcrire avec Whisper". You can leave the page, the job keeps running.
5. **Generate the notes**: click "Copier le prompt" (Copy prompt), paste it into the AI of your choice, then paste its answer back into the site and save.

> The interface is currently in French.

### Good to know

| Topic | Details |
|---|---|
| **Privacy** | Audio stays on your machine: it is only sent to the local Whisper service. The prompt contains the transcript: it goes to whichever AI you paste it into, under its own policy. |
| **Storage** | Sessions live in your browser. They can be erased if you clear site data or the disk runs low. Download the audio and copy your notes to keep them safe. |
| **Limits** | Import: 500 MB maximum. Beyond 3 h of audio, transcription gets very long. |
| **Transcription time** | Depends on your computer (CPU-based). Expect several minutes for 1.5 hours. |
| **Languages** | French and English, with automatic detection. |
| **Interrupted recording** | Audio captured so far is kept, but you can't resume recording yet. |

### Troubleshooting

- **"Le service Whisper est injoignable" (Whisper service unreachable)**: check that `docker compose up` is still running.
- **Transcription won't start / stays at 0%**: the model is probably still downloading on the first run. Wait a few minutes.
- **"Aucun son partagé" (no audio shared)** (tab audio): in the share dialog, pick a **tab** and tick "Share tab audio".
- **Microphone denied**: allow it in your browser's site settings.
- **Start over on the Docker side**: `docker compose down -v` (also removes the downloaded model, not your browser sessions).

### Changing transcription quality

In `docker-compose.yml`, `whisper` service, change `WHISPER_MODEL`:

| Model | Size | Use |
|---|---|---|
| `small` (default) | ~500 MB | Good trade-off, fast |
| `medium` | ~1.5 GB | Better on technical vocabulary, slower |
| `large-v3-turbo` | ~1.6 GB | Best quality, slowest |

Then restart with `docker compose up -d --force-recreate whisper`.

### Versions

The version is shown at the bottom of the site. History is in [CHANGELOG.md](CHANGELOG.md), what comes next in the [roadmap](docs/roadmap.md). For developers: [documentation](docs/README.md).
