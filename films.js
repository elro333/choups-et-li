// films.js — l'onglet « Films » : ce qu'on regarde ensemble.
//
// Deux parties (l'interrupteur en haut) :
// - Marvel : tout le MCU (marvel.js), dans l'ordre de sortie OU dans l'ordre de
//   l'histoire, avec « à voir / en cours / vu », le compte à rebours jusqu'à
//   Doomsday et combien il en reste ;
// - Nos films : les films qu'on veut voir ensemble (chacun en propose), et une note après.
//
// Ce que vous avez vu est rangé dans la base : table « marvel » { cle, statut }
// et table « films » { titre, par, statut, notes: {choups, li} }.

let partieFilms = "marvel";   // "marvel" ou "nos"
let ordreMarvel = "sortie";   // "sortie" ou "histoire"
let voirBonus = false;        // afficher les courts-métrages et séries annexes

const TYPES_MARVEL = { film: "Film", serie: "Série", special: "Épisode spécial", anim: "Série animée", court: "Court-métrage" };
const STATUTS = { "a-voir": "", "en-cours": "◐", vu: "✓" };

enregistrerVue("films", {
  titre: "Films",
  sousTitre: () => (partieFilms === "marvel" ? "Objectif Doomsday 🦸" : "À voir ensemble"),
  ajouter: () => proposerFilm(),
  afficher: afficherFilms,
});

async function afficherFilms(ecran) {
  let html = `
    <div class="segment" id="segment-films">
      <button data-partie="marvel" class="${partieFilms === "marvel" ? "active" : ""}">🦸 Marvel</button>
      <button data-partie="nos" class="${partieFilms === "nos" ? "active" : ""}">🎬 Nos films</button>
    </div>`;
  html += partieFilms === "marvel" ? await htmlMarvel() : await htmlNosFilms();
  ecran.innerHTML = html;

  ecran.querySelectorAll("[data-partie]").forEach((b) => b.addEventListener("click", () => { partieFilms = b.dataset.partie; afficher(); }));
  ecran.querySelectorAll("[data-ordre]").forEach((b) => b.addEventListener("click", () => { ordreMarvel = b.dataset.ordre; afficher(); }));
  ecran.querySelector("#voir-bonus")?.addEventListener("change", (e) => { voirBonus = e.target.checked; afficher(); });
  ecran.querySelectorAll("[data-marvel]").forEach((b) => b.addEventListener("click", () => changerStatutMarvel(b.dataset.marvel)));
  ecran.querySelectorAll("[data-film-vu]").forEach((b) => b.addEventListener("click", () => basculerFilm(b.dataset.filmVu)));
  ecran.querySelectorAll("[data-film]").forEach((el) => el.addEventListener("click", () => detailFilm(el.dataset.film)));
}

// ---------- Marvel ----------
async function statutsMarvel() {
  const lignes = await Donnees.lister("marvel");
  const parCle = {};
  lignes.forEach((l) => (parCle[l.cle] = l));
  return parCle;
}

async function htmlMarvel() {
  const statuts = await statutsMarvel();
  const statut = (cle) => statuts[cle]?.statut || "a-voir";
  const principaux = MARVEL.filter((m) => !m.bonus);
  const vus = principaux.filter((m) => statut(m.cle) === "vu").length;
  const reste = principaux.filter((m) => statut(m.cle) !== "vu" && m.cle !== "doomsday").length;
  const jours = joursJusqua(DATE_DOOMSDAY);
  const pourcent = Math.round((vus / principaux.length) * 100);

  // Le compte à rebours et la progression
  let html = `
    <div class="carte doomsday">
      <span class="etiquette">💥 Avengers : Doomsday</span>
      <p class="grand">${jours > 0 ? `Au cinéma ${dansXJours(jours)}` : jours === 0 ? "C'est aujourd'hui ! 🍿" : "Déjà sorti 🍿"}</p>
      <p class="muted">Le ${dateComplete(DATE_DOOMSDAY)} en France</p>
      <div class="barre"><span style="width:${pourcent}%"></span></div>
      <p class="muted"><b>${vus} / ${principaux.length}</b> vus${reste && jours > 0 ? ` · il en reste ${reste}, soit environ ${(Math.ceil((reste / jours) * 10) / 10).toLocaleString("fr-FR")} par jour` : ""}</p>
    </div>`;

  // L'ordre
  html += `
    <div class="filtres">
      <button data-ordre="sortie" class="${ordreMarvel === "sortie" ? "active" : ""}">📅 Ordre de sortie</button>
      <button data-ordre="histoire" class="${ordreMarvel === "histoire" ? "active" : ""}">⏳ Ordre de l'histoire</button>
    </div>
    <div class="groupe" style="margin-bottom:12px">
      <label>Afficher les bonus <input type="checkbox" class="interrupteur" id="voir-bonus" ${voirBonus ? "checked" : ""}></label>
    </div>
    <p class="aide" style="margin:-4px 6px 14px">${ordreMarvel === "histoire"
      ? "Dans l'ordre où l'histoire se passe (selon marvelwatchorder.com : Marvel ne publie pas de liste officielle complète)."
      : "Dans l'ordre où ils sont sortis : l'ordre conseillé pour une première fois."} Les bonus : courts-métrages et séries annexes, facultatifs.</p>`;

  // La liste
  let liste = MARVEL.filter((m) => voirBonus || !m.bonus);
  if (ordreMarvel === "histoire") liste = liste.slice().sort((a, b) => a.place - b.place);
  const prochain = liste.find((m) => statut(m.cle) !== "vu");

  let annee = "";
  html += `<div class="carte liste-films">`;
  for (const m of liste) {
    if (ordreMarvel === "sortie" && m.date.slice(0, 4) !== annee) {
      annee = m.date.slice(0, 4);
      html += `<div class="annee">${annee}</div>`;
    }
    html += ligneMarvel(m, statut(m.cle), m === prochain);
  }
  html += `</div>`;

  if (voirBonus) {
    html += `<h2>Séries Marvel d'avant Disney+</h2>
      <p class="aide" style="margin:-4px 6px 10px">Facultatives (ABC, Netflix…). Marvel a ajouté les séries Netflix à sa chronologie en 2024, sans leur donner de place précise.</p>
      <div class="carte liste-films">${MARVEL_TELE.map((m) => ligneMarvel(m, statut(m.cle), false)).join("")}</div>`;
  }
  return html;
}

function ligneMarvel(m, statut, prochain) {
  const annee = m.date.slice(0, 4);
  return `
    <div class="film ${statut} ${prochain ? "prochain" : ""} ${m.cle === "doomsday" ? "final" : ""}">
      <button class="case ${statut === "vu" ? "cochee" : ""} ${statut === "en-cours" ? "en-cours" : ""}" data-marvel="${m.cle}"
        aria-label="${statut === "vu" ? "Vu" : statut === "en-cours" ? "En cours" : "À voir"}">${STATUTS[statut]}</button>
      <div class="infos">
        <div class="t">${echapper(m.titre)}</div>
        <div class="m">${TYPES_MARVEL[m.type]} · ${annee}${m.bonus ? " · bonus" : ""}${prochain ? ` · <b>à regarder ensuite</b>` : ""}${m.cle === "doomsday" ? " · au cinéma 🍿" : ""}</div>
      </div>
    </div>`;
}

// Toucher la case : à voir → vu (films) ; à voir → en cours → vu (séries)
async function changerStatutMarvel(cle) {
  const m = [...MARVEL, ...MARVEL_TELE].find((x) => x.cle === cle);
  const statuts = await statutsMarvel();
  const ligne = statuts[cle];
  const actuel = ligne?.statut || "a-voir";
  const suite = m.type === "film" || m.type === "special" || m.type === "court"
    ? { "a-voir": "vu", "en-cours": "vu", vu: "a-voir" }
    : { "a-voir": "en-cours", "en-cours": "vu", vu: "a-voir" };
  const nouveau = suite[actuel];
  if (ligne) await Donnees.modifier("marvel", ligne.id, { statut: nouveau });
  else await Donnees.ajouter("marvel", { cle, statut: nouveau });
  if (nouveau === "vu") petitMessage(cle === "doomsday" ? "Doomsday vu ! 💥🍿" : `${m.titre.split(" · ")[0]} : vu ✓`);
  if (nouveau === "vu" && cle === "doomsday") pluieDeCoeurs(30);
}

// ---------- Nos films ----------
async function htmlNosFilms() {
  const films = (await Donnees.lister("films")).sort((a, b) => b.creeLe - a.creeLe);
  const aVoir = films.filter((f) => f.statut !== "vu");
  const vus = films.filter((f) => f.statut === "vu");
  if (!films.length) return `<div class="vide"><span class="grand-emoji">🎬</span>Ajoutez les films que vous voulez voir ensemble avec le + en haut.</div>`;
  const ligne = (f) => {
    const notes = f.notes || {};
    const etoiles = (qui) => (notes[qui] ? `${surnom(qui)} ${"★".repeat(notes[qui])}` : "");
    const lesNotes = [etoiles("choups"), etoiles("li")].filter(Boolean).join(" · ");
    return `
      <div class="film ${f.statut === "vu" ? "vu" : ""}">
        <button class="case ${f.statut === "vu" ? "cochee" : ""}" data-film-vu="${f.id}" aria-label="${f.statut === "vu" ? "Vu" : "À voir"}">${f.statut === "vu" ? "✓" : ""}</button>
        <div class="infos" data-film="${f.id}">
          <div class="t">${echapper(f.titre)}</div>
          <div class="m">Proposé par ${surnom(f.par)}${lesNotes ? " · " + lesNotes : f.statut === "vu" ? " · touche pour noter" : ""}</div>
        </div>
      </div>`;
  };
  let html = `<h2>À voir<span class="compte">${aVoir.length}</span></h2>`;
  html += aVoir.length ? `<div class="carte liste-films">${aVoir.map(ligne).join("")}</div>` : `<div class="vide">Tout est vu ! Une nouvelle idée ? 🍿</div>`;
  if (vus.length) html += `<h2>Vus ensemble<span class="compte">${vus.length}</span></h2><div class="carte liste-films">${vus.map(ligne).join("")}</div>`;
  return html;
}

function proposerFilm() {
  partieFilms = "nos";
  ouvrirFeuille({
    titre: "Un film à voir",
    valider: "Ajouter",
    html: `
      <div class="groupe"><input type="text" name="titre" placeholder="Le titre du film ou de la série" maxlength="100"></div>
      <p class="aide">Il s'ajoute à « Nos films », pour vous deux.</p>`,
    async surValider(d) {
      const titre = d.get("titre").trim();
      if (!titre) { petitMessage("Écris le titre 🎬"); return false; }
      await Donnees.ajouter("films", { titre, par: moi(), statut: "a-voir", notes: {} });
      petitMessage("Ajouté 🍿");
    },
  });
  afficher();
}

async function basculerFilm(id) {
  const f = (await Donnees.lister("films")).find((x) => x.id === id);
  const vu = f.statut !== "vu";
  await Donnees.modifier("films", id, { statut: vu ? "vu" : "a-voir" });
  if (vu) setTimeout(() => detailFilm(id), 300); // proposer de noter
}

// Toucher un film : le noter (après l'avoir vu) ou le supprimer
async function detailFilm(id) {
  const f = (await Donnees.lister("films")).find((x) => x.id === id);
  if (!f) return;
  const maNote = f.notes?.[moi()] || 0;
  ouvrirFeuille({
    titre: "🎬",
    html: `
      <p class="grand" style="text-align:center;margin:0">${echapper(f.titre)}</p>
      <p class="muted" style="text-align:center">Proposé par ${surnom(f.par)}</p>
      ${f.statut === "vu" ? `
        <div style="text-align:center">
          <p class="surtitre" style="margin-bottom:6px">Ta note</p>
          <div class="etoiles">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-note="${n}" class="${n <= maNote ? "pleine" : ""}">★</button>`).join("")}</div>
          ${f.notes?.[autre()] ? `<p class="muted">${surnom(autre())} : ${"★".repeat(f.notes[autre()])}</p>` : ""}
        </div>` : ""}
      <button type="button" class="btn-texte danger" id="btn-suppr-film">Retirer ce film</button>`,
  });
  formFeuille.querySelectorAll("[data-note]").forEach((b) => b.addEventListener("click", async () => {
    await Donnees.modifier("films", id, { notes: { ...(f.notes || {}), [moi()]: Number(b.dataset.note) } });
    fermerFeuille();
    petitMessage("Noté ⭐");
  }));
  $("#btn-suppr-film").addEventListener("click", async () => {
    fermerFeuille();
    await Donnees.supprimer("films", id);
  });
}
