// sw.js — le "service worker" : il garde une copie de l'appli
// pour qu'elle s'ouvre même sans réseau.
// À chaque nouvelle version mise en ligne, on change le numéro ci-dessous
// pour que l'iPhone télécharge les nouveaux fichiers.
const VERSION = "choupsli-v8";
const SUPABASE_JS = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/dist/umd/supabase.js";
const FICHIERS = ["./", "index.html", "style.css", SUPABASE_JS, "config.js", "idees.js", "donnees.js", "app.js", "verrou.js", "connexion.js", "notifications.js",
  "humeur.js", "cycle.js", "nous.js", "envies.js", "mots.js", "marvel.js", "films.js", "dates.js", "coin.js",
  "manifest.json", "icons/icon-180.png", "icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FICHIERS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((cles) => Promise.all(cles.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Une notification arrive (envoyée par le programme « notifier » de Supabase)
self.addEventListener("push", (e) => {
  let m = { titre: "Choups & Li", corps: "" };
  try { m = { ...m, ...e.data.json() }; } catch (err) { /* message vide */ }
  e.waitUntil(self.registration.showNotification(m.titre, {
    body: m.corps,
    icon: "icons/icon-180.png",
    badge: "icons/icon-180.png",
  }));
});

// On touche la notification : on ouvre l'appli (ou on la ramène devant)
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((fenetres) =>
      fenetres.length ? fenetres[0].focus() : self.clients.openWindow("./"))
  );
});

// Réseau d'abord (pour avoir la dernière version), copie locale si pas de réseau.
// On ne garde JAMAIS de copie de ce qui vient de la base (vos données) :
// seulement les fichiers de l'appli.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin && e.request.url !== SUPABASE_JS) return;
  e.respondWith(
    fetch(e.request)
      .then((rep) => {
        const copie = rep.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copie));
        return rep;
      })
      .catch(() => caches.match(e.request))
  );
});
