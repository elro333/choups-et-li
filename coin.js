// coin.js — l'onglet « Mon coin » : rien que pour soi.
//
// Les idées de cadeaux et de surprises pour l'autre.
// L'autre ne voit JAMAIS cette page : chacun a la sienne.
// (En mode essai, c'est donnees.js qui trie. Avec Supabase, ce sera
// la base elle-même qui refusera de montrer le coin de l'un à l'autre.)

const TYPES_COIN = {
  cadeau: { emoji: "🎁", nom: "Idée cadeau", pluriel: "Idées cadeaux" },
  surprise: { emoji: "✨", nom: "Surprise", pluriel: "Surprises" },
};

enregistrerVue("coin", {
  titre: "Mon coin",
  sousTitre: () => "Rien que pour toi",
  ajouter: () => modifierCoin(),
  afficher: afficherCoin,
});

async function afficherCoin(ecran) {
  const idees = (await Donnees.lister("coin")).sort((a, b) => (a.fait - b.fait) || (b.creeLe - a.creeLe));
  let html = `<div class="secret">🔒 <span>${surnom(autre())} ne voit jamais cette page. Tes idées restent secrètes.</span></div>`;

  for (const [type, t] of Object.entries(TYPES_COIN)) {
    const liste = idees.filter((i) => i.type === type);
    html += `<h2>${t.emoji} ${t.pluriel}${liste.length ? `<span class="compte">${liste.filter((i) => !i.fait).length}</span>` : ""}</h2>`;
    if (!liste.length) {
      html += `<div class="carte"><p class="muted" style="margin:0">Rien pour l'instant. Une idée ? Le + en haut.</p></div>`;
      continue;
    }
    html += `<div class="carte"><ul class="liste-coin">` + liste.map((i) => `
      <li class="${i.fait ? "fait" : ""}" data-coin="${i.id}">
        <button class="case ${i.fait ? "cochee" : ""}" data-cocher aria-label="${i.fait ? "Pas encore fait" : "C'est fait"}">${i.fait ? "✓" : ""}</button>
        <div class="infos"><div class="t">${echapper(i.texte)}</div></div>
      </li>`).join("") + `</ul></div>`;
  }
  ecran.innerHTML = html;

  ecran.querySelectorAll("[data-cocher]").forEach((b) => b.addEventListener("click", async () => {
    const i = idees.find((x) => x.id === b.closest("[data-coin]").dataset.coin);
    await Donnees.modifier("coin", i.id, { fait: !i.fait });
    if (!i.fait) petitMessage("Bien joué 🥰");
  }));
  ecran.querySelectorAll(".liste-coin .infos").forEach((el) => el.addEventListener("click", () =>
    modifierCoin(idees.find((x) => x.id === el.closest("[data-coin]").dataset.coin))));
}

function modifierCoin(existante) {
  const i = existante || { texte: "", type: "cadeau" };
  ouvrirFeuille({
    titre: existante ? "Modifier" : "Nouvelle idée",
    valider: existante ? "OK" : "Garder",
    html: `
      <div class="segment" id="choix-type">
        ${Object.entries(TYPES_COIN).map(([k, t]) => `<button type="button" data-type="${k}" class="${i.type === k ? "active" : ""}">${t.emoji} ${t.nom}</button>`).join("")}
      </div>
      <input type="hidden" name="type" value="${i.type}">
      <div class="groupe">
        <textarea name="texte" placeholder="Ce qui lui ferait plaisir…" style="min-height:90px">${echapper(i.texte)}</textarea>
      </div>
      <p class="aide">🔒 Rien que pour toi.</p>
      ${existante ? `<button type="button" class="btn-texte danger" id="btn-suppr-coin">Supprimer</button>` : ""}`,
    async surValider(f) {
      const texte = f.get("texte").trim();
      if (!texte) { petitMessage("Écris ton idée 💡"); return false; }
      const champs = { texte, type: f.get("type") };
      if (existante) await Donnees.modifier("coin", existante.id, champs);
      else await Donnees.ajouter("coin", { ...champs, proprio: moi(), fait: false });
    },
  });
  formFeuille.querySelectorAll("#choix-type button").forEach((b) => b.addEventListener("click", () => {
    formFeuille.querySelectorAll("#choix-type button").forEach((x) => x.classList.toggle("active", x === b));
    formFeuille.querySelector("[name=type]").value = b.dataset.type;
  }));
  $("#btn-suppr-coin")?.addEventListener("click", async () => {
    fermerFeuille();
    await Donnees.supprimer("coin", existante.id);
  });
}
