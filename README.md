# Surveillant – École primaire (Mauritanie)

Application web simple et **installable sur l'écran d'accueil du téléphone** (PWA) pour le surveillant d'une école primaire.
Fonctionne **hors ligne**, en **français et en arabe**. Les données restent sur le téléphone.

## Fonctions
- ✅ **Appel** par classe (Présent / Absent / Retard), bouton « Tous présents »
- ⚠️ **Incidents** : bagarre, insolence, tenue, travail non fait… avec mesure prise
- 🏫 **Niveaux et divisions** : 1ère → 6ème AF avec divisions A, B, C, D (ex : « 3ème AF - B »)
- 👧🏾 **Élèves** : téléphone du parent (appel / WhatsApp)
- 📥 **Importer une liste d'élèves** : fichier Excel (.xlsx, .xls), CSV ou copier-coller. Colonnes reconnues : Nom, Prénom, Téléphone, Classe, Division (« 3e AF -A », « 3AF B », « 3ème AF - C » sont reconnus). Une feuille Excel par classe est aussi acceptée. Les doublons sont ignorés.
- 🏠 **Tableau de bord** du jour + **rapport partageable sur WhatsApp**
- 💾 Export CSV (Excel), sauvegarde / restauration

## Installation sur le téléphone
- **Android (Chrome)** : ouvrir le site → bouton « Installer » ou menu ⋮ → « Ajouter à l'écran d'accueil »
- **iPhone (Safari)** : Partager ⬆️ → « Sur l'écran d'accueil »

## Déploiement
Site statique, aucune compilation. Sur Netlify : *Build command* vide, *Publish directory* = `.` (déjà configuré dans `netlify.toml`).
