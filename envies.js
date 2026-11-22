// envies.js — l'onglet « Envies » : ce qu'on aimerait faire ensemble.
//
// Chacun propose ; l'autre répond « oui, j'ai envie » ou « non merci ».
// Celui qui propose a forcément envie : son avis est « oui » d'office.
// Quand les deux disent oui : pluie de cœurs, l'envie passe dans « On veut ».
// Quand c'est fait : on note la date et un petit souvenir.
//
// Trois écrans (l'interrupteur en haut) :
//   À voir  = les idées de l'autre qui attendent ta réponse + les tiennes en attente ;
//   On veut = ce que vous voulez faire tous les deux ;
//   Faites  = vos souvenirs.

const CATEGORIES = {
  hiver: { emoji: "❄️", nom: "Hiver" },
  dehors: { emoji: "🌊", nom: "Dehors" },
  pluie: { emoji: "☔", nom: "Jour de pluie" },
  cocooning: { emoji: "🕯️", nom: "Cocooning" },
  jeux: { emoji: "🎲", nom: "Jeux et défis" },
  voyage: { emoji: "✈️", nom: "Voyage" },
};
const emojiCategorie = (c) => CATEGORIES[c]?.emoji || "💗";
const PRIX = ["", "💶", "💶💶", "💶💶💶"];

let ecranEnvies = "veut";   // "voir", "veut" ou "faites"
let filtreEnvies = "tout";  // une catégorie, ou "tout"

enregistrerVue("envies", {
  titre: "Envies",
  sousTitre: () => "À faire ensemble",
  ajouter: () => proposerEnvie(),
  afficher: afficherEnvies,
});

// Où en est une envie, vue par moi ?
function etatEnvie(e) {
  if (e.fait) return "faite";
  const a = e.avis;
  if (a.choups === "non" || a.li === "non") return "non";
  if (a[moi()] == null) return "a-repondre";
  if (a[autre()] == null) return "en-attente";
  return "commune";
}

async function afficherEnvies(ecran) {
  const toutes = await Donnees.lister("envies");
  const parEtat = (etat) => toutes.filter((e) => etatEnvie(e) === etat);
  const aRepondre = parEtat("a-repondre");
  const nbAVoir = aRepondre.length;

  // L'interrupteur À voir / On veut / Faites
  let html = `
    <div class="segment" id="segment-envies">
      <button data-ecran="voir" class="${ecranEnvies === "voir" ? "active" : ""}">À voir${nbAVoir ? `<span class="bulle">${nbAVoir}</span>` : ""}</button>
      <button data-ecran="veut" class="${ecranEnvies === "veut" ? "active" : ""}">On veut</button>
      <button data-ecran="faites" class="${ecranEnvies === "faites" ? "active" : ""}">Faites</button>
    </div>`;

  // Les puces de catégorie
  html += `<div class="filtres">` +
    [["tout", "Tout"], ...Object.entries(CATEGORIES).map(([k, c]) => [k, `${c.emoji} ${c.nom}`])]
      .map(([k, nom]) => `<button data-filtre="${k}" class="${filtreEnvies === k ? "active" : ""}">${nom}</button>`).join("") +
    `</div>`;

  const filtrer = (liste) => liste.filter((e) => filtreEnvies === "tout" || e.categorie === filtreEnvies)
    .sort((a, b) => b.creeLe - a.creeLe);

  if (ecranEnvies === "voir") {
    const enAttente = filtrer(parEtat("en-attente"));
    const non = filtrer(parEtat("non"));
    html += sectionEnvies(`Les idées de ${surnom(autre())}`, filtrer(aRepondre), "Tu as répondu à tout 🥰");
    if (enAttente.length) html += sectionEnvies(`Tes idées, en attente de ${surnom(autre())}`, enAttente);
    if (non.length) html += `<details class="replie"><summary>Pas pour cette fois (${non.length})</summary>${non.map(carteEnvie).join("")}</details>`;
  } else if (ecranEnvies === "veut") {
    html += sectionEnvies("", filtrer(parEtat("commune")), "Pas encore d'envie commune.<br>Propose une idée avec le + en haut ✨");
  } else {
    html += sectionEnvies("", filtrer(parEtat("faite")).sort((a, b) => (b.faitLe || "").localeCompare(a.faitLe || "")), "Vos souvenirs arriveront ici 🫶");
  }

  ecran.innerHTML = html;

  ecran.querySelectorAll("[data-ecran]").forEach((b) => b.addEventListener("click", () => { ecranEnvies = b.dataset.ecran; afficher(); }));
  ecran.querySelectorAll("[data-filtre]").forEach((b) => b.addEventListener("click", () => { filtreEnvies = b.dataset.filtre; afficher(); }));
  ecran.querySelectorAll("[data-avis]").forEach((b) => b.addEventListener("click", (ev) => {
    ev.stopPropagation();
    repondre(b.closest("[data-envie]").dataset.envie, b.dataset.avis, toutes);
  }));
  ecran.querySelectorAll("[data-faite]").forEach((b) => b.addEventListener("click", (ev) => {
    ev.stopPropagation();
    marquerFaite(toutes.find((e) => e.id === b.closest("[data-envie]").dataset.envie));
  }));
  ecran.querySelectorAll("[data-envie]").forEach((c) => c.addEventListener("click", () =>
    detailEnvie(toutes.find((e) => e.id === c.dataset.envie))));
}

function sectionEnvies(titre, liste, siVide = "") {
  const entete = titre ? `<h2>${titre}${liste.length ? `<span class="compte">${liste.length}</span>` : ""}</h2>` : "";
  if (!liste.length) return siVide ? `${entete}<div class="vide"><span class="grand-emoji">🌅</span>${siVide}</div>` : "";
  return entete + liste.map(carteEnvie).join("");
}

// Une carte d'envie
function carteEnvie(e) {
  const etat = etatEnvie(e);
  const badge = (qui) => {
    const a = e.avis[qui];
    const nom = surnom(qui);
    if (a === "oui") return `<span class="oui">${nom} 💚</span>`;
    if (a === "non") return `<span class="non">${nom}</span>`;
    return `<span>${nom} ⏳</span>`;
  };
  let bas = "";
  if (etat === "a-repondre") {
    bas = `<div class="boutons">
      <button class="btn-principal btn-petit" data-avis="oui">Oui, j'ai envie 💚</button>
      <button class="btn-secondaire btn-petit" data-avis="non">Non merci</button></div>`;
  } else if (etat === "commune") {
    bas = `<div class="boutons"><button class="btn-doux btn-petit" data-faite>C'est fait ✓</button></div>`;
  } else if (etat === "faite") {
    bas = `${e.souvenir ? `<div class="souvenir">${echapper(e.souvenir)}</div>` : ""}
      ${e.faitLe ? `<p class="muted" style="margin-top:8px">Fait le ${dateComplete(e.faitLe)}</p>` : ""}`;
  }
  return `
    <div class="carte envie" data-envie="${e.id}">
      <div class="haut">
        <span class="emoji">${emojiCategorie(e.categorie)}</span>
        <div style="flex:1;min-width:0">
          <div class="titre">${echapper(e.titre)}</div>
          ${e.detail ? `<div class="detail">${echapper(e.detail)}</div>` : ""}
          <div class="avis">${badge("choups")}${badge("li")}${e.prix ? `<span>${PRIX[e.prix]}</span>` : ""}</div>
        </div>
      </div>
      ${bas}
    </div>`;
}

// Répondre oui / non à l'idée de l'autre
async function repondre(id, reponse, toutes) {
  const e = toutes.find((x) => x.id === id);
  const avis = { ...e.avis, [moi()]: reponse };
  await Donnees.modifier("envies", id, { avis });
  if (reponse === "oui" && avis[autre()] === "oui") {
    pluieDeCoeurs();
    petitMessage("Vous en avez envie tous les deux 💞");
  } else if (reponse === "oui") {
    petitMessage("Noté 💚");
  } else {
    petitMessage("Pas pour cette fois, c'est noté");
  }
}

// Proposer une nouvelle envie (ou en modifier une)
function proposerEnvie(existante) {
  const e = existante || { titre: "", detail: "", categorie: "dehors", prix: 1 };
  const options = Object.entries(CATEGORIES).map(([k, c]) =>
    `<option value="${k}" ${e.categorie === k ? "selected" : ""}>${c.emoji} ${c.nom}</option>`).join("");
  ouvrirFeuille({
    titre: existante ? "Modifier l'envie" : "Nouvelle envie",
    valider: existante ? "OK" : "Proposer",
    html: `
      <div class="groupe">
        <input type="text" name="titre" placeholder="Pique-nique sur la plage" value="${echapper(e.titre)}" maxlength="80">
        <textarea name="detail" placeholder="Comment ça se passe ? (facultatif)" style="min-height:80px">${echapper(e.detail)}</textarea>
      </div>
      <div class="groupe">
        <label>Catégorie <select name="categorie">${options}</select></label>
        <label>Budget <select name="prix">
          <option value="1" ${e.prix == 1 ? "selected" : ""}>💶 Pas cher</option>
          <option value="2" ${e.prix == 2 ? "selected" : ""}>💶💶 Moyen</option>
          <option value="3" ${e.prix == 3 ? "selected" : ""}>💶💶💶 Occasion</option>
        </select></label>
      </div>
      ${existante ? "" : `<p class="aide">${surnom(autre())} pourra répondre « oui » ou « non ». Sans pression 💗</p>`}`,
    async surValider(d) {
      const titre = d.get("titre").trim();
      if (!titre) { petitMessage("Donne un petit nom à ton envie"); return false; }
      const champs = { titre, detail: d.get("detail").trim(), categorie: d.get("categorie"), prix: Number(d.get("prix")) };
      if (existante) {
        await Donnees.modifier("envies", existante.id, champs);
      } else {
        await Donnees.ajouter("envies", { ...champs, par: moi(), avis: { [moi()]: "oui", [autre()]: null }, fait: false });
        ecranEnvies = "voir";
        petitMessage(`Envoyée à ${Donnees.surnom(autre())} ✨`);
      }
    },
  });
}

// Marquer une envie comme faite, avec la date et un souvenir
function marquerFaite(e) {
  ouvrirFeuille({
    titre: "C'est fait !",
    valider: "Garder",
    html: `
      <p class="grand" style="margin:0;text-align:center">${emojiCategorie(e.categorie)} ${echapper(e.titre)}</p>
      <div class="groupe">
        <label>Le <input type="date" name="faitLe" value="${jourISO()}"></label>
      </div>
      <div class="groupe">
        <textarea name="souvenir" placeholder="Un petit souvenir de ce moment… (facultatif)"></textarea>
      </div>`,
    async surValider(d) {
      await Donnees.modifier("envies", e.id, { fait: true, faitLe: d.get("faitLe") || jourISO(), souvenir: d.get("souvenir").trim() });
      pluieDeCoeurs(14);
      petitMessage("Un souvenir de plus 🫶");
      ecranEnvies = "faites";
    },
  });
}

// Toucher une envie : la voir en grand, changer d'avis, modifier, supprimer
function detailEnvie(e) {
  const miennes = e.par === moi();
  ouvrirFeuille({
    titre: "Envie",
    html: `
      <div style="text-align:center">
        <div style="font-size:48px">${emojiCategorie(e.categorie)}</div>
        <p class="grand" style="margin:6px 0 2px">${echapper(e.titre)}</p>
        ${e.detail ? `<p class="muted">${echapper(e.detail)}</p>` : ""}
        <p class="muted" style="margin-top:8px">Proposée par ${surnom(e.par)} · ${CATEGORIES[e.categorie]?.nom || ""} ${e.prix ? "· " + PRIX[e.prix] : ""}</p>
      </div>
      ${e.fait && e.souvenir ? `<div class="souvenir">${echapper(e.souvenir)}</div>` : ""}
      ${!miennes && !e.fait ? `
        <div class="boutons">
          <button type="button" class="${e.avis[moi()] === "oui" ? "btn-principal" : "btn-secondaire"}" data-changer="oui">J'ai envie 💚</button>
          <button type="button" class="${e.avis[moi()] === "non" ? "btn-principal" : "btn-secondaire"}" data-changer="non">Non merci</button>
        </div>` : ""}
      ${e.fait ? `<button type="button" class="btn-secondaire" id="btn-pas-faite">Pas encore faite, en fait</button>` : ""}
      ${miennes ? `<button type="button" class="btn-secondaire" id="btn-modifier">Modifier</button>` : ""}
      ${miennes ? `<button type="button" class="btn-texte danger" id="btn-supprimer">Supprimer cette envie</button>` : ""}`,
  });
  formFeuille.querySelectorAll("[data-changer]").forEach((b) => b.addEventListener("click", async () => {
    fermerFeuille();
    await repondre(e.id, b.dataset.changer, [e]);
  }));
  $("#btn-modifier")?.addEventListener("click", () => { fermerFeuille(); setTimeout(() => proposerEnvie(e), 250); });
  $("#btn-pas-faite")?.addEventListener("click", async () => { fermerFeuille(); await Donnees.modifier("envies", e.id, { fait: false }); });
  $("#btn-supprimer")?.addEventListener("click", async () => {
    if (!confirm("Supprimer cette envie ?")) return;
    fermerFeuille();
    await Donnees.supprimer("envies", e.id);
    petitMessage("Supprimée");
  });
}
