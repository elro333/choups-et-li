// notifications.js — recevoir une notif quand l'autre écrit, même appli fermée.
//
// Sur iPhone, ça marche seulement :
// - si l'appli est installée sur l'écran d'accueil (pas dans Safari) ;
// - après avoir appuyé UNE fois sur « Activer » (l'iPhone l'exige) puis « Autoriser ».
// Ensuite, l'adresse de ce téléphone est rangée dans la base, et le programme
// « notifier » (dans Supabase) peut lui envoyer les notifs.

const Notifs = (() => {
  const installee = () => navigator.standalone === true || matchMedia("(display-mode: standalone)").matches;
  const possible = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

  // "active", "a-activer", "refusee", "installer" (pas sur l'écran d'accueil) ou "impossible"
  function etat() {
    if (!possible()) return installee() ? "impossible" : "installer";
    if (Notification.permission === "granted") return "active";
    if (Notification.permission === "denied") return "refusee";
    return "a-activer";
  }

  // La clé publique, dans le format attendu par le navigateur
  function cleEnOctets(b64) {
    const pad = "=".repeat((4 - (b64.length % 4)) % 4);
    const brut = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(brut, (c) => c.charCodeAt(0));
  }

  async function activer() {
    if (!possible()) { petitMessage("Installe d'abord l'appli sur l'écran d'accueil 📲"); return false; }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") { petitMessage("Notifications refusées"); return false; }
    const reg = await navigator.serviceWorker.ready;
    let abo = await reg.pushManager.getSubscription();
    if (!abo) abo = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: cleEnOctets(VAPID_PUBLIQUE) });
    const ok = await Donnees.enregistrerAbonnement(abo.toJSON());
    if (ok) { petitMessage("Notifications activées 🔔"); pluieDeCoeurs(10); }
    return ok;
  }

  // À chaque ouverture : si c'est déjà autorisé, on (ré)enregistre l'adresse,
  // car l'iPhone la change parfois.
  async function rafraichir() {
    if (etat() !== "active") return;
    try {
      const reg = await navigator.serviceWorker.ready;
      let abo = await reg.pushManager.getSubscription();
      if (!abo) abo = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: cleEnOctets(VAPID_PUBLIQUE) });
      await Donnees.enregistrerAbonnement(abo.toJSON());
    } catch (e) { console.error(e); }
  }

  // La petite carte de l'accueil, tant que ce n'est pas activé
  function carte() {
    const e = etat();
    if (e === "active" || e === "impossible") return "";
    const texte = {
      "a-activer": `Pour savoir tout de suite quand ${surnom(autre())} t'écrit, même appli fermée.`,
      refusee: "Tu les as refusées : Réglages de l'iPhone › Notifications › Choups & Li pour les autoriser.",
      installer: "Installe l'appli sur l'écran d'accueil (Partager › Sur l'écran d'accueil) pour recevoir les notifications.",
    }[e];
    return `
      <div class="carte">
        <span class="etiquette">🔔 Notifications</span>
        <p class="muted" style="margin-top:6px">${texte}</p>
        ${e === "a-activer" ? `<div class="boutons"><button class="btn-doux btn-petit" data-activer-notifs>Activer les notifications</button></div>` : ""}
      </div>`;
  }

  function brancher(ecran) {
    ecran.querySelectorAll("[data-activer-notifs]").forEach((b) => b.addEventListener("click", async () => {
      await activer();
      afficher();
    }));
  }

  return { etat, activer, rafraichir, carte, brancher };
})();
