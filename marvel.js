// marvel.js — le catalogue Marvel (MCU) : tous les films et séries Marvel Studios,
// jusqu'à Avengers : Doomsday (au cinéma le 16 décembre 2026 en France).
//
// Ce sont des informations publiques : rien de personnel ici.
// Ce que VOUS avez vu ou pas est rangé dans la base (table « marvel »).
//
// Chaque titre : [cle, titre, type, date de sortie "AAAA-MM", place dans l'histoire, bonus ?]
// (dans l'ordre de sortie ; la date est "AAAA-MM", ou juste "AAAA" quand le mois n'est pas connu)
//   type  : film, serie, special, anim (série animée), court (court-métrage)
//   place : l'ordre chronologique de l'histoire (source : marvelwatchorder.com, nov. 2026 ;
//           Marvel ne publie pas de liste officielle complète, les sites ne sont pas tous d'accord)
//   bonus : facultatif (courts-métrages, séries annexes) : caché par défaut
// Sources des dates : disneyplus.com (« Marvel movies in order », nov. 2026) et Wikipédia.

const MARVEL = [
  ["iron-man", "Iron Man", "film", "2008-05", 5],
  ["hulk", "L'Incroyable Hulk", "film", "2008-06", 7],
  ["iron-man-2", "Iron Man 2", "film", "2010-05", 6],
  ["thor", "Thor", "film", "2011-05", 9],
  ["first-avenger", "Captain America : First Avenger", "film", "2011-07", 2],
  ["os-consultant", "One-Shot : The Consultant", "court", "2011", 10, true],
  ["os-marteau", "One-Shot : Un truc drôle s'est produit en allant au marteau de Thor", "court", "2011", 8, true],
  ["avengers", "Avengers", "film", "2012-05", 11],
  ["os-item-47", "One-Shot : Item 47", "court", "2012", 12, true],
  ["iron-man-3", "Iron Man 3", "film", "2013-05", 14],
  ["os-agent-carter", "One-Shot : Agent Carter", "court", "2013", 3, true],
  ["thor-2", "Thor : Le Monde des ténèbres", "film", "2013-11", 13],
  ["soldat-hiver", "Captain America : Le Soldat de l'hiver", "film", "2014-04", 16],
  ["os-all-hail", "One-Shot : All Hail the King", "court", "2014", 15, true],
  ["gardiens", "Les Gardiens de la Galaxie", "film", "2014-08", 17],
  ["ultron", "Avengers : L'Ère d'Ultron", "film", "2015-05", 21],
  ["ant-man", "Ant-Man", "film", "2015-07", 23],
  ["civil-war", "Captain America : Civil War", "film", "2016-05", 24],
  ["doctor-strange", "Doctor Strange", "film", "2016-11", 30],
  ["gardiens-2", "Les Gardiens de la Galaxie Vol. 2", "film", "2017-05", 18],
  ["homecoming", "Spider-Man : Homecoming", "film", "2017-07", 27],
  ["ragnarok", "Thor : Ragnarok", "film", "2017-11", 34],
  ["black-panther", "Black Panther", "film", "2018-02", 26],
  ["infinity-war", "Avengers : Infinity War", "film", "2018-04", 36],
  ["ant-man-2", "Ant-Man et la Guêpe", "film", "2018-07", 35],
  ["captain-marvel", "Captain Marvel", "film", "2019-03", 4],
  ["endgame", "Avengers : Endgame", "film", "2019-04", 37],
  ["far-from-home", "Spider-Man : Far From Home", "film", "2019-07", 44],
  ["wandavision", "WandaVision", "serie", "2021-01", 41],
  ["falcon", "Falcon et le Soldat de l'hiver", "serie", "2021-03", 43],
  ["loki-1", "Loki · saison 1", "serie", "2021-06", 38],
  ["black-widow", "Black Widow", "film", "2021-07", 25],
  ["what-if-1", "What If…? · saison 1", "anim", "2021-08", 39],
  ["shang-chi", "Shang-Chi et la Légende des Dix Anneaux", "film", "2021-09", 42],
  ["eternels", "Les Éternels", "film", "2021-11", 47],
  ["hawkeye", "Hawkeye", "serie", "2021-11", 51],
  ["no-way-home", "Spider-Man : No Way Home", "film", "2021-12", 48],
  ["moon-knight", "Moon Knight", "serie", "2022-03", 52],
  ["multiverse", "Doctor Strange in the Multiverse of Madness", "film", "2022-05", 50],
  ["miss-marvel", "Miss Marvel", "serie", "2022-06", 56],
  ["love-thunder", "Thor : Love and Thunder", "film", "2022-07", 57],
  ["she-hulk", "She-Hulk : Avocate", "serie", "2022-08", 55],
  ["groot-1", "Je s'appelle Groot · saison 1", "court", "2022-08", 19, true],
  ["werewolf", "Werewolf by Night", "special", "2022-10", 59],
  ["wakanda-forever", "Black Panther : Wakanda Forever", "film", "2022-11", 53],
  ["gardiens-noel", "Les Gardiens de la Galaxie : Joyeuses Fêtes", "special", "2022-11", 60],
  ["quantumania", "Ant-Man et la Guêpe : Quantumania", "film", "2023-02", 61],
  ["gardiens-3", "Les Gardiens de la Galaxie Vol. 3", "film", "2023-05", 62],
  ["secret-invasion", "Secret Invasion", "serie", "2023-06", 63],
  ["groot-2", "Je s'appelle Groot · saison 2", "court", "2023-09", 20, true],
  ["loki-2", "Loki · saison 2", "serie", "2023-10", 65],
  ["the-marvels", "The Marvels", "film", "2023-11", 64],
  ["what-if-2", "What If…? · saison 2", "anim", "2023-12", 66],
  ["echo", "Echo", "serie", "2024-01", 54],
  ["deadpool-wolverine", "Deadpool & Wolverine", "film", "2024-07", 67],
  ["agatha", "Agatha All Along", "serie", "2024-09", 68],
  ["what-if-3", "What If…? · saison 3", "anim", "2024-12", 69],
  ["x-men-97-1", "X-Men '97 · saison 1", "anim", "2024", 79, true],
  ["spidey-fidele", "Your Friendly Neighborhood Spider-Man", "anim", "2025-01", 81, true],
  ["brave-new-world", "Captain America : Brave New World", "film", "2025-02", 71],
  ["daredevil-ba-1", "Daredevil : Born Again · saison 1", "serie", "2025-03", 70],
  ["thunderbolts", "Thunderbolts*", "film", "2025-05", 72],
  ["ironheart", "Ironheart", "serie", "2025-06", 58],
  ["quatre-fantastiques", "Les 4 Fantastiques : Premiers pas", "film", "2025-07", 73],
  ["eyes-wakanda", "Eyes of Wakanda", "anim", "2025-08", 1],
  ["marvel-zombies", "Marvel Zombies", "anim", "2025-09", 40],
  ["wonder-man", "Wonder Man", "serie", "2026-01", 74],
  ["daredevil-ba-2", "Daredevil : Born Again · saison 2", "serie", "2026-03", 75],
  ["punisher-special", "The Punisher : One Last Kill", "special", "2026-05", 76],
  ["brand-new-day", "Spider-Man : Brand New Day", "film", "2026-07", 77],
  ["visionquest", "VisionQuest", "serie", "2026-10", 78],
  ["x-men-97-2", "X-Men '97 · saison 2", "anim", "2026", 80, true],
  ["doomsday", "Avengers : Doomsday", "film", "2026-12", 99],
].map(([cle, titre, type, date, place, bonus]) => ({ cle, titre, type, date, place, bonus: !!bonus }));

// Les séries Marvel d'avant Disney+ (ABC, Netflix, Hulu, Freeform) : facultatives.
// Marvel a ajouté les séries Netflix (Daredevil & co) à sa chronologie en 2024,
// sans place précise publiée : on les range à part.
const MARVEL_TELE = [
  ["shield", "Marvel : Les Agents du S.H.I.E.L.D. · 7 saisons", "2013"],
  ["agent-carter", "Agent Carter · 2 saisons", "2015"],
  ["daredevil-netflix", "Daredevil (Netflix) · 3 saisons", "2015"],
  ["jessica-jones", "Jessica Jones · 3 saisons", "2015"],
  ["luke-cage", "Luke Cage · 2 saisons", "2016"],
  ["iron-fist", "Iron Fist · 2 saisons", "2017"],
  ["defenders", "The Defenders", "2017"],
  ["inhumans", "Inhumans", "2017"],
  ["punisher-netflix", "The Punisher (Netflix) · 2 saisons", "2017"],
  ["runaways", "Runaways · 3 saisons", "2017"],
  ["cloak-dagger", "Cloak & Dagger · 2 saisons", "2018"],
  ["helstrom", "Helstrom", "2020"],
].map(([cle, titre, date]) => ({ cle, titre, type: "serie", date, bonus: true, tele: true }));

const DATE_DOOMSDAY = "2026-12-16"; // sortie en France (mercredi)
