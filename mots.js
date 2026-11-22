// mots.js — l'onglet « Petits mots ».
//
// Deux façons d'écrire :
// - en direct : l'autre le voit tout de suite ;
// - une lettre « à ouvrir le… » : elle reste fermée jusqu'à la date choisie
//   (son anniversaire, un jour difficile, une mission…).
// Plus les mots rapides : un geste, et c'est envoyé. Pas de pression,
// ce n'est pas une messagerie : pas de « vu », pas de « en train d'écrire ».

const MOTS_RAPIDES = ["Je pense à toi 💭", "Tu me manques 🥺", "Bisou 😘", "Je t'aime 💗", "Fier·e de toi ✨", "Merci 🥰"];

enregistrerVue("mots", {
  titre: "Petits mots",
  sousTitre: () => `Entre ${Donnees.surnom("choups")} et ${Donnees.surnom("li")}`,
  ajouter: () => ecrireMot(),
  afficher: afficherMots,
});

// Une lettre est-elle encore fermée pour MOI ?
const lettreFermee = (m) => m.ouvrirLe && m.de !== moi() && (m.ouvrirLe > jourISO() || !m.ouvert);

async function afficherMots(ecran) {
  const mots = (await Donnees.lister("mots")).sort((a, b) => b.creeLe - a.creeLe);
  const aujourdhui = jourISO();

  let html = `<div class="mots-rapides">${MOTS_RAPIDES.map((t) => `<button data-rapide="${echapper(t)}">${t}</button>`).join("")}</div>`;

  // Les lettres de l'autre encore fermées (prêtes ou pas)
  const pourMoi = mots.filter(lettreFermee).sort((a, b) => a.ouvrirLe.localeCompare(b.ouvrirLe));
  // Les lettres que j'ai écrites et qui ne sont pas encore arrivées
  const deMoi = mots.filter((m) => m.ouvrirLe && m.de === moi() && m.ouvrirLe > aujourdhui).sort((a, b) => a.ouvrirLe.localeCompare(b.ouvrirLe));

  if (pourMoi.length || deMoi.length) {
    html += `<h2>Lettres à ouvrir</h2>`;
    html += pourMoi.map((m) => {
      const prete = m.ouvrirLe <= aujourdhui;
      return `
        <button class="carte enveloppe ${prete ? "prete" : ""}" ${prete ? `data-lettre="${m.id}"` : `data-fermee="${m.ouvrirLe}"`}>
          <span class="icone">${prete ? "💌" : "✉️"}</span>
          <span><span class="etiquette">De ${surnom(m.de)}</span>
          <span class="grand" style="display:block;font-size:18px">${prete ? "Tu peux l'ouvrir !" : "S'ouvrira " + dansXJours(joursJusqua(m.ouvrirLe))}</span>
          <span class="muted" style="display:block">${prete ? "Touche l'enveloppe" : "Le " + dateComplete(m.ouvrirLe) + " 🔒"}</span></span>
        </button>`;
    }).join("");
    html += deMoi.map((m) => `
      <button class="carte enveloppe" data-ma-lettre="${m.id}">
        <span class="icone">📮</span>
        <span><span class="etiquette">Pour ${surnom(autre())}</span>
        <span class="grand" style="display:block;font-size:18px">Arrive ${dansXJours(joursJusqua(m.ouvrirLe))}</span>
        <span class="muted" style="display:block">Le ${dateComplete(m.ouvrirLe)} · touche pour la relire</span></span>
      </button>`).join("");
  }

  // Le fil : les mots en direct et les lettres déjà ouvertes (ou arrivées pour l'autre)
  const fil = mots.filter((m) => !m.ouvrirLe || (m.de === moi() ? m.ouvrirLe <= aujourdhui : m.ouvert));
  html += `<h2>Nos mots</h2>`;
  if (!fil.length) {
    html += `<div class="vide"><span class="grand-emoji">💌</span>Écris le premier petit mot avec le + en haut.</div>`;
  } else {
    html += `<div class="fil">` + fil.map((m) => `
      <div class="bulle-mot ${m.de === moi() ? "de-moi" : "de-lautre"} ${m.ouvrirLe ? "lettre" : ""}" data-mot="${m.id}">${echapper(m.texte)}<span class="quand">${m.ouvrirLe ? "💌 lettre · " : ""}${m.de === moi() ? "" : surnom(m.de) + " · "}${ilYa(m.creeLe)}</span></div>`).join("") + `</div>`;
  }

  ecran.innerHTML = html;

  ecran.querySelectorAll("[data-rapide]").forEach((b) => b.addEventListener("click", () => envoyerMot(b.dataset.rapide)));
  ecran.querySelectorAll("[data-lettre]").forEach((b) => b.addEventListener("click", () => ouvrirLettre(b.dataset.lettre)));
  ecran.querySelectorAll("[data-fermee]").forEach((b) => b.addEventListener("click", () => petitMessage("Patience… 🤫 Elle s'ouvrira le " + dateJourMois(b.dataset.fermee))));
  ecran.querySelectorAll("[data-ma-lettre]").forEach((b) => b.addEventListener("click", () => {
    const m = mots.find((x) => x.id === b.dataset.maLettre);
    voirMaLettre(m);
  }));
  ecran.querySelectorAll(".bulle-mot.de-moi").forEach((b) => b.addEventListener("click", () => {
    const m = mots.find((x) => x.id === b.dataset.mot);
    if (m) proposerSuppression(m);
  }));
}

// Envoyer un mot tout de suite (mots rapides, bouton bisou)
async function envoyerMot(texte) {
  await Donnees.ajouter("mots", { de: moi(), texte, ouvrirLe: null });
  pluieDeCoeurs(12);
  petitMessage(`Envoyé à ${Donnees.surnom(autre())} 💌`);
}

// Écrire un mot (en direct ou en lettre à ouvrir plus tard)
function ecrireMot() {
  const demain = new Date(); demain.setDate(demain.getDate() + 1);
  ouvrirFeuille({
    titre: "Petit mot",
    valider: "Envoyer",
    html: `
      <div class="groupe">
        <textarea name="texte" placeholder="Pour ${surnom(autre())}…" maxlength="2000"></textarea>
      </div>
      <div class="groupe">
        <label>À ouvrir plus tard 💌 <input type="checkbox" class="interrupteur" name="plusTard" id="plus-tard"></label>
        <label id="ligne-date" hidden>Le <input type="date" name="ouvrirLe" min="${jourISO(demain)}" value="${jourISO(demain)}"></label>
      </div>
      <p class="aide" id="aide-lettre">${surnom(autre())} le verra tout de suite.</p>`,
    async surValider(d) {
      const texte = d.get("texte").trim();
      if (!texte) { petitMessage("Écris quelques mots 💗"); return false; }
      const plusTard = d.get("plusTard") === "on";
      const ouvrirLe = plusTard ? d.get("ouvrirLe") : null;
      if (plusTard && (!ouvrirLe || ouvrirLe <= jourISO())) { petitMessage("Choisis une date à venir"); return false; }
      await Donnees.ajouter("mots", { de: moi(), texte, ouvrirLe, ouvert: false });
      pluieDeCoeurs(plusTard ? 8 : 14);
      petitMessage(plusTard ? `Lettre scellée jusqu'au ${dateJourMois(ouvrirLe)} 💌` : `Envoyé à ${Donnees.surnom(autre())} 💌`);
    },
  });
  $("#plus-tard").addEventListener("change", (e) => {
    $("#ligne-date").hidden = !e.target.checked;
    $("#aide-lettre").textContent = e.target.checked
      ? `Elle restera fermée jusqu'à la date choisie. ${Donnees.surnom(autre())} verra juste une enveloppe.`
      : `${Donnees.surnom(autre())} le verra tout de suite.`;
  });
}

// Ouvrir une lettre arrivée : la belle surprise
async function ouvrirLettre(id) {
  const m = (await Donnees.lister("mots")).find((x) => x.id === id);
  if (!m) return;
  await Donnees.modifier("mots", id, { ouvert: true });
  ouvrirFeuille({
    titre: "💌",
    html: `
      <div class="lettre-ouverte">${echapper(m.texte)}<span class="signature">${surnom(m.de)} ♥</span></div>
      <p class="muted" style="text-align:center">Écrite ${ilYa(m.creeLe)}, pour le ${dateComplete(m.ouvrirLe)}</p>`,
  });
  setTimeout(() => pluieDeCoeurs(26), 250);
}

// Relire une lettre que j'ai écrite et qui n'est pas encore arrivée
function voirMaLettre(m) {
  ouvrirFeuille({
    titre: "Ta lettre",
    html: `
      <div class="lettre-ouverte" style="animation:none">${echapper(m.texte)}<span class="signature">${surnom(m.de)} ♥</span></div>
      <p class="muted" style="text-align:center">${surnom(autre())} pourra l'ouvrir le ${dateComplete(m.ouvrirLe)}.</p>
      <button type="button" class="btn-texte danger" id="btn-suppr-lettre">Supprimer cette lettre</button>`,
  });
  $("#btn-suppr-lettre").addEventListener("click", async () => {
    if (!confirm("Supprimer cette lettre ?")) return;
    fermerFeuille();
    await Donnees.supprimer("mots", m.id);
  });
}

// Toucher un de mes mots : je peux le retirer
function proposerSuppression(m) {
  ouvrirFeuille({
    titre: "Ton mot",
    html: `
      <div class="lettre-ouverte" style="animation:none">${echapper(m.texte)}</div>
      <button type="button" class="btn-texte danger" id="btn-suppr-mot">Retirer ce mot</button>`,
  });
  $("#btn-suppr-mot").addEventListener("click", async () => {
    fermerFeuille();
    await Donnees.supprimer("mots", m.id);
  });
}
