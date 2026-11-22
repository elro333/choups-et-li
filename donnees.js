// donnees.js — la MÉMOIRE de l'appli, reliée à Supabase.
//
// Tout ce que l'appli lit ou écrit passe par ici. Les onglets ne savent pas
// OÙ c'est rangé, ils demandent juste à « Donnees ».
//
// Comment ça marche :
// 1. après la connexion, on charge tout ce que la base veut bien nous montrer
//    (les règles de sécurité trient : pas le coin de l'autre, pas ses lettres avant la date) ;
// 2. on garde une copie en mémoire, pour que l'appli soit rapide ;
// 3. chaque changement part dans la base ;
// 4. le « temps réel » nous prévient quand L'AUTRE écrit, et on redessine.
//
// Les « tables » (dans la base, tout est dans « elements », avec une colonne « tab ») :
//   envies : { id, titre, detail, categorie, prix, par, avis: {choups, li}, fait, faitLe, souvenir, creeLe }
//   mots   : { id, de, texte, ouvrirLe (date ou null = tout de suite), ouvert, creeLe }
//            (le texte d'une lettre « à ouvrir le… » est rangé à part, dans « lettres »)
//   dates  : { id, titre, date, emoji, note, creeLe }
//   coin   : { id, proprio, texte, type ("cadeau" ou "surprise"), fait, creeLe }
//   humeurs: { id, qui, jour ("AAAA-MM-JJ"), emoji, mot, creeLe }
//   cycle  : { id, proprio, debut ("AAAA-MM-JJ" = 1er jour des règles), creeLe }
//   marvel : { id, cle (voir marvel.js), statut ("a-voir", "en-cours", "vu") }
//   films  : { id, titre, par, statut ("a-voir" ou "vu"), notes: {choups, li}, creeLe }
// Et pour chaque personne, un « profil » : { qui, surnom, cycle: { actif, duree, regles } }

const Donnees = (() => {
  const TABLES = ["envies", "mots", "dates", "coin", "humeurs", "cycle", "marvel", "films"];
  const PERSONNES = ["choups", "li"]; // deux identifiants techniques, pas de vrais prénoms
  const client = supabase.createClient(SUPABASE_URL, SUPABASE_CLE);

  let monQui = null;            // "choups" ou "li", d'après le compte connecté
  let profils = {};             // { choups: {...}, li: {...} }
  let cache = {};               // { envies: [...], mots: [...], ... }
  let textes = {};              // le texte des lettres qu'on a le droit de lire
  const ecouteurs = [];
  TABLES.forEach((t) => (cache[t] = []));

  const prevenir = () => ecouteurs.forEach((fn) => fn());
  const nouvelId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const erreur = (e) => { console.error(e); if (typeof petitMessage === "function") petitMessage("Oups, pas de connexion 😕"); };

  // Une ligne de la base → un objet pour l'appli
  const versObjet = (r) => {
    const o = { id: r.id, ...r.data };
    if (r.tab === "mots" && o.ouvrirLe && textes[r.id]) o.texte = textes[r.id];
    return o;
  };
  // À qui appartient un élément (pour les règles de sécurité)
  const proprioDe = (table, o) =>
    table === "coin" || table === "cycle" ? o.proprio : table === "humeurs" ? o.qui : monQui;
  // Ce qu'on range dans la colonne « data » (sans l'id, sans le texte d'une lettre)
  const versData = (table, o) => {
    const d = { ...o };
    delete d.id;
    if (table === "mots" && d.ouvrirLe) delete d.texte;
    return d;
  };

  // ---------- Connexion ----------
  async function session() {
    const { data } = await client.auth.getSession();
    return data.session;
  }
  async function connecter(email, motDePasse) {
    const { error } = await client.auth.signInWithPassword({ email, password: motDePasse });
    return error ? error.message : null;
  }
  async function deconnecter() {
    await client.auth.signOut();
    location.reload();
  }

  // ---------- Chargement ----------
  async function charger() {
    const [p, e, l] = await Promise.all([
      client.from("profils").select("*"),
      client.from("elements").select("*").limit(5000),
      client.from("lettres").select("id, texte"),
    ]);
    if (p.error || e.error || l.error) throw p.error || e.error || l.error;
    profils = {};
    p.data.forEach((x) => (profils[x.qui] = x));
    const { data: u } = await client.auth.getUser();
    monQui = p.data.find((x) => x.user_id === u.user?.id)?.qui || null;
    textes = {};
    l.data.forEach((x) => (textes[x.id] = x.texte));
    TABLES.forEach((t) => (cache[t] = []));
    e.data.forEach((r) => cache[r.tab]?.push(versObjet(r)));
  }

  // Au tout premier lancement : la liste d'activités de départ (idees.js).
  // Les identifiants sont fixes : si les deux téléphones le font en même temps, pas de doublon.
  async function remplirSiVide() {
    if (cache.envies.length) return;
    const lignes = enviesDeDepart(Date.now()).map((o) => ({ id: o.id, tab: "envies", proprio: "choups", data: versData("envies", o) }));
    const { error } = await client.from("elements").upsert(lignes, { onConflict: "id", ignoreDuplicates: true });
    if (error) return erreur(error);
    await charger();
  }

  // Le temps réel : on applique ce qui change dans la base
  function ecouter() {
    client.channel("choups-et-li")
      .on("postgres_changes", { event: "*", schema: "public", table: "elements" }, (chg) => {
        if (chg.eventType === "DELETE") {
          TABLES.forEach((t) => (cache[t] = cache[t].filter((o) => o.id !== chg.old.id)));
        } else {
          const r = chg.new;
          if (!cache[r.tab]) return;
          const o = versObjet(r);
          const i = cache[r.tab].findIndex((x) => x.id === r.id);
          if (i >= 0) cache[r.tab][i] = { ...cache[r.tab][i], ...o };
          else cache[r.tab].push(o);
        }
        prevenir();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "profils" }, (chg) => {
        if (chg.new?.qui) profils[chg.new.qui] = chg.new;
        prevenir();
      })
      .subscribe();
    // En revenant dans l'appli, on recharge (au cas où le temps réel aurait dormi)
    document.addEventListener("visibilitychange", async () => {
      if (!document.hidden && monQui) { try { await charger(); prevenir(); } catch (e) { /* hors ligne */ } }
    });
  }

  async function demarrer() {
    await charger();
    if (!monQui) return false;      // compte pas relié à Choups & Li
    await remplirSiVide();
    ecouter();
    prevenir();
    return true;
  }

  // Ce que chacun a le droit de voir (la base le fait déjà ; ceci est une 2e sécurité à l'écran)
  function visible(table, o) {
    if (table === "coin") return o.proprio === monQui;
    if (table === "cycle") return o.proprio === monQui || !!profils[o.proprio]?.cycle?.actif;
    return true;
  }

  return {
    connecter, deconnecter, session, demarrer,

    moi: () => monQui || "choups",
    autre: () => (monQui === "li" ? "choups" : "li"),
    surnom: (qui) => profils[qui]?.surnom || (qui === "li" ? "Li" : "Choups"),
    personnes: () => PERSONNES.slice(),
    profil: (qui) => structuredClone({ cycle: profils[qui]?.cycle, surnom: profils[qui]?.surnom }),
    moiChoisi: () => true,

    async modifierProfil(qui, champs) {
      if (qui !== monQui) return;
      Object.assign(profils[qui], champs);
      prevenir();
      const { error } = await client.from("profils").update(champs).eq("qui", qui);
      if (error) erreur(error);
    },
    changerSurnom(qui, surnom) {
      if (qui === monQui && surnom.trim()) this.modifierProfil(qui, { surnom: surnom.trim() });
    },

    // --- Lire / ajouter / modifier / supprimer ---
    async lister(table) {
      return cache[table].filter((o) => visible(table, o)).map((o) => structuredClone(o));
    },
    async ajouter(table, objet) {
      const o = { id: nouvelId(), creeLe: Date.now(), ...objet };
      cache[table].push(o);
      if (table === "mots" && o.ouvrirLe) textes[o.id] = o.texte;
      prevenir();
      const { error } = await client.from("elements").insert({ id: o.id, tab: table, proprio: proprioDe(table, o), data: versData(table, o) });
      if (error) return erreur(error);
      if (table === "mots" && o.ouvrirLe) {
        const r = await client.from("lettres").insert({ id: o.id, de: o.de, ouvrir_le: o.ouvrirLe, texte: o.texte });
        if (r.error) erreur(r.error);
      }
      return o;
    },
    async modifier(table, id, champs) {
      const o = cache[table].find((x) => x.id === id);
      if (!o || !visible(table, o)) return;
      Object.assign(o, champs);
      prevenir();
      const { error } = await client.from("elements").update({ data: versData(table, o) }).eq("id", id);
      if (error) erreur(error);
    },
    async supprimer(table, id) {
      cache[table] = cache[table].filter((x) => x.id !== id);
      prevenir();
      const { error } = await client.from("elements").delete().eq("id", id);
      if (error) erreur(error);
      if (table === "mots") await client.from("lettres").delete().eq("id", id);
    },

    // Le texte d'une lettre : la base ne le donne qu'à partir de sa date
    async texteLettre(id) {
      if (textes[id]) return textes[id];
      const { data } = await client.from("lettres").select("texte").eq("id", id).maybeSingle();
      if (data) textes[id] = data.texte;
      return data?.texte || null;
    },

    surChangement(fn) { ecouteurs.push(fn); },
  };
})();
