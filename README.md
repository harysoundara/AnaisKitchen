# AnaisKitchen 🌲🍽️

Carnet de recettes d'Anaïs — application web (HTML/CSS/JS pur, sans backend).
Toutes les données (recettes, planning, congélateur, historique) sont stockées
**localement dans le navigateur** (localStorage) : rien n'est envoyé sur un serveur.

## Onglets

- **Ce soir** (accueil) : filtre les recettes par temps de cuisson et par mode
  (poêle / four / autre), et propose un tirage au sort avec le bouton 🎲.
- **Planning** : assigne une recette à chaque jour de la semaine.
- **Favoris** : les recettes marquées d'une étoile ★.
- **Historique** : le journal des repas faits + quelques statistiques
  (total, ce mois-ci, recette la plus cuisinée).
- **Congélo** : liste des aliments au congélateur (quantité, nom, date de
  péremption), triée automatiquement du plus proche au plus éloigné.
- **Profil** : ajouter une nouvelle recette (nom, temps, four/poêle, photo)
  et voir/supprimer la liste complète.

## 1. Mettre le site sur GitHub

```bash
cd anaiskitchen
git init
git add .
git commit -m "Premier envoi d'AnaisKitchen"
git branch -M main
git remote add origin https://github.com/<ton-pseudo>/anaiskitchen.git
git push -u origin main
```

## 2. Activer GitHub Pages

1. Sur GitHub, ouvre le repo → **Settings** → **Pages**.
2. Dans « Build and deployment », choisis **Branch: main** / dossier **/ (root)**.
3. Enregistre. Après 1–2 minutes, le site sera accessible à une adresse du type :
   `https://<ton-pseudo>.github.io/anaiskitchen/`

## 3. Ajouter l'app à l'écran d'accueil de l'iPhone

1. Ouvre l'adresse ci-dessus dans **Safari** sur l'iPhone (important : Safari,
   pas Chrome, pour que l'ajout à l'écran d'accueil fonctionne bien).
2. Appuie sur le bouton **Partager** (le carré avec la flèche vers le haut).
3. Choisis **« Sur l'écran d'accueil »**.
4. Valide — l'icône **AnaisKitchen** (vert sapin avec le sceau « AK ») apparaît
   sur l'écran d'accueil et s'ouvre en plein écran, comme une vraie app.

## Remarques

- Les données (recettes, photos, planning...) sont propres à **chaque appareil**
  et à **chaque navigateur**. Si Anaïs utilise l'app sur son iPhone, ses
  recettes resteront sur son iPhone (pas de synchronisation entre appareils
  pour l'instant).
- Les photos sont stockées directement dans le navigateur : évite les photos
  trop lourdes (l'appareil photo de l'iPhone compresse généralement assez
  pour que ça passe sans problème).
- Un `sw.js` (service worker) est inclus pour permettre un usage hors-ligne
  une fois l'app ouverte une première fois avec une connexion.
