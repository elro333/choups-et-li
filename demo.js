// demo.js — les FAUX EXEMPLES du mode essai.
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
    profils: { choups: { surnom: "Choups" }, li: { surnom: "Li" } },

    envies: [
      { id: id(), titre: "Pique-nique au coucher du soleil", detail: "Une couverture, du fromage, et on regarde le ciel changer de couleur.", categorie: "dehors", prix: 1, par: "li", avis: { choups: null, li: "oui" }, fait: false, creeLe: maintenant - 2 * heure },
      { id: id(), titre: "Escape game à deux", detail: "Une heure pour sortir d'une pièce, en équipe.", categorie: "pluie", prix: 2, par: "li", avis: { choups: null, li: "oui" }, fait: false, creeLe: maintenant - 5 * heure },
      { id: id(), titre: "Soirée crêpes et film", detail: "Chacun choisit une garniture surprise.", categorie: "cocooning", prix: 1, par: "choups", avis: { choups: "oui", li: null }, fait: false, creeLe: maintenant - jour },
      { id: id(), titre: "Week-end à la montagne", detail: "Raquettes, chocolat chaud, chalet.", categorie: "voyage", prix: 3, par: "choups", avis: { choups: "oui", li: "oui" }, fait: false, creeLe: maintenant - 6 * jour },
      { id: id(), titre: "Chacun habille l'autre en friperie", detail: "Budget serré, défilé obligatoire.", categorie: "jeux", prix: 1, par: "li", avis: { choups: "oui", li: "oui" }, fait: false, creeLe: maintenant - 9 * jour },
      { id: id(), titre: "Marché de Noël", detail: "Vin chaud et petites lumières.", categorie: "hiver", prix: 1, par: "choups", avis: { choups: "oui", li: "oui" }, fait: false, creeLe: maintenant - 3 * jour },
      { id: id(), titre: "Cours de cuisine", detail: "Apprendre une recette d'un autre pays.", categorie: "pluie", prix: 2, par: "choups", avis: { choups: "oui", li: "oui" }, fait: true, faitLe: dans(-20), souvenir: "On a raté la pâte la première fois, et on a ri pendant dix minutes.", creeLe: maintenant - 40 * jour },
      { id: id(), titre: "Karaoké", detail: "", categorie: "jeux", prix: 2, par: "li", avis: { choups: "non", li: "oui" }, fait: false, creeLe: maintenant - 12 * jour },
    ],

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
