// humeur.js — l'humeur du jour.
//
// Chacun peut toucher un émoji pour dire comment il va aujourd'hui,
// et ajouter un mot s'il veut. L'autre le voit sur son accueil.
// Rien d'obligatoire : si on ne remplit pas, il ne se passe rien.

const HUMEURS = ["😄", "🙂", "😐", "😔", "😢", "😤", "😴", "🥰"];

// La carte « humeur » de l'accueil (appelée par nous.js)
function carteHumeur(humeurs) {
  const aujourdhui = jourISO();
  const la = (qui) => humeurs.find((h) => h.qui === qui && h.jour === aujourdhui);
  const mienne = la(moi());
  const sienne = la(autre());
  return `
    <div class="carte humeur">
      <span class="etiquette">☀️ Ton humeur du jour</span>
      <div class="rangee-humeurs">
        ${HUMEURS.map((e) => `<button data-humeur="${e}" class="${mienne?.emoji === e ? "choisie" : ""}" aria-label="Humeur ${e}">${e}</button>`).join("")}
      </div>
      ${mienne ? `<button class="btn-texte petit" id="btn-mot-humeur">${mienne.mot ? "« " + echapper(mienne.mot) + " » · modifier" : "+ Ajouter un mot"}</button>` : ""}
      <div class="humeur-autre">
        ${sienne
          ? `<span class="grosse">${sienne.emoji}</span><span><b>${surnom(autre())}</b>${sienne.mot ? " · " + echapper(sienne.mot) : ""}</span>`
          : `<span class="muted">${surnom(autre())} n'a pas encore partagé son humeur.</span>`}
      </div>
    </div>`;
}

// Brancher les boutons de la carte (après l'avoir affichée)
function brancherHumeur(ecran, humeurs) {
  const aujourdhui = jourISO();
  const mienne = humeurs.find((h) => h.qui === moi() && h.jour === aujourdhui);
  ecran.querySelectorAll("[data-humeur]").forEach((b) => b.addEventListener("click", async () => {
    const emoji = b.dataset.humeur;
    if (mienne) await Donnees.modifier("humeurs", mienne.id, { emoji });
    else await Donnees.ajouter("humeurs", { qui: moi(), jour: aujourdhui, emoji, mot: "" });
    petitMessage(`Humeur partagée ${emoji}`);
  }));
  ecran.querySelector("#btn-mot-humeur")?.addEventListener("click", () => {
    ouvrirFeuille({
      titre: `${mienne.emoji} Un mot ?`,
      valider: "OK",
      html: `
        <div class="groupe"><input type="text" name="mot" maxlength="60" placeholder="Fatiguée, journée de fou, trop contente…" value="${echapper(mienne.mot)}"></div>
        <p class="aide">${surnom(autre())} le verra à côté de ton humeur.</p>`,
      async surValider(d) {
        await Donnees.modifier("humeurs", mienne.id, { mot: d.get("mot").trim() });
      },
    });
  });
}
