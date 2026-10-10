# Idées et feuille de route

Document de référence pour les idées d'évolution et la version dans laquelle chacune sera livrée.
Ce qui est livré est dans le [CHANGELOG](../CHANGELOG.md). L'existant est décrit dans l'[architecture](architecture.md).

**Statuts** : 💡 idée · 📌 planifiée · 🚧 en cours · ✅ livrée · ❓ à décider
**Origine** : 👤 toi · 🤖 proposée par Claude

_Dernière mise à jour : 2026-10-10 — version courante : 1.0.0_

---

## 1.1.0 — Fiabilité de l'enregistrement

| Idée | Statut | Origine | Notes |
|---|---|---|---|
| Reprise d'un enregistrement interrompu | 📌 | 👤 | Aujourd'hui l'audio capté est gardé et la session marquée « Interrompue », mais on ne peut pas continuer. |
| Glisser-déposer d'un fichier à l'import | 📌 | 🤖 | Seul le sélecteur de fichier existe. |

## 1.1.1 — Export

| Idée | Statut | Origine | Notes |
|---|---|---|---|
| Export PDF des notes | 📌 | 👤 | Via impression CSS du rendu Markdown. |

## 1.2.0 — Chat avec le cours

| Idée | Statut | Origine | Notes |
|---|---|---|---|
| Chat avec le cours (prompt « transcription + question » à copier) | 📌 | 🤖 | Même principe que les notes : pas de clé API. Citations avec horodatage si possible. |

## À décider (version non attribuée)

| Idée | Statut | Origine | Notes |
|---|---|---|---|
| Stockage persistant (`navigator.storage.persist()`) | ❓ | 🤖 | Demande au navigateur de ne pas purger les sessions. Très peu coûteux. |
| Export / import d'une session (fichier de sauvegarde) | ❓ | 🤖 | Vraie protection contre la perte de données du navigateur. |
| Affichage de l'espace de stockage utilisé | ❓ | 🤖 | Via `navigator.storage.estimate()`. |
| Interface bilingue FR/EN | ❓ | 🤖 | L'interface est en français uniquement, le README est déjà bilingue. |

## Plus tard / sans échéance

| Idée | Statut | Origine | Notes |
|---|---|---|---|
| API cloud pour la transcription et/ou les notes | 💡 | 👤 | Supprime le copier-coller et accélère. Nécessite des clés API payantes (l'abonnement Claude Pro ne donne pas accès à l'API). L'interface `Transcriber` est à créer. |
| Identification des locuteurs (diarisation) | 💡 | 🤖 | Utile pour les réunions. Whisper seul ne le fait pas : API cloud ou outil dédié. |
| Régénérer les notes avec un autre modèle de prompt | 💡 | 🤖 | Choix du template à la régénération. |
| Corriger la transcription à la main | 💡 | 🤖 | Utile avant de générer les notes si Whisper se trompe sur des termes. |
| Modifier le titre, le type et le contexte d'une session | 💡 | 🤖 | Aujourd'hui fixés à la création. |
| Recherche dans les sessions et leurs transcriptions | 💡 | 🤖 | Utile quand la bibliothèque grossit. |
| Découpage en blocs pour les très longs enregistrements | 💡 | 🤖 | Si un audio dépasse la fenêtre de contexte de l'IA utilisée. |
| Fichier `.env.example` | 💡 | 🤖 | À créer avec l'API cloud (aucune variable secrète n'est requise aujourd'hui). |

## Vérifications à faire

| Point | Statut | Notes |
|---|---|---|
| Test de qualité Whisper `small` sur un vrai cours en français | 🚧 | En cours côté utilisateur. Décide si on passe à `medium` ou à une API. |
| Audio d'onglet (visio) | ❓ | Codé mais jamais testé en réel. Chrome / Edge uniquement. |
| Rendu visuel du panneau Notes IA | ❓ | Le panneau navigateur était masqué pendant mes vérifications. |
| Comportement sur Safari / iOS | ❓ | Format d'enregistrement différent (mp4), limites en arrière-plan. |

---

## Comment ce document est tenu

- Toute nouvelle idée est ajoutée ici, avec un statut, une origine et une version cible quand elle est connue.
- Quand une idée est livrée : statut ✅, entrée dans le [CHANGELOG](../CHANGELOG.md), la version courante est mise à jour ci-dessus.
- Ce document est la seule source pour les versions cibles : ne pas les dupliquer ailleurs.
