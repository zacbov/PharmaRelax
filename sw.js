// Service Worker — met en cache tous les fichiers nécessaires pour un
// fonctionnement 100% hors-ligne après la première visite.
// Attention : incrémente CACHE_NAME à chaque mise à jour de l'app pour
// forcer le rechargement du cache (sinon le Quest gardera l'ancienne version).
const CACHE_NAME = 'clairiere-v3';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './assets/env/mossy_forest_4k.exr',
  './assets/models/fraxinelle.ksplat',
  './assets/audio/foret-ambiance.mp3',
  './assets/audio/foret-ruisseau.mp3',
  // Dépendances Three.js + GaussianSplats3D (mises en cache depuis le CDN)
  'https://unpkg.com/three@0.160.0/build/three.module.js',
  'https://unpkg.com/three@0.160.0/examples/jsm/loaders/EXRLoader.js',
  'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js',
  'https://unpkg.com/three@0.160.0/examples/jsm/webxr/VRButton.js',
  'https://unpkg.com/three@0.160.0/examples/jsm/webxr/ARButton.js',
  'https://unpkg.com/@mkkellogg/gaussian-splats-3d@0.4.6/build/gaussian-splats-3d.module.js',
  // Mode nuit : chargés depuis leurs CDN respectifs, mis en cache dynamiquement
  // au premier passage en mode nuit (voir la logique de fetch plus bas).
  // Ajoute ici tes futurs .glb (abeille, oiseau, libellules, papillons) :
  // './assets/models/abeille.glb',
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

// Stratégie : cache d'abord (offline-first), avec repli réseau si absent du cache
// (utile pour les requêtes Xeno-canto, qui elles nécessitent une connexion).
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Met en cache dynamiquement : same-origin, chants Xeno-canto, et assets
        // du mode nuit (skybox Poly Haven, sons BigSoundBank) une fois téléchargés.
        const url = event.request.url;
        const isSameOrigin = url.startsWith(self.location.origin);
        const isCacheableThirdParty = /xeno-canto\.org.*\.(mp3|wav|ogg)/i.test(url)
          || url.includes('dl.polyhaven.org')
          || url.includes('bigsoundbank.com/UPLOAD');
        if (event.request.method === 'GET' && response.ok && (isSameOrigin || isCacheableThirdParty)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Hors-ligne et pas en cache (ex: chant Xeno-canto jamais téléchargé) :
        // on laisse l'app gérer l'absence gracieusement (voir log() dans index.html)
      });
    })
  );
});
