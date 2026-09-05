# Clairière — App de relaxation VR (Quest 2, hors-ligne)

## Contenu du dossier
- `index.html` — l'application (scène, faune animée, audio binaural, Xeno-canto, splat)
- `sw.js` — Service Worker qui met tout en cache pour un fonctionnement 100% hors-ligne
- `manifest.json` — permet d'installer un raccourci sur l'écran d'accueil du Quest
- `assets/env/mossy_forest_4k.exr` — le décor 360° (forêt moussue)
- `assets/models/fraxinelle.ksplat` — ta première plante en Gaussian Splatting
- `assets/audio/` — **à compléter** : dépose ici `foret-ambiance.mp3` et
  `foret-ruisseau.mp3` (liens CC0 ci-dessous)

## ⚠️ Étape manuelle requise : les sons
Deux fichiers audio CC0 (domaine public, zéro contrainte de licence) trouvés sur
BigSoundBank. Télécharge-les et place-les dans `assets/audio/` sous ces noms exacts :
- `foret-ambiance.mp3` ← https://bigsoundbank.com/UPLOAD/mp3/0100.mp3
- `foret-ruisseau.mp3` ← https://bigsoundbank.com/UPLOAD/mp3/2713.mp3

## Note sur le lupin.ply
Retiré de cette version : 99 806 points bruts (non compressés) étaient trop lourds
pour un rendu fluide en VR. La fraxinelle en `.ksplat` (4,8 Mo, compressée) le
remplace comme preuve de concept pour le pipeline splat → app. Le même traitement
(allègement + export `.ksplat`) pourra être appliqué au lupin plus tard si tu veux
le réintégrer.

## Installation (une seule fois, avec du réseau)
1. Héberge ce dossier quelque part en HTTPS : GitHub Pages est le plus simple et gratuit
   (pousse le dossier dans un repo, active Pages, tu obtiens une URL du style
   `https://tonuser.github.io/tonrepo/`).
2. Ouvre cette URL dans le navigateur du Quest — même sur le WiFi capricieux de la fac,
   ou en partageant la connexion de ton téléphone.
3. **Laisse la page charger entièrement** (la barre de chargement doit atteindre 100% —
   c'est le téléchargement du fichier EXR de 31 Mo, ça peut prendre un moment).
4. Une fois chargée, le Service Worker (`sw.js`) met automatiquement tout en cache.
   Dans le menu du navigateur : **"Ajouter à l'écran d'accueil"** → tu obtiens une icône
   cliquable dans la bibliothèque du Quest.

## Après l'installation : zéro réseau nécessaire
Le Service Worker sert tous les fichiers depuis le cache local du casque. Tu peux couper
le WiFi et l'app fonctionnera normalement — décor, splat de fraxinelle, abeille, oiseau,
libellules/papillons.

**Exception** : le chant d'oiseau récupéré via Xeno-canto est mis en cache seulement
*après* la première fois où il a été téléchargé avec succès. Donc : la toute première
fois, assure-toi d'avoir du réseau au moins le temps que le message
"Chant réel chargé" apparaisse en bas de l'écran. Ensuite, il rejouera hors-ligne.

## Mettre à jour l'app plus tard
Le cache est agressif par design (c'est le but, pour l'offline). Si tu modifies
`index.html` ou ajoutes des assets, **incrémente `CACHE_NAME` dans `sw.js`**
(ex: `clairiere-v1` → `clairiere-v2`), sinon le Quest continuera de servir l'ancienne
version depuis son cache. Il faudra aussi une reconnexion réseau ponctuelle pour que
le nouveau cache se télécharge.

## Prochaines étapes
1. **Sons d'ambiance** : voir l'étape manuelle ci-dessus (2 fichiers CC0 à déposer).
2. **Autres splats de plantes (.ksplat)** : ajoute d'autres `splatViewer.addSplatScene(...)`
   dans `index.html` avec leurs propres position/rotation/scale.
3. **Modèles .glb** (abeille, oiseau, libellules, papillons) : remplaceront les
   géométries procédurales actuelles. Le squelette d'animation (`AnimationMixer`)
   sera à brancher si tes modèles ont des clips d'animation.
4. **Espèce d'oiseau** : change `BIRD_SPECIES.scientific` dans `index.html` pour
   n'importe quelle espèce Xeno-canto (ex: `Turdus merula` pour le merle noir).
5. **Version nuit** : `toggleDayNight()` est le point d'entrée prévu — il faudra
   une 2e image EXR nocturne + des sons de chouette/hibou/cigales.
6. **EXR trop lourd** : si le chargement est trop long, convertis le en JPG
   "tonemapped" (perte de la plage dynamique HDR mais fichier ~5x plus léger) —
   suffisant pour une skybox, moins pour de vrais reflets PBR.

## Nouveau : nom scientifique, rayons de lumière, respiration de l'espace
- **Nom scientifique** : affiché en italique sous le titre dans le panneau pédagogique,
  construit à partir de `rec.gen` + `rec.sp` (genre + espèce réels de l'enregistrement
  Xeno-canto, avec repli sur `BIRD_SPECIES.scientific` si absent).
- **Rayons de lumière volumétriques** : 5 rayons fins en rendu additif, orientés selon
  la direction du soleil, avec léger scintillement et balancement organique. Technique
  légère (pas de post-processing/EffectComposer) adaptée au GPU mobile du Quest 2.
- **Respiration de l'espace** : très léger mouvement sinusoïdal (quelques millimètres)
  appliqué au `rig` — jamais à la caméra directement, pour rester compatible avec le
  tracking VR — qui casse la sensation de rigidité totale sans jamais provoquer de gêne.

## Nouveau : réalisme visuel
- **Pollen / poussière de lumière** : 140 particules qui montent doucement en oscillant,
  rendu additif pour un effet lumineux dans les rayons de soleil.
- **Ombres de contact** : sous l'abeille et l'oiseau, s'assombrissent/rétrécissent selon
  la hauteur de vol — ancre visuellement les créatures dans l'espace.
- **Brouillard `FogExp2`** réactivé pour la profondeur.
- ~~Brume au sol~~ — supprimée depuis (voir section dédiée plus bas).

## Nouveau : séquence pédagogique (chant → apparition → fiche Xeno-canto)
Quand le chant Xeno-canto démarre, l'oiseau se **matérialise** (effet de dissolution :
scale-in avec léger rebond + pluie d'étincelles), puis un **panneau flottant** apparaît
en fondu à côté de lui, toujours tourné vers le spectateur. Le contenu du panneau n'est
**pas écrit en dur** : il est construit dynamiquement à partir des métadonnées réelles
de l'enregistrement Xeno-canto (type de chant, lieu, date, enregistreur — voir
`buildBirdDescription()` dans `index.html`). Le titre utilise le nom anglais retourné
par l'API (`rec.en`), avec repli sur `BIRD_SPECIES.common` si absent.
Le même effet de matérialisation s'applique à la fraxinelle en splat dès son chargement.
Fonctions clés : `materialize()`, `spawnSparkleBurst()`, `createInfoPanel()`,
`drawInfoPanel()`, `buildBirdDescription()`.
Pour ajouter d'autres espèces plus tard, il suffira d'étendre `BIRD_SPECIES` en tableau
et de rejouer la même séquence pour chacune — la fiche se construira automatiquement
à partir de ce que Xeno-canto renvoie, sans texte à rédiger.
Xeno-canto n'a pas été touché à part la spatialisation déjà en place (le son de l'oiseau
reste positionné exactement sur son modèle) et cette exploitation de ses métadonnées.

## Nouveau : fondus audio à l'entrée
L'ambiance de forêt et le ruisseau ne démarrent plus à pleine puissance : fondu progressif
sur 4s via le nouveau système `fadeValue()` / `updateFades()`, réutilisé aussi pour
l'apparition en fondu du panneau pédagogique.

## Nouveau : architecture générique pour futurs modèles .glb / .ksplat
Pour ajouter un futur modèle (abeille, oiseau, libellule... en `.glb` ou `.ksplat`),
**une seule ligne suffit** dans `ASSET_LIBRARY` (`index.html`) — chargement, dissolution
d'apparition, ombre de contact et (pour les `.glb`) animation par squelette sont déjà
branchés génériquement, rien d'autre à toucher :
```js
{ id: 'abeille-glb', type: 'glb', path: './assets/models/abeille.glb',
  position: [0, 1.4, -1], scale: 0.06, clipName: 'Fly' },
```
Détails :
- **`.glb`** (`loadGlbCreature`) : charge via `GLTFLoader`, joue automatiquement le clip
  d'animation nommé (`clipName`) ou le premier trouvé si le modèle a un squelette animé,
  se matérialise à l'arrivée comme le reste (dissolution + étincelles).
- **`.ksplat`** (`loadKsplatCreature`) : ajouté au même `DropInViewer` partagé que la
  fraxinelle, avec la même dissolution — ou l'option `revealSweep: true` pour un effet
  plus organique de balayage vertical (façon "sortie de terre", via clipping plane
  Three.js). **Best-effort** : dépend du matériau interne de GaussianSplats3D, à valider
  visuellement une fois un vrai fichier testé ; repli automatique sur la dissolution
  classique en cas d'erreur.
- **Finitions visuelles** (`beautifyModel`) appliquées à tout `.glb` chargé : ombres
  portées/reçues activées, intensité d'environnement ajustée (cohérence avec la skybox
  EXR comme éclairage ambiant), léger rim light émissif pour détacher les silhouettes
  fines (ailes, pattes, antennes) du décor.
- `flip180: true` disponible pour les deux types si l'export est tête en bas (cas vécu
  avec la fraxinelle).
La fraxinelle actuelle est déjà migrée dans ce système (`ASSET_LIBRARY[0]`), donc rien
n'a changé visuellement pour elle — c'est la même chose, juste réorganisée pour accueillir
la suite facilement.

## Nouveau : papillon et libellule (.glb), battement d'ailes procédural
Deux modèles scannés ajoutés (`papillon.glb`, `libellule.glb`, compressés Draco —
**`DRACOLoader` est maintenant requis et configuré**, sans lui le chargement échoue
silencieusement). Ces modèles n'ont ni squelette ni animation embarquée (specimens
scannés à plat, ailes figées ouvertes), donc le vol est simulé par un **shader de
battement procédural** (`attachWingFlutter` dans `index.html`) : les sommets sont
pliés autour d'une charnière verticale au centre du corps, avec une amplitude qui
augmente avec l'éloignement au centre (l'extrémité des ailes bouge plus que le corps).
**Expérimental** : suppose que l'axe X du modèle correspond à l'envergure des ailes
(vrai pour un specimen scanné à plat). Si le résultat ne va pas dans le bon sens une
fois testé en VR, essaie `wingFlutter: { hingeAxis:'z', ... }` dans `ASSET_LIBRARY`,
ou ajuste `maxAngleDeg`/`flapSpeed` — je n'ai pas pu prévisualiser le rendu réel.
Réglages actuels : papillon = ample et lent (24°, vitesse 6), libellule = rapide et
discret (10°, vitesse 16).

## Nouveau : rotation continue de la fraxinelle
Rotation lente ajoutée (`splatViewer.rotation.y`). **Attention** : le `DropInViewer`
est partagé par tous les `.ksplat` de `ASSET_LIBRARY` — tant qu'il n'y en a qu'un
seul (la fraxinelle), cette rotation ne concerne qu'elle. Si un second splat est
ajouté plus tard, il tournera aussi avec elle ; il faudra alors soit l'accepter,
soit passer à un `DropInViewer` séparé par splat pour un contrôle indépendant.

## Nouveau : photo de l'espèce + sonogramme dans la fiche pédagogique
- **Sonogramme** : image réelle fournie directement par Xeno-canto (`rec.sono.med`) —
  aucune API supplémentaire nécessaire, juste normalisation de l'URL.
- **Photo de l'espèce** : **nouvelle source externe** — l'API REST publique de
  Wikipedia (`fetchSpeciesPhotoUrl` dans `index.html`), gratuite et sans clé,
  puisque Xeno-canto est une archive audio seule (pas de photos). Recherche par nom
  anglais puis repli sur le nom scientifique si la première page n'existe pas.
- La fiche s'affiche d'abord sans photo/sonogramme (texte seul, pour ne pas faire
  attendre l'utilisateur), puis se redessine enrichie dès que les deux images
  arrivent en parallèle.
- Panneau agrandi (720×460, plan 0.9×0.575m) pour accueillir la mise en page :
  titre/nom scientifique en haut-gauche, photo en médaillon haut-droit, texte
  au milieu, sonogramme en bande basse.

## Nouveau : environnements 100% locaux (fini les appels réseau pour les décors)
Le mode jour/nuit (qui allait chercher un ciel étoilé sur Poly Haven) est remplacé
par un **cycle de 5 environnements**, tous locaux (`ENV_LIBRARY` dans `index.html`) :
forêt moussue (défaut), forêt d'automne, cascade, allée, sentier tropical. Dépose
les 5 fichiers `.exr` dans `assets/env/` :
- `mossy_forest_4k.exr` (déjà présent)
- `autumn_forest_01_4k.exr`
- `lauter_waterfall_8k.exr`
- `preller_drive_4k.exr`
- `rainforest_trail_4k.exr`

Déclenchement inchangé : touche `N` (test desktop) ou gâchette contrôleur en VR —
passe au décor suivant dans la liste. **Note sur le cache offline** : seul le décor
par défaut (`mossy_forest_4k.exr`) est pré-mis en cache à l'installation ; les 4
autres (environ 250 Mo au total à eux cinq) se mettent en cache automatiquement dès
que tu les charges une première fois via le cycle — évite un premier téléchargement
énorme d'un coup. Les sons de chouette/cigales du mode nuit ont été retirés (plus de
vraie "nuit" dans les décors fournis) ; à réintroduire facilement plus tard si tu
ajoutes un EXR nocturne dédié.

## Suppression : la brume
Retirée entièrement à ta demande (rendu jugé pas convaincant). Le code (texture,
génération des nappes, mise à jour dans la boucle de rendu) a été supprimé, pas
juste désactivé.

## Nouveau : plusieurs oiseaux d'Europe en cycle
6 espèces européennes défilent automatiquement, une toutes les 20s (`BIRD_CYCLE_INTERVAL`
dans `index.html`) : rougegorge, merle noir, mésange charbonnière, pinson des arbres,
rossignol philomèle, chardonneret élégant. Chaque arrivée reprend la séquence pédagogique
déjà en place (chant Xeno-canto → matérialisation → fiche) et repart en fondu de sortie
(dissolution inverse + chant qui s'éteint en douceur + fiche qui s'estompe) avant que le
suivant n'arrive. Fonctions clés : `birdCycleLoop()`, `showNextBird()`, `hideBird()`,
`dematerialize()` (symétrique de `materialize()`), `fadeOutSound()`, `hideInfoPanel()`.
Le cycle démarre à l'entrée en VR ou en AR (nécessaire côté navigateur : l'audio ne peut
démarrer qu'après une interaction utilisateur). Si Xeno-canto ne répond pas pour une
espèce (hors-ligne, quota), le cycle passe simplement à la suivante au tour d'après plutôt
que de bloquer.
Pour ajuster la liste ou le rythme : `BIRD_SPECIES_LIST` (ajouter/retirer des espèces,
n'importe quel nom scientifique reconnu par Xeno-canto) et `BIRD_CYCLE_INTERVAL`.

## Correctifs rendu (historique) : pollen, rayons de lumière
Bug identifié après un premier test : **espace colorimétrique manquant** sur les
textures générées par canvas (pollen, rayons, étincelles, ombres) —
sans `texture.colorSpace = THREE.SRGBColorSpace`, le renderer les affichait
ternes/désaturées. Corrigé partout (`makeRadialTexture`, `makeRayTexture`).
Les rayons de lumière ont aussi été adoucis : dégradé désormais en largeur ET en
longueur (pas seulement en longueur) pour éviter l'effet "rectangle plat", et
billboard partiel vers la caméra (mélange 60% direction du soleil / 40% face
caméra) pour limiter l'effet "vu de tranche" en VR stéréo.

## Nouveau : mode AR téléphone (pour debug sans casque)
Un second bouton "📱 Essayer en AR (téléphone)" a été ajouté à côté du bouton VR
(`ARButton` de Three.js, à côté de `VRButton`). Utile pour prévisualiser rapidement
les changements sans avoir à mettre le casque.
**Prérequis** : Chrome sur Android avec support ARCore (WebXR `immersive-ar`). Sur
iPhone/Safari, ce mode n'est pas disponible (pas de support WebXR AR natif) — le
bouton indiquera "AR NOT SUPPORTED" dans ce cas.
**Note** : la scène a un décor 360° opaque (skybox), donc en AR le décor recouvre
la vraie pièce plutôt que de s'y mélanger — c'est volontaire pour ce cas d'usage
(prévisualisation fidèle du rendu final, pas une vraie expérience de réalité mixte).

## Nouveau : mode nuit
Le mode nuit est maintenant fonctionnel : décor étoilé (Poly Haven "Dikhololo Night",
chargé à la demande depuis leur CDN), lumière très tamisée, chant d'oiseau + ruisseau
coupés au profit d'une chouette hulotte et de cigales (CC0, BigSoundBank).
**Déclenchement** : appuie sur la gâchette (select) de n'importe quel contrôleur Quest
une fois en VR. Pour tester sans casque, la touche `N` du clavier fonctionne aussi.
Ces sons/décors de nuit se téléchargent au premier basculement (nécessite du réseau
cette fois-là), puis sont mis en cache par le Service Worker pour les fois suivantes.
Une machine à états (`updateEncounters` dans `index.html`) fait apparaître une
créature à la fois, avec un fondu d'entrée/sortie (1,8s), un vol de 16s sur une
trajectoire douce — orbite large et lente pour les papillons, plus resserrée et
rapide pour les libellules — puis une pause de 6s avant la suivante. Le pool
cycle actuellement entre 2 papillons (couleur aléatoire à chaque rechargement de
page) et 1 libellule. Réglages ajustables : `FADE_DURATION`, `FLIGHT_DURATION`,
`PAUSE_BETWEEN`. Remplaçables par des `.glb` plus tard — la machine à états gère
déjà l'apparition/disparition, seul le contenu visuel de chaque créature change.

## Notes techniques
- Three.js r160 (modules ES via unpkg) — mis en cache par le Service Worker après
  le premier chargement, donc lui aussi fonctionne hors-ligne ensuite.
- `renderer.toneMapping = ACESFilmicToneMapping` pour un rendu correct du EXR HDR.
- Pas de locomotion imposée : l'utilisateur reste sur place, seule la tête bouge —
  cohérent avec un espace de relaxation statique.
- L'abeille et l'oiseau sont des géométries procédurales simples pour l'instant
  (facilement remplaçables par tes `.glb`), avec battement d'ailes animé par code.
