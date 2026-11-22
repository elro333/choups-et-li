// cycle.js — le cycle, partagé en douceur.
//
// Une option que chacune active pour elle-même (Réglages ›  Partager mon cycle).
// Elle appuie sur « Mes règles ont commencé », l'appli calcule le reste :
// le jour du cycle, la phase (sur 4), la date probable des prochaines règles.
// L'autre voit une petite carte douce sur son accueil : jamais une demande,
// juste un signal, avec une idée de ce qui peut faire du bien.
//
// Les calculs sont des estimations (un cycle « moyen ») : ce n'est pas un
// outil médical. Les vraies dates restent dans la base, jamais dans le code.

const PHASES = {
  regles: {
    emoji: "🌸", nom: "Règles",
    pourMoi: "Fatigue, douleurs, besoin de calme : c'est normal. Prends soin de toi.",
    pourLautre: (n) => `${n} a ses règles. Un peu de douceur fait du bien : un câlin, une bouillotte, du chocolat, un plaid…`,
  },
  folliculaire: {
    emoji: "🌱", nom: "Phase folliculaire",
    pourMoi: "L'énergie remonte, l'envie de bouger et de voir du monde aussi.",
    pourLautre: (n) => `L'énergie remonte pour ${n} : un bon moment pour une sortie ou une envie de la liste.`,
  },
  ovulation: {
    emoji: "☀️", nom: "Ovulation",
    pourMoi: "En général, la période où l'on se sent le plus en forme et sociable.",
    pourLautre: (n) => `${n} est sans doute en pleine forme : parfait pour un moment à deux.`,
  },
  luteale: {
    emoji: "🍂", nom: "Phase lutéale",
    pourMoi: "Plus de sensibilité, de fatigue ou d'irritabilité possibles, surtout vers la fin. Sois douce avec toi.",
    pourLautre: (n) => `${n} peut être plus sensible ou fatiguée en ce moment : patience, câlins et cocooning.`,
  },
};

// Où en est le cycle d'une personne ? (null si inconnu ou pas activé)
function etatCycle(qui, lignes) {
  const reglages = Donnees.profil(qui).cycle;
  if (!reglages?.actif) return null;
  const debuts = lignes.filter((l) => l.proprio === qui).map((l) => l.debut).sort();
  const dernier = debuts[debuts.length - 1];
  if (!dernier) return { reglages, inconnu: true };
  const duree = reglages.duree || 28;
  const regles = reglages.regles || 5;
  const jour = -joursJusqua(dernier) + 1;               // jour 1 = premier jour des règles
  if (jour < 1 || jour > duree + 15) return { reglages, inconnu: true, dernier };
  const ovulation = duree - 14;                         // l'ovulation tombe ~14 jours avant les règles suivantes
  let phase;
  if (jour <= regles) phase = "regles";
  else if (jour < ovulation - 1) phase = "folliculaire";
  else if (jour <= ovulation + 1) phase = "ovulation";
  else phase = "luteale";
  const prochaines = jourISO(new Date(versDate(dernier).getTime() + duree * 86400000));
  return { reglages, jour, phase, dernier, prochaines, dansProchaines: joursJusqua(prochaines), debuts };
}

// La carte de l'accueil : pour moi, ou pour l'autre
function carteCycle(lignes) {
  let html = "";
  const mien = etatCycle(moi(), lignes);
  const sien = etatCycle(autre(), lignes);

  if (mien) {
    if (mien.inconnu) {
      html += `
        <div class="carte cycle">
          <span class="etiquette">🌸 Ton cycle</span>
          <p class="muted">Indique le premier jour de tes dernières règles pour que l'appli calcule ta phase.</p>
          <div class="boutons"><button class="btn-doux btn-petit" data-regles>Mes règles ont commencé</button></div>
        </div>`;
    } else {
      const p = PHASES[mien.phase];
      html += `
        <button class="carte cycle phase-${mien.phase}" data-detail-cycle>
          <span class="etiquette">${p.emoji} Ton cycle · jour ${mien.jour}</span>
          <span class="grand" style="display:block">${p.nom}</span>
          <span class="muted" style="display:block">${p.pourMoi}</span>
          ${mien.phase !== "regles" ? `<span class="muted" style="display:block;margin-top:6px">Prochaines règles ${mien.dansProchaines <= 0 ? "attendues maintenant" : "vers le " + dateJourMois(mien.prochaines)}</span>` : ""}
          <span class="fleche">›</span>
        </button>`;
    }
  }

  if (sien && !sien.inconnu) {
    const p = PHASES[sien.phase];
    const n = surnom(autre());
    let texte = p.pourLautre(n);
    if (sien.phase === "regles") texte = `${n} est au jour ${sien.jour} de ses règles. ` + texte.replace(`${n} a ses règles. `, "");
    else if (sien.dansProchaines <= 2) texte = `Les règles de ${n} devraient arriver ${sien.dansProchaines <= 0 ? "maintenant" : dansXJours(sien.dansProchaines)}. Un peu de douceur sera bienvenue 💗`;
    html += `
      <div class="carte cycle phase-${sien.phase}">
        <span class="etiquette">${p.emoji} ${n} · ${p.nom.toLowerCase()}</span>
        <p class="texte-cycle">${texte}</p>
      </div>`;
  }
  return html;
}

function brancherCycle(ecran, lignes) {
  ecran.querySelectorAll("[data-regles]").forEach((b) => b.addEventListener("click", () => noterRegles()));
  ecran.querySelector("[data-detail-cycle]")?.addEventListener("click", () => detailCycle(lignes));
}

// « Mes règles ont commencé » (aujourd'hui, ou un autre jour)
function noterRegles() {
  ouvrirFeuille({
    titre: "🌸 Mes règles",
    valider: "Noter",
    html: `
      <div class="groupe">
        <label>Premier jour <input type="date" name="debut" value="${jourISO()}" max="${jourISO()}"></label>
      </div>
      <p class="aide">${surnom(autre())} verra juste que tu es dans cette phase, avec une petite idée pour être là. Rien d'autre.</p>`,
    async surValider(d) {
      const debut = d.get("debut");
      if (!debut) return false;
      const deja = (await Donnees.lister("cycle")).find((l) => l.proprio === moi() && l.debut === debut);
      if (!deja) await Donnees.ajouter("cycle", { proprio: moi(), debut });
      petitMessage("Noté 🌸 Prends soin de toi");
    },
  });
}

// Le détail : les 4 phases, la phase actuelle, l'historique
function detailCycle(lignes) {
  const c = etatCycle(moi(), lignes);
  const mesDebuts = lignes.filter((l) => l.proprio === moi()).sort((a, b) => b.debut.localeCompare(a.debut));
  ouvrirFeuille({
    titre: "Mon cycle",
    html: `
      <button type="button" class="btn-principal" data-regles>Mes règles ont commencé</button>
      <div class="phases">
        ${Object.entries(PHASES).map(([k, p]) => `
          <div class="phase ${c?.phase === k ? "actuelle" : ""}">
            <span class="emoji">${p.emoji}</span>
            <div><b>${p.nom}</b>${c?.phase === k ? ` <span class="pastille-essai">maintenant · jour ${c.jour}</span>` : ""}<p class="muted">${p.pourMoi}</p></div>
          </div>`).join("")}
      </div>
      <p class="aide" style="margin:0 6px">Estimation sur un cycle de ${c?.reglages.duree || 28} jours (à régler dans … › Réglages). Ce n'est pas un outil médical.</p>
      ${mesDebuts.length ? `
        <div>
          <p class="surtitre" style="margin:0 6px 8px">Derniers débuts de règles</p>
          <div class="groupe">${mesDebuts.slice(0, 6).map((l) => `
            <div class="ligne"><span>${dateComplete(l.debut)}</span><button type="button" class="btn-texte danger" data-suppr-cycle="${l.id}">Retirer</button></div>`).join("")}
          </div>
        </div>` : ""}`,
  });
  formFeuille.querySelector("[data-regles]").addEventListener("click", () => { fermerFeuille(); setTimeout(noterRegles, 250); });
  formFeuille.querySelectorAll("[data-suppr-cycle]").forEach((b) => b.addEventListener("click", async () => {
    await Donnees.supprimer("cycle", b.dataset.supprCycle);
    b.closest(".ligne").remove();
  }));
}
