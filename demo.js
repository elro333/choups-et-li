// demo.js — les EXEMPLES du mode essai.
// (Les envies, elles, sont la vraie liste de départ : voir idees.js.)
//
// Juste de quoi voir l'appli remplie pendant qu'on la construit.
// Ce sont des exemples inventés, volontairement banals : vos vraies envies,
// vos vrais mots et vos vraies dates iront dans la base protégée,
// jamais dans ce fichier (le code peut être vu par d'autres).

function exemplesDeDepart() {
  const maintenant = Date.now();
  const heure = 3600 * 1000, jour = 24 * heure;
  // Une date "AAAA-MM-JJ" décalée de n jours par rapport à aujourd'hui
  const dans = (n) => {
    const d = new Date(maintenant + n * jour);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  // Une date passée : il y a "ans" années, décalée de "n" jours
  const ilYaAns = (ans, n = 0) => {
    const d = new Date(maintenant + n * jour);
    d.setFullYear(d.getFullYear() - ans);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  let n = 0;
  const id = () => "ex" + (n++);

  return {
    moi: "choups",
    profils: {
      choups: { surnom: "Choups", cycle: { actif: true, duree: 28, regles: 5 } },
      li: { surnom: "Li" },
    },

    // Marvel : les premiers films déjà vus, une série en cours
    marvel: ["iron-man", "hulk", "iron-man-2", "thor", "first-avenger", "avengers"]
      .map((cle) => ({ id: id(), cle, statut: "vu" })),

    films: [
      { id: id(), titre: "Un grand classique en noir et blanc", par: "li", statut: "a-voir", notes: {}, creeLe: maintenant - 2 * jour },
      { id: id(), titre: "Une comédie romantique de Noël", par: "choups", statut: "a-voir", notes: {}, creeLe: maintenant - jour },
      { id: id(), titre: "Un film de science-fiction", par: "li", statut: "vu", notes: { li: 5, choups: 4 }, creeLe: maintenant - 10 * jour },
    ],

    // L'humeur du jour : Li a déjà rempli la sienne, Choups pas encore
    humeurs: [
      { id: id(), qui: "li", jour: dans(0), emoji: "🙂", mot: "Grosse journée", creeLe: maintenant - 3 * heure },
      { id: id(), qui: "choups", jour: dans(-1), emoji: "🥰", mot: "", creeLe: maintenant - 20 * heure },
    ],

    // Exemple de cycle : règles commencées il y a 1 jour (donc jour 2)
    cycle: [
      { id: id(), proprio: "choups", debut: dans(-29), creeLe: maintenant - 29 * jour },
      { id: id(), proprio: "choups", debut: dans(-1), creeLe: maintenant - jour },
    ],

    // Les envies : la vraie liste de départ (idees.js), sans réponse de Li pour l'instant
    envies: enviesDeDepart(maintenant),

    mots: [
      { id: id(), de: "li", texte: "Bonne journée, je pense à toi 💭", ouvrirLe: null, creeLe: maintenant - 40 * 60 * 1000 },
      { id: id(), de: "choups", texte: "Merci pour ce matin 🥰", ouvrirLe: null, creeLe: maintenant - 3 * heure },
      { id: id(), de: "li", texte: "Tu as été géniale hier.", ouvrirLe: null, creeLe: maintenant - 26 * heure },
      { id: id(), de: "li", texte: "Si tu lis ça, c'est que le jour est arrivé. Je suis fier de toi, et je t'aime.", ouvrirLe: dans(0), ouvert: false, creeLe: maintenant - 8 * jour },
      { id: id(), de: "li", texte: "(une lettre secrète)", ouvrirLe: dans(12), ouvert: false, creeLe: maintenant - 2 * jour },
      { id: id(), de: "choups", texte: "Une lettre pour plus tard, rien que pour toi.", ouvrirLe: dans(30), ouvert: false, creeLe: maintenant - jour },
    ],

    dates: [
      { id: id(), titre: "Notre premier rendez-vous", date: ilYaAns(2, 9), emoji: "☕", note: "Exemple : modifie-moi ou supprime-moi." },
      { id: id(), titre: "Premier bisou", date: ilYaAns(2, 20), emoji: "💋", note: "" },
      { id: id(), titre: "Nos premières vacances", date: ilYaAns(1, -60), emoji: "🏝️", note: "" },
    ],

    coin: [
      { id: id(), proprio: "choups", texte: "Idée cadeau : un carnet de voyage", type: "cadeau", fait: false, creeLe: maintenant - 4 * jour },
      { id: id(), proprio: "choups", texte: "Surprise : un petit-déj au lit un dimanche", type: "surprise", fait: false, creeLe: maintenant - 2 * jour },
      { id: id(), proprio: "li", texte: "Surprise : une lettre cachée dans son sac", type: "surprise", fait: false, creeLe: maintenant - jour },
    ],
  };
}
