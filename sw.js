/**
 * sw.js — Service Worker de Costia (PWA para Obradores y Panaderías)
 *
 * Estrategia: Network-First con fallback a Cache para assets estáticos.
 * Exclusiones: No cachea llamadas al directorio /backend/ (APIs dinámicas y autenticación).
 */

const CACHE_NAME = 'costia-pwa-v3';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/paginas/dashboard.html',
  '/paginas/productos.html',
  '/paginas/insumos.html',
  '/paginas/crear-producto.html',
  '/paginas/ficha-tecnica.html',
  '/paginas/configuracion.html',
  '/paginas/login.html',
  '/paginas/registro.html',
  '/assets/css/base.css',
  '/assets/css/app.css',
  '/assets/css/productos.css',
  '/assets/css/insumos.css',
  '/assets/css/crear-producto.css',
  '/assets/css/auth.css',
  '/assets/css/presentacion.css',
  '/assets/js/models.js',
  '/assets/js/store.js',
  '/assets/js/productos.js',
  '/assets/js/insumos.js',
  '/assets/js/crear-producto.js',
  '/assets/js/login.js',
  '/assets/js/registro.js',
  '/assets/js/presentacion.js',
  '/assets/js/asesor-agente.js',
  '/assets/js/asesor/asesor-parser.js',
  '/assets/js/asesor/asesor-finanzas.js',
  '/assets/js/asesor/asesor-ui.js',
  '/assets/img/costia-icon-green.png',
  '/assets/img/costia-icon.png',
  '/assets/img/box.png',
  '/assets/img/chef-hat.png',
  '/assets/img/box-kpi.svg',
  '/assets/img/chef-kpi.svg',
  '/assets/img/gem.svg',
  '/assets/img/lightbulb.svg',
  '/assets/img/log-out.svg',
  '/assets/img/refresh-cw.png',
  '/assets/img/refresh.svg',
  '/assets/img/scale.svg',
  '/assets/img/search.svg',
  '/assets/img/trending-down.svg',
  '/assets/img/trending-up.svg',
  '/assets/img/zap.svg',
  '/assets/img/bell.svg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        ASSETS_TO_CACHE.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`[Service Worker] No se pudo cachear asset: ${url}`, err);
          })
        )
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Solo interceptar peticiones GET
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Ignorar protocolos no http/https (e.g. extensiones de navegador)
  if (!url.protocol.startsWith('http')) return;

  // REGLA FUNDAMENTAL: Ignorar llamadas dinámicas de backend y autenticación
  if (url.pathname.includes('/backend/')) return;

  // Estrategia Network-First con fallback a Cache
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Fallback a Cache si falla la red o estamos offline
        const cachedResponse = await caches.match(event.request, { ignoreSearch: true });
        if (cachedResponse) {
          return cachedResponse;
        }

        // Si es navegación HTML y no hay red ni match exacto, fallback al shell de la app
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return (await caches.match('/paginas/productos.html')) || (await caches.match('/index.html'));
        }
      })
  );
});
