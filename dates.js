// dates.js — l'onglet « Nos dates » : les moments importants, en frise.
//
// Premier rendez-vous, premier bisou, premières vacances…
// Pas de compteur « ensemble depuis X jours » (choix fait exprès) :
// juste une jolie frise, et un petit rappel sur l'accueil quand
// un anniversaire approche.

const EMOJIS_DATES = ["💗", "💋", "☕", "🌹", "🏝️", "✈️", "🏠", "💍", "🎂", "🌅", "🍝", "⭐"];

enregistrerVue("dates", {
  titre: "Nos dates",
  sousTitre: () => "Nos moments à nous",
  ajouter: () => modifierDate(),
  afficher: afficherDates,
});

// Pour chaque date : quand tombe son prochain anniversaire, et dans combien de jours
function prochainesDates(dates) {
  const auj = jourISO();
  const annee = Number(auj.slice(0, 4));
  return dates.map((d) => {
    let prochaine = annee + d.date.slice(4);
    if (prochaine < auj) prochaine = annee + 1 + d.date.slice(4);
    // Un 29 février une année normale : on le fête le 28
    const an = Number(prochaine.slice(0, 4));
    const bissextile = (an % 4 === 0 && an % 100 !== 0) || an % 400 === 0;
    if (prochaine.endsWith("-02-29") && !bissextile) prochaine = an + "-02-28";
    const ans = Number(prochaine.slice(0, 4)) - Number(d.date.slice(0, 4));
    return { ...d, prochaine, dans: joursJusqua(prochaine), ans };
  }).filter((d) => d.ans > 0 || d.dans === 0).sort((a, b) => a.dans - b.dans);
}

async function afficherDates(ecran) {
  const dates = (await Donnees.lister("dates")).sort((a, b) => a.date.localeCompare(b.date));
  if (!dates.length) {
    ecran.innerHTML = `<div class="vide"><span class="grand-emoji">📅</span>Ajoutez votre première date avec le + en haut :<br>premier rendez-vous, premier bisou…</div>`;
    return;
  }
  const prochaine = prochainesDates(dates)[0];
  let html = "";
  if (prochaine) {
    html += `
      <div class="carte">
        <span class="etiquette">Prochain anniversaire</span>
        <p class="grand">${echapper(prochaine.emoji || "💗")} ${echapper(prochaine.titre)}</p>
        <p class="muted">${prochaine.dans === 0 ? "C'est aujourd'hui 🥳" : dansXJours(prochaine.dans)} · ${prochaine.ans} an${prochaine.ans > 1 ? "s" : ""}</p>
      </div>`;
  }
  html += `<div class="frise">` + dates.map((d) => `
    <div class="carte" data-date="${d.id}">
      <div class="date-ligne">
        <span class="emoji">${echapper(d.emoji || "💗")}</span>
        <div style="flex:1;min-width:0">
          <div class="titre">${echapper(d.titre)}</div>
          <div class="muted">${dateComplete(d.date)}</div>
          ${d.note ? `<div class="muted" style="margin-top:4px">${echapper(d.note)}</div>` : ""}
        </div>
      </div>
    </div>`).join("") + `</div>`;
  ecran.innerHTML = html;
  ecran.querySelectorAll("[data-date]").forEach((c) => c.addEventListener("click", () =>
    modifierDate(dates.find((d) => d.id === c.dataset.date))));
}

// Ajouter ou modifier une date
function modifierDate(existante) {
  const d = existante || { titre: "", date: jourISO(), emoji: "💗", note: "" };
  const emojis = EMOJIS_DATES.map((e) =>
    `<label><input type="radio" name="emoji" value="${e}" ${d.emoji === e ? "checked" : ""}><span>${e}</span></label>`).join("");
  ouvrirFeuille({
    titre: existante ? "Modifier" : "Nouvelle date",
    valider: existante ? "OK" : "Ajouter",
    html: `
      <div class="groupe">
        <input type="text" name="titre" placeholder="Notre premier rendez-vous" value="${echapper(d.titre)}" maxlength="80">
        <label>Le <input type="date" name="date" value="${d.date}" max="${jourISO()}"></label>
      </div>
      <div class="choix-emoji">${emojis}</div>
      <div class="groupe">
        <textarea name="note" placeholder="Un petit mot sur ce jour-là (facultatif)" style="min-height:80px">${echapper(d.note)}</textarea>
      </div>
      ${existante ? `<button type="button" class="btn-texte danger" id="btn-suppr-date">Supprimer cette date</button>` : ""}`,
    async surValider(f) {
      const titre = f.get("titre").trim();
      const date = f.get("date");
      if (!titre || !date) { petitMessage("Il manque le nom ou la date"); return false; }
      const champs = { titre, date, emoji: f.get("emoji") || "💗", note: f.get("note").trim() };
      if (existante) await Donnees.modifier("dates", existante.id, champs);
      else { await Donnees.ajouter("dates", champs); pluieDeCoeurs(10); }
    },
  });
  $("#btn-suppr-date")?.addEventListener("click", async () => {
    if (!confirm("Supprimer cette date ?")) return;
    fermerFeuille();
    await Donnees.supprimer("dates", existante.id);
  });
}
