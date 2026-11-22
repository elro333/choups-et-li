// idees.js — la liste d'activités de départ : idées de sorties et de jeux à deux.
//
// Ce sont des idées d'activités, sans nom ni info sur vous : elles peuvent être dans le code.
// Au premier lancement, elles deviennent des « envies » :
//   - "choisie" : déjà choisie par Choups → Li peut dire oui ou non ;
//   - "a-trier" : une idée de la liste → chacun dit oui ou non.
// Avec Supabase, elles seront copiées une seule fois dans la base.
// Prix : 1 = gratuit / pas cher · 2 = moyen · 3 = pour une occasion.

const IDEES_DE_DEPART = [
  // --- Les idées de Choups ---
  ["D'un mot à l'autre", "Passer d'un mot à un autre en ne changeant qu'une lettre à chaque fois (ex. de PAIN à LOUP).", "jeux", 1, "choisie"],
  ["Le défi des couleurs", "Chacun tire une couleur au hasard et offre à l'autre un petit cadeau de cette couleur.", "jeux", 1, "choisie"],
  ["Le Mastermind en bonbons", "Chacun aligne des bonbons de couleur (Haribo, M&M's) sans que l'autre voie, et on doit deviner la combinaison.", "jeux", 1, "choisie"],

  // --- Déjà choisies ---
  ["Des dates de A à Z", "Une sortie par lettre de l'alphabet : A comme aquarium, B comme bowling…", "jeux", 2, "choisie"],
  ["Le défi 10 € en magasin", "Chacun a 10 € pour trouver des surprises pour l'autre dans un magasin.", "jeux", 1, "choisie"],
  ["Friperie : chacun habille l'autre", "Budget 15 € chacun, et on porte la tenue choisie par l'autre.", "jeux", 1, "choisie"],
  ["Le portrait sans regarder", "Chacun dessine l'autre sans jamais regarder sa feuille.", "jeux", 1, "choisie"],
  ["Cuisiner les yeux bandés", "L'un cuisine les yeux bandés, l'autre le guide uniquement à la voix.", "cocooning", 1, "choisie"],
  ["Dégustation à l'aveugle", "Chacun prépare des choses à goûter pour l'autre, qui doit deviner les yeux fermés.", "cocooning", 1, "choisie"],
  ["Les 36 questions pour tomber amoureux", "La célèbre liste de questions, à se poser l'un à l'autre en prenant son temps.", "cocooning", 1, "choisie"],
  ["Recréer une vieille photo", "Choisir une photo de vous (ou d'enfance) et la refaire à l'identique.", "jeux", 1, "choisie"],
  ["La date au dé", "On note 6 idées de sortie, on lance le dé, et on fait celle qui tombe.", "jeux", 1, "choisie"],
  ["Chacun compose un bouquet", "Chez le fleuriste ou au marché, chacun compose un bouquet pour l'autre.", "jeux", 2, "choisie"],
  ["Paint & sip à la maison", "Peindre la même chose chacun de son côté, avec un verre, et comparer.", "cocooning", 1, "choisie"],
  ["Le bocal à idées de dates", "Un bocal rempli de petits papiers d'idées ; on en tire un quand on ne sait pas quoi faire.", "cocooning", 1, "choisie"],
  ["Le village de Noël de Nice", "Balade au village de Noël, vin chaud et petites lumières.", "hiver", 1, "choisie"],
  ["Maison en pain d'épices et sapin", "Construire et décorer une maison en pain d'épices, puis décorer le sapin.", "hiver", 1, "choisie"],
  ["Marathon de films de Noël", "Plaid, chocolat chaud et une pile de films de Noël.", "hiver", 1, "choisie"],

  // --- À trier ensemble : hiver et Noël ---
  ["Secret Santa à règles", "Un Secret Santa à deux avec des règles : un budget, un thème, une contrainte.", "hiver", 1, "a-trier"],
  ["Marchés de Noël en Alsace ou en Allemagne", "Strasbourg, Colmar, Fribourg… un week-end dans les marchés de Noël.", "hiver", 3, "a-trier"],
  ["Ski ou luge dans le 06", "Une journée de neige : Isola 2000, Auron ou Valberg.", "hiver", 3, "a-trier"],
  ["Raquettes au clair de lune", "Une sortie en raquettes de nuit, souvent organisée par les stations.", "hiver", 2, "a-trier"],
  ["Les illuminations de Monaco ou Menton", "Une soirée à se balader dans les rues décorées pour Noël.", "hiver", 1, "a-trier"],
  ["Le bain du 1er janvier à Nice", "Commencer l'année par un plongeon (très court) dans la mer.", "hiver", 1, "a-trier"],
  ["Réveillon à deux", "Un réveillon rien qu'à deux, avec un vrai repas de fête.", "hiver", 2, "a-trier"],
  ["Galette des rois maison", "Faire la galette ensemble, et voir qui aura la fève.", "hiver", 1, "a-trier"],

  // --- À trier ensemble : dehors ---
  ["Coucher de soleil à la colline du Château", "Monter en haut de la colline pour regarder le soleil se coucher sur la baie.", "dehors", 1, "a-trier"],
  ["Sentier du littoral", "Une balade le long de la mer : cap de Nice ou cap Ferrat.", "dehors", 1, "a-trier"],
  ["Le sentier Nietzsche jusqu'à Èze", "La montée depuis la mer jusqu'au village perché.", "dehors", 1, "a-trier"],
  ["Pique-nique au Mont Boron", "Une couverture, de bonnes choses, et la vue.", "dehors", 1, "a-trier"],
  ["Kayak ou paddle à Villefranche", "Une sortie en mer en kayak ou en paddle dans la rade.", "dehors", 2, "a-trier"],
  ["Cours Saleya et socca", "Se balader au marché du cours Saleya et goûter la socca.", "dehors", 1, "a-trier"],
  ["Initiation à l'escrime à deux", "Un cours d'essai pour croiser le fer ensemble.", "dehors", 2, "a-trier"],
  ["La Vallée des Merveilles", "Une randonnée dans le Mercantour, à la journée.", "dehors", 1, "a-trier"],
  ["Une journée en Italie", "Vintimille ou Sanremo : marché, pâtes et gelato.", "dehors", 2, "a-trier"],
  ["Carnaval de Nice ou fête du citron de Menton", "Aller voir les défilés de février.", "dehors", 2, "a-trier"],

  // --- À trier ensemble : jour de pluie ---
  ["Escape game", "Une heure pour sortir d'une pièce, en équipe.", "pluie", 2, "a-trier"],
  ["Musée Matisse, Chagall ou MAMAC", "Un musée à deux, et on choisit chacun son œuvre préférée.", "pluie", 1, "a-trier"],
  ["Ciné en VO", "Une séance en version originale, et on en parle après.", "pluie", 1, "a-trier"],
  ["Atelier poterie ou cours de cuisine", "Apprendre à faire quelque chose de ses mains, ensemble.", "pluie", 2, "a-trier"],
  ["Marathon de films à thème", "Un thème, une pile de films, un plaid.", "pluie", 1, "a-trier"],
  ["Fort de couvertures et jeux de société", "Construire une cabane de couvertures et y jouer toute l'après-midi.", "pluie", 1, "a-trier"],
  ["Un puzzle de 1000 pièces", "Un grand puzzle à faire ensemble, sur plusieurs soirs.", "pluie", 1, "a-trier"],

  // --- À trier ensemble : cocooning ---
  ["Resto à la maison", "L'un fait le serveur, l'autre le client : menu, table dressée, tout.", "cocooning", 1, "a-trier"],
  ["Soirée « un pays »", "On tire un pays : sa cuisine, sa musique, un film de là-bas.", "cocooning", 1, "a-trier"],
  ["Lettres à ouvrir dans un an", "Chacun écrit une lettre à l'autre, à ouvrir dans un an.", "cocooning", 1, "a-trier"],
  ["Soirée massages et spa maison", "Bougies, huiles, masques : un spa à la maison.", "cocooning", 1, "a-trier"],
  ["Théâtre ou opéra", "Une soirée habillés, au théâtre ou à l'opéra.", "cocooning", 2, "a-trier"],
  ["Spa ou hammam", "Une demi-journée de détente dans un vrai spa.", "cocooning", 3, "a-trier"],

  // --- À trier ensemble : voyages ---
  ["Week-end à Turin ou Gênes", "Un week-end italien pas trop loin.", "voyage", 2, "a-trier"],
  ["Les Cinque Terre", "Les villages colorés au bord de la mer.", "voyage", 2, "a-trier"],
  ["Les gorges du Verdon", "Pédalo ou kayak dans les gorges, et randonnée.", "voyage", 2, "a-trier"],
  ["La roulette du globe", "On fait tourner un globe (ou une carte), et on rêve d'y aller.", "voyage", 1, "a-trier"],
  ["Un grand voyage à planifier", "Choisir ensemble une grande destination et commencer à la préparer.", "voyage", 3, "a-trier"],
];

// Transformer la liste en « envies » (appelé par demo.js, et plus tard pour remplir la base)
function enviesDeDepart(maintenant) {
  return IDEES_DE_DEPART.map(([titre, detail, categorie, prix, statut], i) => ({
    id: "idee" + i,
    titre, detail, categorie, prix,
    par: statut === "choisie" ? "choups" : "liste",
    avis: { choups: statut === "choisie" ? "oui" : null, li: null },
    fait: false,
    creeLe: maintenant - i * 60000, // garde l'ordre de la liste
  }));
}
