/**
 * sw.js — Service Worker para PWA
 * Versão com cache atualizado automaticamente
 */
const CACHE_VERSION = 'v11';
const CACHE_NAME = 'fceux-task-' + CACHE_VERSION;
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './js/db.js',
  './js/tasks.js',
  './js/ui.js',
  './js/keyboard.js',
  './js/boot.js',
  './js/notifications.js',
  './js/projects.js',
  './js/views.js',
  './js/pomodoro.js',
  './js/notepad.js',
  './js/commands.js',
  './js/multiselect.js',
  './js/weather.js',
  './js/templates.js',
  './js/quickadd.js',
  './js/workdays.js',
  './js/myday.js',
  './js/gamification.js',
  './js/habits.js',
  './js/config.js',
  './js/eisenhower.js',
  './js/matrix.js',
  './js/dashbar.js',
  './js/focusmode.js',
  './js/printview.js',
  './js/mascot.js',
  './js/themes.js',
  './js/countdown.js',
  './js/tooltip.js',
  './js/favicon.js',
  './js/challenges.js',
  './js/particles.js',
  './js/pet.js',
  './js/natural.js',
  './js/reminders.js',
  './js/autoscale.js',
  './js/sounds.js',
  './js/badges.js',
  './js/onboarding.js',
  './js/backup.js',
  './js/pixelai.js',
  './js/bossmode.js',
  './js/dayplan.js',
  './js/weekly.js',
  './js/outlook.js',
  './js/sessioncomplete.js',
  './js/pixelpatterns.js',
];

// Install — cacheia tudo
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch((err) => {
        console.log('[SW] Cache parcial:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate — deleta caches antigos
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Fetch — NETWORK FIRST (sempre busca atualizado, cache é fallback)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Atualiza o cache com a versão nova
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, clone);
        });
        return response;
      })
      .catch(() => {
        // Se offline, usa o cache
        return caches.match(e.request).then((cached) => {
          return cached || new Response('Offline', { status: 503 });
        });
      })
  );
});