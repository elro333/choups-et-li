// notifier.ts — le petit programme qui envoie les notifications.
//
// Il vit dans Supabase (Edge Functions › « notifier »). L'appli l'appelle
// juste après avoir enregistré un petit mot ou une nouvelle envie :
//   1. il vérifie que c'est bien l'un de vous deux qui appelle ;
//   2. il relit le mot dans la base (on ne croit pas l'appli sur parole) ;
//   3. il envoie la notification sur le(s) téléphone(s) de l'autre.
//
// Les clés VAPID sont dans les « Secrets » de Supabase, jamais ici.

import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const base = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
webpush.setVapidDetails(
  "https://elro333.github.io/choups-et-li/",
  Deno.env.get("VAPID_PUBLIQUE")!,
  Deno.env.get("VAPID_PRIVEE")!,
);

const entetes = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const reponse = (texte: string, statut = 200) => new Response(texte, { status: statut, headers: entetes });
const dateFr = (iso: string) =>
  new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return reponse("ok");
  try {
    // 1. Qui appelle ?
    const jeton = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: u } = await base.auth.getUser(jeton);
    if (!u?.user) return reponse("non connecté", 401);
    const { data: profils } = await base.from("profils").select("user_id, qui, surnom");
    const appelant = profils?.find((p) => p.user_id === u.user.id)?.qui;
    if (!appelant) return reponse("pas membre", 403);
    const nom = (q: string) => profils?.find((p) => p.qui === q)?.surnom ?? q;

    // 2. On relit l'élément dans la base
    const { id } = await req.json();
    const { data: r } = await base.from("elements").select("*").eq("id", id).maybeSingle();
    if (!r) return reponse("introuvable", 404);
    if (Date.now() - new Date(r.cree_le).getTime() > 5 * 60 * 1000) return reponse("trop ancien");
    const d = r.data || {};

    let titre = "", corps = "";
    if (r.tab === "mots" && d.de === appelant) {
      if (d.ouvrirLe) { titre = `💌 Une lettre de ${nom(appelant)}`; corps = `À ouvrir le ${dateFr(d.ouvrirLe)}… patience 🤫`; }
      else { titre = `💌 ${nom(appelant)}`; corps = String(d.texte ?? "").slice(0, 160); }
    } else if (r.tab === "envies" && d.par === appelant) {
      titre = `✨ ${nom(appelant)} a une idée`; corps = String(d.titre ?? "");
    } else {
      return reponse("rien à envoyer");
    }

    // 3. On envoie à l'autre
    const pour = appelant === "choups" ? "li" : "choups";
    const { data: abos } = await base.from("abonnements_push").select("endpoint, abonnement").eq("qui", pour);
    const message = JSON.stringify({ titre, corps });
    await Promise.all((abos ?? []).map(async (a) => {
      try {
        await webpush.sendNotification(a.abonnement, message);
      } catch (e) {
        // Téléphone désabonné (appli supprimée…) : on l'oublie
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await base.from("abonnements_push").delete().eq("endpoint", a.endpoint);
        else console.error(e);
      }
    }));
    return reponse("ok");
  } catch (e) {
    console.error(e);
    return reponse("erreur", 500);
  }
});
