# Ragnabeurk PNJ

Projet mobile Android pour le générateur de PNJ de Ragnabeurk.

## Compilation depuis GitHub Actions

Le projet contient un workflow `.github/workflows/build-apk.yml` qui compile directement l'APK sur GitHub, sans PC et sans compte EAS.

Depuis un téléphone Android :
1. Envoyer les fichiers du projet dans le dépôt GitHub.
2. Ouvrir **Actions**.
3. Choisir **Build Android APK**.
4. Appuyer sur **Run workflow**.
5. Une fois terminé, récupérer l'APK dans **Artifacts → Ragnabeurk-PNJ-APK**.

## PNJ humanoïdes

Les classes utilisent trois catégories : Base, Avancée et Super. Chaque classe possède un grade A/B/C libre pour chacune des six caractéristiques.

Niveau :
`(Total des 6 statistiques - 6) × 2`

Les races peuvent avoir des sous-races pondérées. Le genre peut être Mâle, Femelle ou Aléatoire.

## Monstres

Les monstres ont leur propre générateur. Le nom est toujours saisi manuellement.

Le niveau peut être :
- précis ;
- tiré aléatoirement dans une fourchette.

### Statistiques

Les six caractéristiques sont comprises entre 0 et 28.
Les grades A/B/C/D servent de priorités de répartition : A = 4, B = 3, C = 1, D = 0 comme poids de génération.

### Armure naturelle

Six types :
- TRA — Tranchant
- CON — Contondant
- PER — Perforant
- CHA — Chaleur
- FRO — Froid
- FOU — Foudre

Chaque type reçoit un grade A/B/C et est tiré avec les dés d'armure configurables. Une valeur d'armure par type est limitée à 12.

### Formule de niveau

`Niveau = ((Stats - 6) × 2) + (Armure - 6)`

Lorsqu'un niveau cible est demandé, le générateur tire d'abord l'armure puis calcule le budget de statistiques. Si un niveau reste libre parce que le budget restant n'est pas divisible par 2, il est conservé comme niveau libre et n'est pas automatiquement distribué.

### PV

`PV max = 9 + (Constitution × Palier)`

Les cinq difficultés correspondent à 100 %, 80 %, 60 %, 40 % et 20 % des PV maximum, arrondies à l'entier inférieur. Par exemple : `10 / 8 / 6 / 4 / 2`.

Les monstres générés peuvent être sauvegardés localement.

## Données

Les races, classes, noms, paramètres de dés, dés d'armure, PNJ et monstres sont conservés localement sur le téléphone avec AsyncStorage. Les données ne nécessitent pas Internet après installation.
