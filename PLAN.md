# CoursesRec — Plan de travaux

Enregistrer un cours / une réunion → transcription → notes structurées par l'IA, avec le type de cours comme contexte.

## Décisions prises

| Sujet | Choix |
|---|---|
| Usage | Projet perso / apprentissage |
| Entrées audio | Micro direct, import de fichier, audio d'un onglet (visio) |
| Stack | Next.js (TypeScript, App Router) full-stack |
| IA | APIs cloud (transcription + LLM) |
| Langues | Français + anglais (auto-détection) |
| Comptes | Aucun. Stockage local dans le navigateur (IndexedDB) |
| V1 | Type de cours + contexte, notes perso pendant l'enregistrement, chat avec le cours, export Markdown/PDF |
| Style | Minimaliste type Notion/Granola, clair + sombre |

## Architecture

```
Navigateur                               Serveur (routes API Next.js)         Services
──────────                               ────────────────────────────         ────────
MediaRecorder (micro / onglet)  ─┐
Import fichier                  ─┴─ chunks → IndexedDB ─┐
                                                        ├─► POST /api/transcribe ─► API STT (AssemblyAI ou OpenAI)
Session (IndexedDB) ◄── transcript ◄────────────────────┘
        │
        ├─► POST /api/notes  (transcript + type + contexte + notes perso) ─► LLM (Claude), streaming
        └─► POST /api/chat   (transcript + question)                      ─► LLM (Claude), streaming
```

- Les clés API restent côté serveur (`.env.local`), jamais dans le navigateur.
- Pas de base de données : sessions, audio et notes vivent dans IndexedDB (via Dexie).
- Le fournisseur de transcription est derrière une interface `Transcriber`, pour pouvoir en changer.

## Choix techniques

- **Enregistrement** : `MediaRecorder` avec `timeslice` de 5 à 10 s. Chaque morceau est écrit dans IndexedDB avant tout envoi. Détection du format au runtime (webm/opus sur Chrome et Firefox, mp4 sur Safari). Wake Lock pour éviter la veille, avertissement avant fermeture de l'onglet.
- **Audio d'onglet** : `getDisplayMedia({audio: true})`, mixé avec le micro via Web Audio. Fonctionne sur Chrome/Edge uniquement. Safari ne fournit pas l'audio d'onglet, donc message explicite.
- **Transcription** : AssemblyAI proposé par défaut (fichiers longs sans limite de 25 Mo, détection de langue, locuteurs, horodatage). Alternative : OpenAI `gpt-4o-transcribe` avec découpage en segments. Un test comparatif sur 1 vrai cours en français tranchera (Phase 2).
- **Notes** : Claude (`claude-sonnet-5-5`) en streaming. Le prompt dépend du type de cours : magistral, TD, réunion, conférence, entretien. Sortie en Markdown : résumé, plan, points clés, définitions, à retenir, actions.
- **Chat** : même modèle, transcription injectée en contexte, citations avec horodatage.
- **Export** : Markdown (copie/téléchargement), PDF via impression CSS.

## Écrans (frontend)

1. **Accueil / bibliothèque** : liste des sessions (titre, date, durée, type), bouton « Nouvelle session ».
2. **Nouvelle session** : titre, type de cours (sélecteur), contexte libre (matière, vocabulaire, noms), source audio (micro / onglet / fichier).
3. **Enregistrement** : minuteur, niveau sonore, pause/stop, zone de notes perso en Markdown.
4. **Session** : colonne principale avec onglets *Notes IA* / *Transcription* (horodatée, cliquable), panneau latéral *Chat*, bouton *Régénérer* (autre template), *Exporter*.

Design : fond clair cassé, typographie sérif pour les notes et sans-serif pour l'interface, une seule couleur d'accent, beaucoup d'espace, mode sombre, mobile d'abord.

## Phases

### Phase 0 — Fondations
- [x] Projet Next.js + TypeScript + Tailwind (sans shadcn/ui pour l'instant), lancé via Docker Compose
- [x] Lint et build qui passent
- [x] Couche de stockage IndexedDB (Dexie) : sessions et morceaux audio (transcriptions et notes IA à venir)
- [ ] `.env.example` (avec la Phase 2/3)

### Phase 1 — Enregistrement
- [x] Hook `useRecorder` (micro, pause/reprise, timeslice, persistance des chunks) — testé : minuteur, pause, fin, relecture
- [x] Capture d'onglet + mix micro — codé, **non testé** (demande un vrai partage d'onglet)
- [x] Import de fichier (sélecteur ; le glisser-déposer reste à faire)
- [~] Session interrompue : l'audio capté est conservé et signalé « Interrompue ». Reprendre l'enregistrement n'est pas encore possible

### Phase 2 — Transcription
- [x] Service Whisper local (faster-whisper, modèle `small`, conteneur Docker dédié, jobs avec progression)
- [x] Routes `/api/transcribe` (envoi) et `/api/transcribe/[id]` (suivi)
- [x] Affichage de la transcription horodatée, clic sur l'heure pour aller à l'endroit dans l'audio, copie
- [x] Titre + contexte transmis à Whisper comme amorce de vocabulaire
- [ ] Test sur un vrai cours en français (à faire par toi) : qualité, temps de calcul pour 1h30
- [ ] Interface `Transcriber` + fournisseur API cloud (si Whisper local ne suffit pas)

### Phase 3 — Notes IA
Choix : **pas d'API payante pour l'instant**. Le site génère le prompt, tu le colles dans une IA (Claude, ChatGPT…) puis tu colles la réponse.
- [x] Prompts par type de cours + contexte + notes perso (`src/lib/prompts.ts`)
- [x] Panneau « Notes IA » : copier le prompt, repères horaires optionnels, estimation de tokens
- [x] Collage de la réponse, rendu Markdown, copie et téléchargement `.md`
- [ ] (Plus tard, si clé API) route `/api/notes` en streaming, pour supprimer l'étape de copier-coller

### Phase 4 — Garde-fous et qualité (V1.0)
- [x] Limite d'import à 500 Mo, avertissement au-delà de 3 h d'audio
- [x] Version de l'application affichée, `CHANGELOG.md`
- [x] Tests automatisés (Vitest) : stockage, prompts, limites, formats
- [ ] Stockage persistant et sauvegarde export/import d'une session (en attente de décision)

## Feuille de route

| Version | Contenu |
|---|---|
| **1.0.0** | Enregistrement, import, transcription Whisper, prompt de notes, rendu Markdown |
| **1.1.0** | Reprise d'un enregistrement interrompu ; glisser-déposer à l'import |
| **1.1.1** | Export PDF des notes |
| **1.2.0** | Chat avec le cours (prompt « transcription + question » à copier) |
| Plus tard | API cloud (transcription / LLM) pour supprimer le copier-coller, diarisation |

## Risques

- **Safari / iOS** : format audio différent, enregistrement en arrière-plan limité. À tester tôt.
- **Cours longs (1 à 3 h)** : poids du fichier, temps de transcription, fenêtre de contexte du LLM. Prévoir un résumé par blocs si la transcription est trop longue.
- **Qualité en français** : vocabulaire technique, accents, mauvaise acoustique en salle. Le champ contexte et un micro correct comptent beaucoup.
- **Coûts** : paiement à l'usage, à surveiller dès le départ.
- **Vie privée** : l'audio part chez un tiers. À indiquer clairement dans l'interface, et à prévenir les participants pour les réunions.
- **Stockage navigateur** : IndexedDB peut être purgé. Prévoir un export/import des sessions.

## Questions ouvertes

- Clés API : tu as déjà un compte AssemblyAI / OpenAI / Anthropic ?
- Durée typique de tes cours (1 h, 3 h) ?
- Test de transcription : peux-tu fournir un extrait audio de 5 à 10 min ?
