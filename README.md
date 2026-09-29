# Ragnabeurk PNJ — projet Expo/EAS

Projet mobile Android pour le générateur de PNJ de Ragnabeurk.

## Compilation cloud

Le projet est préparé pour produire un APK Android avec Expo Application Services (EAS).

Sur un environnement disposant de Node.js :
1. Installer EAS CLI : `npm install -g eas-cli`
2. Se connecter : `eas login`
3. Dans ce dossier : `npm install`
4. Lancer : `eas build -p android --profile preview`
5. Choisir un projet Expo si EAS le demande.
6. Le build `preview` est configuré pour produire un `.apk`.

Le build `production` produit également un APK avec la configuration fournie.

## Règles par défaut

Base :
- A = 1d6
- B = 1d4
- C = 1d3 - 1
- minimum = 0

Avancée :
- A = 2d6
- B = 2d4 - 1
- C = 2d3 - 2
- minimum = 16

Super :
- A = 3d6
- B = 3d4 - 2
- C = 3d3 - 3
- minimum = 26

Niveau :
(total des 6 statistiques - 6) × 3 + 1

Le ratio A/B/C d'une classe est totalement libre.

## Données

Les races, classes, noms, paramètres de dés et PNJ sont conservés localement sur le téléphone avec AsyncStorage. Les données ne nécessitent pas Internet après installation.

Les races utilisent un poids relatif : les poids ne doivent pas obligatoirement totaliser 100.

## Remarque

Le projet est volontairement simple afin de faciliter les builds cloud et les futures modifications.


## Compilation gratuite depuis GitHub (sans PC)

Le projet contient maintenant un workflow GitHub Actions qui peut compiler l'application en APK dans le cloud.

### Depuis un téléphone Android

1. Créez un compte gratuit sur GitHub.
2. Créez un nouveau dépôt (repository), de préférence **privé** si vous ne voulez pas rendre le code public.
3. Envoyez dans ce dépôt tous les fichiers de ce projet.
4. Ouvrez l'onglet **Actions** du dépôt.
5. Sélectionnez **Build Android APK**.
6. Appuyez sur **Run workflow**.
7. Une fois la compilation terminée, ouvrez le résultat du workflow.
8. Dans **Artifacts**, téléchargez **Ragnabeurk-PNJ-APK**.
9. Décompressez l'archive téléchargée puis installez `Ragnabeurk-PNJ.apk` sur votre téléphone.

Le workflow utilise Expo EAS pour la compilation Android. Aucun PC ni installation de Node.js n'est nécessaire sur votre téléphone.
