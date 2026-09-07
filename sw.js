// Service Worker — met en cache tous les fichiers nécessaires pour un
// fonctionnement 100% hors-ligne après la première visite.
// Attention : incrémente CACHE_NAME à chaque mise à jour de l'app pour
// forcer le rechargement du cache (sinon le Quest gardera l'ancienne version).
const CACHE_NAME = 'clairiere-v13';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  // Environnement par défaut (les 4 autres se mettent en cache automatiquement
  // dès que l'utilisateur les charge via la touche N / la gâchette contrôleur —
  // voir la règle de cache dynamique same-origin plus bas. Ça évite de précharger
  // ~250 Mo d'un coup à la première visite).
  './assets/env/mossy_forest_4k.exr',
  './assets/env/thumbs/mossy_forest.webp',
  './assets/env/thumbs/autumn_forest.webp',
  './assets/env/thumbs/lauter_waterfall.webp',
  './assets/env/thumbs/preller_drive.webp',
  './assets/env/thumbs/rainforest_trail.webp',
  './assets/models/fraxinelle.ksplat',
  './assets/models/papillon.glb',
  './assets/models/libellule.glb',
  './assets/audio/foret-ambiance.mp3',
  './assets/audio/foret-ruisseau.mp3',
  // Dépendances Three.js + GaussianSplats3D (mises en cache depuis le CDN)
  'https://unpkg.com/three@0.160.0/build/three.module.js',
  'https://unpkg.com/three@0.160.0/examples/jsm/loaders/EXRLoader.js',
  'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js',
  'https://unpkg.com/three@0.160.0/examples/jsm/loaders/DRACOLoader.js',
  'https://unpkg.com/three@0.160.0/examples/jsm/webxr/VRButton.js',
  'https://unpkg.com/three@0.160.0/examples/jsm/webxr/ARButton.js',
  'https://unpkg.com/@mkkellogg/gaussian-splats-3d@0.4.6/build/gaussian-splats-3d.module.js',
  // Décodeur Draco (fichiers binaires WASM/JS chargés à l'exécution par DRACOLoader)
  'https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/draco_decoder.js',
  'https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/draco_decoder.wasm',
  'https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/draco_wasm_wrapper.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // addAll échoue si UN SEUL fichier manque — on passe donc en ajout tolérant
      return Promise.allSettled(
        ASSETS_TO_CACHE.map((url) => cache.add(url).catch((e) => console.warn('Non mis en cache:', url, e)))
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Stratégie : cache d'abord (offline-first), avec repli réseau si absent du cache.
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  const isSameOrigin = url.startsWith(self.location.origin);
  const isXenoCantoMedia = /xeno-canto\.org.*\.(mp3|wav|ogg|png|jpg|jpeg)/i.test(url);
  const isWikipediaPhoto = /wikipedia\.org|wikimedia\.org/i.test(url);
  const isWeservProxy = /images\.weserv\.nl/i.test(url);

  // Ne PAS intercepter les domaines hors liste (ex: unpkg.com, xeno-canto pour
  // l'API JSON elle-même). Les laisser filer nativement évite tout risque que
  // le Service Worker casse une requête cross-origin qu'il ne gère pas — bug
  // réel rencontré avec le sonogramme Xeno-canto (bloqué CORS + catch() sans
  // retour valide = "Failed to convert value to 'Response'", qui empêchait le
  // repli côté page via proxy de fonctionner correctement).
  if (!isSameOrigin && !isXenoCantoMedia && !isWikipediaPhoto && !isWeservProxy) {
    return; // laisse le navigateur gérer directement, sans passer par respondWith()
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Met en cache dynamiquement : tout le same-origin (couvre notamment les
        // 4 autres environnements EXR chargés à la demande via le cycle de décors,
        // ainsi que les photos/futurs .glb/.ksplat ajoutés localement), et les
        // chants + sonogrammes Xeno-canto une fois téléchargés avec succès.
        if (event.request.method === 'GET' && response.ok && (isSameOrigin || isXenoCantoMedia || isWikipediaPhoto)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // IMPORTANT : respondWith() exige toujours une vraie Response, jamais
        // undefined — sinon la requête échoue plus fort qu'un simple 404/CORS
        // normal, et le code de repli côté page (ex: proxy d'image) ne se
        // déclenche pas correctement. Une réponse d'erreur explicite laisse le
        // navigateur (et notre <img>.onerror côté page) réagir normalement.
        return new Response('', { status: 504, statusText: 'Network error (Service Worker)' });
      });
    })
  );
});
