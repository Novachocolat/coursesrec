# Changelog

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).
La version courante est dans `package.json` et affichée en bas du site.

## [Non publié]

## [1.0.0] — 2026-10-10

### Ajouté
- Enregistrement au micro ou audio d'un onglet (visio), avec pause et notes personnelles pendant la session.
- Import de fichier audio (500 Mo maximum, avertissement au-delà de 3 h).
- Sauvegarde locale de l'audio toutes les 5 s (IndexedDB), sans compte.
- Transcription locale avec Whisper (`small`) dans un conteneur Docker, avec progression et reprise du suivi.
- Transcription horodatée cliquable, copie.
- Génération d'un prompt de notes adapté au type de session (copier / coller la réponse de l'IA).
- Affichage Markdown des notes, copie et téléchargement `.md`.
- Tests automatisés (Vitest) sur le stockage, les prompts, les limites et les formats.

### Limites connues
- Pas de reprise d'un enregistrement interrompu (l'audio capté est conservé).
- Audio d'onglet non testé sur Safari (non supporté) ; Chrome et Edge uniquement.
