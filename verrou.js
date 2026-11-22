// verrou.js — le code à l'ouverture de l'appli.
//
// À chaque ouverture (et quand on revient dans l'appli après plus d'une minute),
// un écran demande le code à 4 chiffres.
//
// Le code n'est PAS écrit dans ce fichier : le code de l'appli est public.
// Au tout premier lancement, chacun CHOISIT le code sur son téléphone ;
// l'appli n'en garde qu'une « empreinte » (un hachage SHA-256), jamais le code lui-même.
//
// C'est un verrou d'écran, comme celui d'une appli bancaire : il empêche
// quelqu'un qui prend le téléphone de lire. La vraie protection des données,
// ce seront vos comptes Supabase.

const Verrou = (() => {
  const CLE = "choupsli-code";
  const DELAI = 60 * 1000;    // on reverrouille après 1 minute hors de l'appli
  let saisie = "";
  let premierCode = null;     // pendant la création : le code tapé la 1re fois
  let mode = "ouvrir";        // "ouvrir", "creer" ou "confirmer"
  let quandOuvert = null;
  let partiA = null;
  let ecran = null;

  const lire = () => { try { return localStorage.getItem(CLE); } catch (e) { return null; } };
  const ecrire = (v) => { try { localStorage.setItem(CLE, v); } catch (e) {} };

  // L'empreinte du code : impossible de retrouver le code en la lisant
  async function empreinte(code) {
    const octets = new TextEncoder().encode("choups-et-li:" + code);
    const hache = await crypto.subtle.digest("SHA-256", octets);
    return [...new Uint8Array(hache)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function construire() {
    ecran = document.createElement("div");
    ecran.id = "verrou";
    ecran.className = "verrou";
    ecran.innerHTML = `
      <div class="fond-couleurs" aria-hidden="true"></div>
      <div class="etoiles" aria-hidden="true"></div>
      <div class="verrou-haut">
        <img src="icons/icon-180.png" alt="" class="verrou-icone">
        <p class="verrou-texte" id="verrou-texte"></p>
        <div class="verrou-points" id="verrou-points">${"<i></i>".repeat(4)}</div>
      </div>
      <div class="pave">
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button type="button" data-chiffre="${n}">${n}</button>`).join("")}
        <span></span>
        <button type="button" data-chiffre="0">0</button>
        <button type="button" class="effacer" data-effacer aria-label="Effacer">⌫</button>
      </div>
      <button type="button" class="verrou-oubli" id="verrou-oubli">Code oublié ?</button>`;
    document.body.append(ecran);
    ecran.querySelectorAll("[data-chiffre]").forEach((b) => b.addEventListener("click", () => taper(b.dataset.chiffre)));
    ecran.querySelector("[data-effacer]").addEventListener("click", effacer);
    ecran.querySelector("#verrou-oubli").addEventListener("click", () => {
      $("#verrou-texte").textContent = "Supprime l'appli de l'écran d'accueil puis réinstalle-la. En mode essai, ce qui est sur ce téléphone sera effacé.";
    });
    // Sur ordinateur : on peut taper au clavier
    document.addEventListener("keydown", (e) => {
      if (!ecran.classList.contains("visible")) return;
      if (/^[0-9]$/.test(e.key)) taper(e.key);
      if (e.key === "Backspace") effacer();
    });
  }

  function textes() {
    $("#verrou-texte").textContent = {
      ouvrir: "Entre votre code 💗",
      creer: "Choisis votre code à 4 chiffres",
      confirmer: "Tape-le encore une fois",
    }[mode];
    $("#verrou-oubli").hidden = mode !== "ouvrir";
  }

  function points() {
    ecran.querySelectorAll(".verrou-points i").forEach((p, i) => p.classList.toggle("plein", i < saisie.length));
  }

  function effacer() { saisie = saisie.slice(0, -1); points(); }

  async function taper(chiffre) {
    if (saisie.length >= 4) return;
    saisie += chiffre;
    points();
    if (saisie.length < 4) return;
    const code = saisie;
    await new Promise((r) => setTimeout(r, 120)); // le temps de voir le 4e point
    if (mode === "creer") {
      premierCode = code; mode = "confirmer"; saisie = ""; points(); textes();
    } else if (mode === "confirmer") {
      if (code === premierCode) { ecrire(await empreinte(code)); ouvrir(); }
      else { secouer(); mode = "creer"; premierCode = null; textes(); $("#verrou-texte").textContent = "Ce n'était pas le même, on recommence"; }
    } else {
      if ((await empreinte(code)) === lire()) ouvrir();
      else secouer();
    }
  }

  function secouer() {
    saisie = "";
    const p = $("#verrou-points");
    p.classList.remove("secoue"); void p.offsetWidth; p.classList.add("secoue");
    setTimeout(points, 350);
  }

  function ouvrir() {
    saisie = "";
    ecran.classList.remove("visible");
    document.documentElement.classList.remove("verrouille");
    const suite = quandOuvert; quandOuvert = null;
    suite?.();
  }

  function fermer(apres) {
    if (!ecran) construire();
    quandOuvert = apres || null;
    mode = lire() ? "ouvrir" : "creer";
    saisie = ""; premierCode = null;
    points(); textes();
    feuille.open && feuille.close();   // une feuille ouverte ne doit pas rester visible
    document.documentElement.classList.add("verrouille");
    ecran.classList.add("visible");
  }

  // On reverrouille quand on revient après plus d'une minute ailleurs
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) partiA = Date.now();
    else if (partiA && Date.now() - partiA > DELAI && !ecran?.classList.contains("visible")) fermer();
  });

  return { demarrer: (apres) => fermer(apres) };
})();
