// app.js — le CHEF D'ORCHESTRE.
//
// 1. Petits outils (dates en français, protéger le texte…)
// 2. Les onglets : chaque fichier d'onglet s'inscrit avec enregistrerVue()
// 3. La barre d'onglets qu'on peut faire glisser (comme iOS 26)
// 4. La feuille qui monte du bas
// 5. Les petits plaisirs : pluie de cœurs, petit message
// 6. Les réglages (mode essai)
// 7. Démarrage et mode hors-ligne

// ---------- 1. Petits outils ----------
const $ = (s, racine = document) => racine.querySelector(s);

// Protéger le texte qu'on affiche : si quelqu'un écrit "<b>", on l'affiche
// tel quel au lieu de le laisser devenir du code. Toujours l'utiliser
// pour du texte tapé par quelqu'un.
function echapper(t) {
  return String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// La date d'aujourd'hui en "AAAA-MM-JJ" (à l'heure française du téléphone)
function jourISO(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
// "2026-12-25" → un objet Date à midi (midi : pas de surprise avec les fuseaux horaires)
const versDate = (iso) => new Date(iso + "T12:00:00");

const fmtLong = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" });
const fmtJourMois = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" });
const fmtComplet = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const fmtHeure = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });

const dateLongue = (iso) => fmtLong.format(versDate(iso));
const dateJourMois = (iso) => fmtJourMois.format(versDate(iso));
const dateComplete = (iso) => fmtComplet.format(versDate(iso));

// "à l'instant", "il y a 5 min", "il y a 3 h", "hier à 18:30", "le 12 novembre"
function ilYa(ts) {
  const ecart = Date.now() - ts;
  const min = Math.round(ecart / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  if (min < 6 * 60) return `il y a ${Math.round(min / 60)} h`;
  const d = new Date(ts);
  if (jourISO(d) === jourISO()) return `aujourd'hui à ${fmtHeure.format(d)}`;
  const hier = new Date(); hier.setDate(hier.getDate() - 1);
  if (jourISO(d) === jourISO(hier)) return `hier à ${fmtHeure.format(d)}`;
  return "le " + fmtJourMois.format(d);
}

// Nombre de jours entre aujourd'hui et une date (négatif si c'est passé)
function joursJusqua(iso) {
  return Math.round((versDate(iso) - versDate(jourISO())) / 86400000);
}
const dansXJours = (n) => (n === 0 ? "aujourd'hui" : n === 1 ? "demain" : `dans ${n} jours`);

// Raccourcis vers la mémoire
const moi = () => Donnees.moi();
const autre = () => Donnees.autre();
const surnom = (qui) => echapper(Donnees.surnom(qui));

// ---------- 2. Les onglets ----------
// Chaque fichier d'onglet appelle enregistrerVue("envies", { titre, sousTitre, afficher, ajouter }).
const VUES = {};
function enregistrerVue(nom, config) { VUES[nom] = config; }

let vueActive = "nous";
const barreOnglets = $(".onglets");
const boutonsOnglets = [...barreOnglets.querySelectorAll("button")];
const pilule = $("#pilule");

function allerA(vue) {
  if (!VUES[vue]) return;
  const change = vue !== vueActive;
  vueActive = vue;
  boutonsOnglets.forEach((b) => b.classList.toggle("active", b.dataset.vue === vue));
  document.querySelectorAll(".vue").forEach((v) => v.classList.toggle("active", v.id === "vue-" + vue));
  if (change) window.scrollTo(0, 0);
  placerPilule();
  afficher();
}

// Redessiner l'onglet visible (appelé aussi à chaque changement de données)
async function afficher() {
  const config = VUES[vueActive];
  const titre = typeof config.titre === "function" ? config.titre() : config.titre;
  $("#titre").innerHTML = titre;
  $("#titre-petit").innerHTML = titre;
  $("#sous-titre").textContent = config.sousTitre ? config.sousTitre() : "";
  $("#btn-ajouter").hidden = !config.ajouter;
  await config.afficher($("#vue-" + vueActive));
}

$("#btn-ajouter").addEventListener("click", () => VUES[vueActive].ajouter?.());

// Les liens internes : <button data-aller="envies"> mène à l'onglet Envies
document.addEventListener("click", (e) => {
  const lien = e.target.closest("[data-aller]");
  if (lien) allerA(lien.dataset.aller);
});

// ---------- 3. Glisser le doigt sur la barre, comme sur iOS 26 ----------
// La pilule suit le doigt, grossit un peu, et se pose sur l'onglet
// le plus proche quand on lâche.
let glisse = null;

function ongletSous(x) {
  return boutonsOnglets.reduce((meilleur, b) => {
    const r = b.getBoundingClientRect();
    const d = Math.abs(r.left + r.width / 2 - x);
    return d < meilleur.d ? { b, d } : meilleur;
  }, { b: boutonsOnglets[0], d: Infinity }).b;
}
function suivreDoigt(x) {
  const nav = barreOnglets.getBoundingClientRect();
  const largeur = pilule.offsetWidth;
  const pos = Math.max(4, Math.min(x - nav.left - largeur / 2, nav.width - largeur - 4));
  pilule.style.transform = `translateX(${pos}px) scale(1.12)`;
  const sous = ongletSous(x);
  boutonsOnglets.forEach((b) => b.classList.toggle("survol", b === sous));
}
barreOnglets.addEventListener("pointerdown", (e) => {
  glisse = true;
  barreOnglets.setPointerCapture(e.pointerId);
  barreOnglets.classList.add("glisse");
  suivreDoigt(e.clientX);
});
barreOnglets.addEventListener("pointermove", (e) => { if (glisse) suivreDoigt(e.clientX); });
function lacher(e) {
  if (!glisse) return;
  glisse = null;
  barreOnglets.classList.remove("glisse");
  boutonsOnglets.forEach((b) => b.classList.remove("survol"));
  allerA(ongletSous(e.clientX).dataset.vue);
  placerPilule();
}
barreOnglets.addEventListener("pointerup", lacher);
barreOnglets.addEventListener("pointercancel", lacher);
// Au clavier, les onglets restent des boutons normaux
boutonsOnglets.forEach((b) => b.addEventListener("click", (e) => { if (e.detail === 0) allerA(b.dataset.vue); }));

function placerPilule() {
  const actif = $(".onglets button.active");
  if (actif) pilule.style.transform = `translateX(${actif.offsetLeft}px)`;
}
window.addEventListener("resize", placerPilule);

// ---------- 4. La feuille qui monte du bas ----------
// ouvrirFeuille({ titre, html, valider: "Envoyer", surValider(donnees, form) })
// - html : le contenu (champs, texte…)
// - surValider : ce qui se passe quand on appuie sur le bouton en haut à droite.
//   Si elle renvoie false, la feuille reste ouverte (ex. : champ vide).
const feuille = $("#feuille");
const formFeuille = $("#feuille-form");
let quandValider = null;

function ouvrirFeuille({ titre, html, valider, surValider }) {
  formFeuille.innerHTML = `
    <div class="poignee"></div>
    <div class="entete-feuille">
      <button type="button" class="btn-texte" data-fermer>${valider ? "Annuler" : "Fermer"}</button>
      <strong>${titre}</strong>
      ${valider ? `<button type="submit" class="btn-texte fort">${valider}</button>` : "<span></span>"}
    </div>
    <div class="contenu-feuille">${html}</div>`;
  quandValider = surValider || null;
  feuille.showModal();
  // Mettre le curseur dans le premier champ texte (sauf s'il est déjà rempli)
  const champ = formFeuille.querySelector("textarea, input[type=text]");
  if (champ && !champ.value) setTimeout(() => champ.focus(), 350);
}
const fermerFeuille = () => feuille.close();

formFeuille.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!quandValider) return fermerFeuille();
  const garder = (await quandValider(new FormData(formFeuille), formFeuille)) === false;
  if (!garder) fermerFeuille();
});
formFeuille.addEventListener("click", (e) => { if (e.target.closest("[data-fermer]")) fermerFeuille(); });
// Toucher le fond sombre ferme la feuille
feuille.addEventListener("click", (e) => { if (e.target === feuille) fermerFeuille(); });

// ---------- 5. Les petits plaisirs ----------
// Une pluie de cœurs qui s'envolent du bas de l'écran
function pluieDeCoeurs(nombre = 22) {
  // Si une feuille est ouverte, les cœurs s'envolent DANS la feuille (sinon ils passeraient derrière)
  const zone = feuille.open ? feuille : $("#coeurs");
  const coeurs = ["💗", "💕", "💖", "❤️", "💞", "🩷"];
  for (let i = 0; i < nombre; i++) {
    const c = document.createElement("span");
    c.textContent = coeurs[i % coeurs.length];
    c.style.left = Math.random() * 95 + "vw";
    c.style.fontSize = 18 + Math.random() * 26 + "px";
    c.style.animationDelay = Math.random() * 0.7 + "s";
    c.style.setProperty("--derive", Math.random() * 120 - 60 + "px");
    c.style.setProperty("--tourne", Math.random() * 60 - 30 + "deg");
    zone.append(c);
    setTimeout(() => c.remove(), 3500);
  }
}

// Un petit message qui apparaît en haut puis s'en va
function petitMessage(texte) {
  const t = $("#toast");
  t.hidden = true;
  t.textContent = texte;
  void t.offsetWidth; // relance l'animation
  t.hidden = false;
  clearTimeout(petitMessage.minuteur);
  petitMessage.minuteur = setTimeout(() => (t.hidden = true), 2300);
}

// ---------- 6. Réglages (mode essai) ----------
$("#btn-reglages").addEventListener("click", () => {
  const options = Donnees.personnes().map((p) =>
    `<button type="button" data-qui="${p}" class="${p === moi() ? "active" : ""}">${surnom(p)}</button>`).join("");
  const cycle = Donnees.profil(moi()).cycle || { actif: false, duree: 28, regles: 5 };
  ouvrirFeuille({
    titre: "Réglages",
    valider: "OK",
    html: `
      <p class="muted"><span class="pastille-essai">Mode essai</span> Tout reste sur cet appareil, rien n'est envoyé. Les exemples sont inventés.</p>
      <div>
        <p class="surtitre" style="margin:0 6px 8px">Je suis…</p>
        <div class="segment" id="choix-moi">${options}</div>
        <p class="aide" style="margin-top:0">Pour tester les deux côtés de l'appli. Plus tard, chacun sera connecté avec son compte.</p>
      </div>
      <div class="groupe">
        <label>Son surnom à elle <input type="text" name="surnom-choups" value="${surnom("choups")}" style="text-align:right;width:55%;padding:0"></label>
        <label>Son surnom à lui <input type="text" name="surnom-li" value="${surnom("li")}" style="text-align:right;width:55%;padding:0"></label>
      </div>
      <div>
        <p class="surtitre" style="margin:0 6px 8px">🌸 Mon cycle</p>
        <div class="groupe">
          <label>Partager mon cycle <input type="checkbox" class="interrupteur" name="cycle-actif" ${cycle.actif ? "checked" : ""}></label>
          <label>Durée du cycle <select name="cycle-duree">${[...Array(15)].map((_, i) => 21 + i).map((n) => `<option value="${n}" ${n == (cycle.duree || 28) ? "selected" : ""}>${n} jours</option>`).join("")}</select></label>
          <label>Durée des règles <select name="cycle-regles">${[3, 4, 5, 6, 7, 8].map((n) => `<option value="${n}" ${n == (cycle.regles || 5) ? "selected" : ""}>${n} jours</option>`).join("")}</select></label>
        </div>
        <p class="aide" style="margin-top:6px">Activé : ${surnom(autre())} voit ta phase sur son accueil, avec une idée pour être là. Désactivé : rien n'est montré.</p>
      </div>
      <button type="button" class="btn-secondaire" id="btn-remettre">Remettre les exemples</button>`,
    surValider(d) {
      Donnees.changerSurnom("choups", d.get("surnom-choups"));
      Donnees.changerSurnom("li", d.get("surnom-li"));
      Donnees.modifierProfil(moi(), { cycle: {
        actif: d.get("cycle-actif") === "on",
        duree: Number(d.get("cycle-duree")),
        regles: Number(d.get("cycle-regles")),
      } });
    },
  });
  formFeuille.querySelectorAll("#choix-moi button").forEach((b) =>
    b.addEventListener("click", () => {
      Donnees.changerMoi(b.dataset.qui);
      formFeuille.querySelectorAll("#choix-moi button").forEach((x) => x.classList.toggle("active", x === b));
      petitMessage(`Tu es maintenant ${Donnees.surnom(b.dataset.qui)}`);
    })
  );
  $("#btn-remettre").addEventListener("click", () => {
    Donnees.remettreExemples();
    fermerFeuille();
    petitMessage("Exemples remis ✨");
  });
});

// ---------- 7. Démarrage ----------
// La barre du haut devient du verre dès qu'on fait défiler
const barreHaut = $("#barre-haut");
window.addEventListener("scroll", () => barreHaut.classList.toggle("defile", window.scrollY > 40), { passive: true });

// Pas de zoom à deux doigts (Safari ignore parfois l'interdiction du HTML)
["gesturestart", "gesturechange", "gestureend"].forEach((ev) =>
  document.addEventListener(ev, (e) => e.preventDefault(), { passive: false })
);

// Quand les données changent, on redessine l'écran
Donnees.surChangement(afficher);

// Tous les fichiers d'onglets sont chargés : on démarre sur « Nous »
window.addEventListener("DOMContentLoaded", () => {
  boutonsOnglets[0].classList.add("active");
  afficher();
  requestAnimationFrame(placerPilule);
});

// Mode hors-ligne : le "service worker" garde une copie de l'appli sur l'iPhone
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
