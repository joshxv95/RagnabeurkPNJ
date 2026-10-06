# Ragnabeurk PNJ

Application Expo/React Native pour générer des PNJ et des monstres de Ragnabeurk.

## Monstres
- Statistiques : Force, Dextérité, Agilité, **Vitalité**, Intelligence, Chance.
- Classes de monstres : Physique, Magique, Hybride, Polyvalent, toutes configurables.
- Armure naturelle indépendante pour TRA, CON, PER, CHA, FRO et FOU.
- Six profils de dés d'armure A à F, configurables ; exemple par défaut : A=1d3-1 et F=1d6+6.
- Les modificateurs positifs et négatifs sont acceptés.
- Formule : `Niveau = 1 + floor((Stats-6)/2) + floor((Armure-6)/2)`.
- Stats et armure commencent chacune à 6.
- PV max : `9 + (Vitalité × Palier)`.

## Compatibilité
Les anciennes données utilisant « Constitution » sont migrées automatiquement vers « Vitalité ». Les anciens monstres ayant un seul grade d'armure sont convertis vers ce grade pour les six types.

## Compilation GitHub Actions
Le workflow `.github/workflows/build-apk.yml` génère l'APK Android avec Expo prebuild puis Gradle.
