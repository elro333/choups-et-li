// connexion.js — se connecter avec son compte (une seule fois par téléphone).
//
// Chacun a son compte Supabase (mail + mot de passe). Une fois connecté,
// le téléphone s'en souvient : on ne se reconnecte plus, il reste juste le code.
// C'est le compte qui dit à l'appli si on est Choups ou Li.

const Connexion = (() => {
  let ecran = null;

  function construire() {
    ecran = document.createElement("div");
    ecran.className = "verrou connexion";
    ecran.innerHTML = `
      <div class="fond-couleurs" aria-hidden="true"></div>
      <div class="etoiles" aria-hidden="true"></div>
      <form class="verrou-haut" id="form-connexion" style="width:100%;max-width:340px">
        <img src="icons/icon-180.png" alt="" class="verrou-icone">
        <p class="verrou-texte" id="connexion-texte">Connecte-toi une première fois 💗</p>
        <div class="groupe" style="width:100%">
          <input type="email" name="email" placeholder="Ton adresse mail" autocomplete="username" required>
          <input type="password" name="mdp" placeholder="Ton mot de passe" autocomplete="current-password" required>
        </div>
        <button class="btn-principal" type="submit" style="width:100%">Se connecter</button>
        <p class="aide" id="connexion-erreur" style="margin:0;color:#e5484d"></p>
      </form>
      <span></span>`;
    document.body.append(ecran);
  }

  // Afficher l'écran et attendre une connexion réussie
  function demander() {
    if (!ecran) construire();
    document.documentElement.classList.add("verrouille");
    ecran.classList.add("visible");
    return new Promise((ok) => {
      const form = ecran.querySelector("#form-connexion");
      form.onsubmit = async (e) => {
        e.preventDefault();
        const d = new FormData(form);
        const bouton = form.querySelector("button");
        bouton.disabled = true; bouton.textContent = "Connexion…";
        const probleme = await Donnees.connecter(d.get("email").trim(), d.get("mdp"));
        bouton.disabled = false; bouton.textContent = "Se connecter";
        if (probleme) {
          ecran.querySelector("#connexion-erreur").textContent = "Mail ou mot de passe incorrect.";
          return;
        }
        ecran.classList.remove("visible");
        document.documentElement.classList.remove("verrouille");
        ok();
      };
    });
  }

  // Le compte existe mais n'est pas relié à Choups & Li
  function pasRelie() {
    if (!ecran) construire();
    document.documentElement.classList.add("verrouille");
    ecran.classList.add("visible");
    ecran.querySelector("#form-connexion").innerHTML = `
      <img src="icons/icon-180.png" alt="" class="verrou-icone">
      <p class="verrou-texte">Ce compte n'est pas encore relié à Choups & Li.</p>
      <button type="button" class="btn-secondaire" onclick="Donnees.deconnecter()">Changer de compte</button>`;
  }

  return { demander, pasRelie };
})();
