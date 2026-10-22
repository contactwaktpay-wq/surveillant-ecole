# Surveillant – Vie scolaire (école primaire, Mauritanie)

Application web **installable sur l'écran d'accueil** (PWA), **hors ligne**, **français / العربية**.
Toutes les données restent sur le téléphone du surveillant.

## Fonctions
- ✅ **Appel** par classe avec **bouton « Enregistrer l'appel »**, appel verrouillé après enregistrement, **« Modifier »** pour corriger (avec « Annuler »).
  Brouillon conservé automatiquement, élèves non marqués signalés, heure d'arrivée des retards, 1 ou 2 appels par jour (matin / après-midi).
- 💬 **Prévenir les parents** des absents et retardataires en un toucher (WhatsApp, SMS, appel) – message déjà rédigé en arabe et/ou français, accordé fille/garçon.
- 📝 **Justification des absences** (maladie, voyage, famille…) et liste des absences non justifiées.
- ⚠️ **Incidents** (type, mesure prise, témoin) + convocation des parents.
- 🚪 **Sorties anticipées** : qui a récupéré l'enfant, lien de parenté, téléphone.
- 👧🏾 **Élèves** : niveaux et divisions (A, B, C…), import Excel/CSV, parent, 2 téléphones, sexe, santé/allergies, fiche complète.
- 💰 **Mensualités** (optionnel) : payés / non payés par mois, encaissé, reste, relance WhatsApp.
- 📊 **Rapports** : rapport du jour (WhatsApp / PDF), rapport mensuel (taux de présence, élèves les plus absents), exports Excel.
- 🖨️ **Fiches d'appel papier** de secours (semaine, toutes classes).
- 🔒 **Code PIN**, 💾 sauvegarde partageable (WhatsApp) et restauration, nouvelle année scolaire.

## Déploiement
Site statique sans compilation. Netlify : build vide, dossier publié `.` (voir `netlify.toml`).
