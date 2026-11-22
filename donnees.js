// donnees.js — la MÉMOIRE de l'appli.
//
// Tout ce que l'appli lit ou écrit passe par ici : les envies, les petits
// mots, les dates, le coin perso. Les onglets ne savent pas OÙ c'est rangé,
// ils demandent juste à « Donnees ».
//
// Pour l'instant : MODE ESSAI. Tout est rangé dans ce téléphone (localStorage),
// avec de faux exemples, et on peut jouer le rôle de l'un OU de l'autre
// pour tester les deux côtés.
//
// Plus tard : on remplacera l'intérieur de ce fichier par Supabase (la base
// partagée, protégée par vos comptes). Les autres fichiers ne changeront pas :
// c'est tout l'intérêt de tout faire passer par ici.
//
// Les quatre « tables » (comme des onglets de tableur) :
//   envies : { id, titre, detail, categorie, prix, par, avis: {choups, li}, fait, faitLe, souvenir, creeLe }
//   mots   : { id, de, texte, ouvrirLe (date ou null = tout de suite), ouvert, creeLe }
//   dates  : { id, titre, date, emoji, note, creeLe }
//   coin   : { id, proprio, texte, type ("cadeau" ou "surprise"), fait, creeLe }
//   humeurs: { id, qui, jour ("AAAA-MM-JJ"), emoji, mot, creeLe }
//   cycle  : { id, proprio, debut ("AAAA-MM-JJ" = 1er jour des règles), creeLe }
//   marvel : { id, cle (voir marvel.js), statut ("a-voir", "en-cours", "vu") }
//   films  : { id, titre, par, statut ("a-voir" ou "vu"), notes: {choups, li}, creeLe }
// Et pour chaque personne, un « profil » : { surnom, cycle: { actif, duree, regles } }

const Donnees = (() => {
  const CLE = "choupsli-essai-v2"; // v2 : nouvelle liste d'envies de départ
  const PERSONNES = ["choups", "li"]; // deux identifiants techniques, pas de vrais prénoms
  let etat = charger();
  const ecouteurs = [];

  // Lire la mémoire du téléphone (ou démarrer avec les exemples)
  function charger() {
    try {
      const brut = localStorage.getItem(CLE);
      if (brut) return completer(JSON.parse(brut));
    } catch (e) { /* mémoire illisible ou bloquée : on repart des exemples */ }
    return exemplesDeDepart(); // défini dans demo.js
  }

  // Une mémoire enregistrée par une version plus ancienne de l'appli :
  // on ajoute ce qui manque (les nouvelles tables) sans rien effacer.
  function completer(e) {
    for (const table of ["envies", "mots", "dates", "coin", "humeurs", "cycle", "marvel", "films"]) e[table] ||= [];
    for (const qui of PERSONNES) e.profils[qui] ||= { surnom: qui };
    return e;
  }

  function sauver() {
    try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch (e) { /* tant pis : ça marche quand même jusqu'à la fermeture */ }
    ecouteurs.forEach((fn) => fn());
  }

  // Un identifiant unique pour chaque élément
  const nouvelId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  // Ce que chacun a le droit de voir. Avec Supabase, ce sont les règles
  // de sécurité de la base (« Row Level Security ») qui feront ce travail.
  function visible(table, ligne) {
    if (table === "coin") return ligne.proprio === etat.moi;  // le coin perso : rien que pour soi
    // le cycle : visible par l'autre seulement si sa propriétaire a choisi de le partager
    if (table === "cycle") return ligne.proprio === etat.moi || !!etat.profils[ligne.proprio]?.cycle?.actif;
    return true;
  }

  return {
    // Qui tient le téléphone ? Avec Supabase : la personne connectée.
    moi: () => etat.moi,
    autre: () => (etat.moi === "choups" ? "li" : "choups"),
    surnom: (qui) => etat.profils[qui]?.surnom || qui,
    personnes: () => PERSONNES.slice(),
    // Le profil (surnom, réglages du cycle). On rend une copie : on le change avec modifierProfil.
    profil: (qui) => structuredClone(etat.profils[qui] || {}),
    async modifierProfil(qui, champs) {
      if (qui !== etat.moi) return; // on ne change que son propre profil
      Object.assign(etat.profils[qui], champs);
      sauver();
    },

    // --- Mode essai seulement ---
    changerMoi(qui) { etat.moi = qui; sauver(); },
    changerSurnom(qui, surnom) { etat.profils[qui].surnom = surnom.trim() || etat.profils[qui].surnom; sauver(); },
    remettreExemples() { const moi = etat.moi; etat = exemplesDeDepart(); etat.moi = moi; sauver(); },

    // --- Lire / ajouter / modifier / supprimer ---
    // « async » : avec Supabase, il faudra attendre la réponse d'Internet.
    async lister(table) {
      return (etat[table] || []).filter((l) => visible(table, l)).map((l) => structuredClone(l));
    },
    async ajouter(table, objet) {
      const ligne = { id: nouvelId(), creeLe: Date.now(), ...objet };
      etat[table].push(ligne);
      sauver();
      return ligne;
    },
    async modifier(table, id, champs) {
      const ligne = etat[table].find((l) => l.id === id);
      if (ligne && visible(table, ligne)) Object.assign(ligne, champs);
      sauver();
    },
    async supprimer(table, id) {
      etat[table] = etat[table].filter((l) => !(l.id === id && visible(table, l)));
      sauver();
    },

    // Prévenir l'écran quand quelque chose change.
    // Avec Supabase : aussi quand c'est L'AUTRE qui a écrit (temps réel).
    surChangement(fn) { ecouteurs.push(fn); },
  };
})();
