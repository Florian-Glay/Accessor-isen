# Controller / 01

Vitrine interactive d’une manette 3D, prête pour GitHub Pages.

## Publier avec GitHub Pages

1. Créez un dépôt GitHub puis poussez ce dossier sur la branche `main`.
2. Dans **Settings → Pages**, choisissez **GitHub Actions** comme source de publication.
3. Le workflow `.github/workflows/deploy-pages.yml` publie automatiquement le contenu de `dist/`.

Le modèle source est servi depuis `dist/assets/game-controller.glb`. Le visualiseur est construit avec Three.js chargé depuis jsDelivr : aucune étape de compilation ni dépendance à installer.
