// nous.js — l'onglet « Nous », l'accueil.
//
// Rien qui oblige, rien qui compte les jours : juste ce qui fait plaisir.
// - le dernier petit mot de l'autre (ou une lettre qui attend d'être ouverte) ;
// - les envies de l'autre qui attendent ta réponse ;
// - une date à fêter bientôt ;
// - « On fait quoi ? » : le dé qui tire une envie au hasard ;
// - un souvenir qui remonte ;
// - le bouton bisou.

enregistrerVue("nous", {
  titre: () => `Coucou ${surnom(moi())} <span class="coeur-titre">♥</span>`,
  sousTitre: () => {
    const t = dateLongue(jourISO());
    return t.charAt(0).toUpperCase() + t.slice(1);
  },
  ajouter: () => ecrireMot(),
  afficher: afficherNous,
});

async function afficherNous(ecran) {
  const [mots, envies, dates] = await Promise.all([Donnees.lister("mots"), Donnees.lister("envies"), Donnees.lister("dates")]);
  const aujourdhui = jourISO();
  let html = "";

  // 1. Une lettre prête à être ouverte passe avant tout
  const lettrePrete = mots.find((m) => m.de === autre() && m.ouvrirLe && m.ouvrirLe <= aujourdhui && !m.ouvert);
  if (lettrePrete) {
    html += `
      <button class="carte enveloppe prete" data-lettre="${lettrePrete.id}">
        <span class="icone">💌</span>
        <span><span class="etiquette">Une lettre de ${surnom(autre())}</span>
        <span class="grand" style="display:block">Elle t'attend…</span>
        <span class="muted" style="display:block">Écrite ${ilYa(lettrePrete.creeLe)}. Touche pour l'ouvrir.</span></span>
      </button>`;
  }

  // 2. Le dernier petit mot reçu
  const recus = mots
    .filter((m) => m.de === autre() && (!m.ouvrirLe || m.ouvert))
    .sort((a, b) => b.creeLe - a.creeLe);
  if (recus[0]) {
    html += `
      <button class="carte" data-aller="mots">
        <span class="etiquette">${surnom(autre())} t'a écrit</span>
        <span class="grand" style="display:block">${echapper(recus[0].texte)}</span>
        <span class="muted" style="display:block">${ilYa(recus[0].creeLe)}</span>
        <span class="fleche">›</span>
      </button>`;
  }

  // 3. Les envies qui attendent ta réponse
  const aRepondre = envies.filter((e) => !e.fait && e.avis[moi()] == null);
  if (aRepondre.length) {
    const s = aRepondre.length > 1;
    html += `
      <button class="carte" data-aller="envies">
        <span class="etiquette">✨ Envies</span>
        <span class="grand" style="display:block">${aRepondre.length} idée${s ? "s" : ""} de ${surnom(autre())} ${s ? "t'attendent" : "t'attend"}</span>
        <span class="muted" style="display:block">${echapper(aRepondre[0].titre)}${s ? "…" : ""}</span>
        <span class="fleche">›</span>
      </button>`;
  }

  // 4. Une date à fêter dans les 45 prochains jours
  const bientot = prochainesDates(dates).find((d) => d.dans <= 45);
  if (bientot) {
    html += `
      <button class="carte" data-aller="dates">
        <span class="etiquette">📅 Bientôt</span>
        <span class="grand" style="display:block">${echapper(bientot.emoji || "💗")} ${echapper(bientot.titre)}</span>
        <span class="muted" style="display:block">${bientot.dans === 0 ? "C'est aujourd'hui 🥳" : dansXJours(bientot.dans)} · le ${dateJourMois(bientot.prochaine)}</span>
      </button>`;
  }

  // 5. Le dé : une envie commune tirée au hasard
  const communes = envies.filter((e) => !e.fait && e.avis.choups === "oui" && e.avis.li === "oui");
  if (communes.length) {
    html += `
      <div class="carte de" id="carte-de">
        <span class="etiquette">🎲 On fait quoi ?</span>
        <div id="resultat-de" style="margin:10px 0 4px"><span class="face">🎲</span><p class="muted">Vous avez ${communes.length} envie${communes.length > 1 ? "s" : ""} en commun.</p></div>
        <button class="btn-doux btn-petit" id="btn-de">Lancer le dé</button>
      </div>`;
  }

  // 6. Un souvenir qui remonte (une envie faite, avec son souvenir)
  const souvenirs = envies.filter((e) => e.fait && e.souvenir);
  if (souvenirs.length) {
    const s = souvenirs[Math.floor(Math.random() * souvenirs.length)];
    html += `
      <div class="carte">
        <span class="etiquette">🫶 Souvenir</span>
        <p class="grand" style="font-size:18px">${echapper(s.titre)}</p>
        <div class="souvenir">${echapper(s.souvenir)}</div>
        ${s.faitLe ? `<p class="muted" style="margin-top:8px">${dateComplete(s.faitLe)}</p>` : ""}
      </div>`;
  }

  // 7. Le bouton bisou : un mot en un geste, sans rien écrire
  html += `
    <div class="boutons" style="margin-top:4px">
      <button class="btn-principal" id="btn-bisou">Envoyer un bisou 😘</button>
    </div>`;

  ecran.innerHTML = html;

  ecran.querySelector("[data-lettre]")?.addEventListener("click", (e) => ouvrirLettre(e.currentTarget.dataset.lettre));
  $("#btn-bisou").addEventListener("click", () => envoyerMot("😘"));
  $("#btn-de")?.addEventListener("click", () => {
    const tiree = communes[Math.floor(Math.random() * communes.length)];
    const carte = $("#carte-de");
    carte.classList.remove("roule");
    void carte.offsetWidth; // relance l'animation
    carte.classList.add("roule");
    $("#resultat-de").innerHTML = `
      <span class="face">${emojiCategorie(tiree.categorie)}</span>
      <p class="grand">${echapper(tiree.titre)}</p>
      ${tiree.detail ? `<p class="muted">${echapper(tiree.detail)}</p>` : ""}`;
    $("#btn-de").textContent = "Relancer";
  });
}
