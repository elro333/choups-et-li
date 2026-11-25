// config.js — l'adresse de votre base Supabase.
//
// Ces deux informations sont PUBLIQUES par nature : elles servent juste à
// trouver la base. Ce qui protège vos données, ce sont vos comptes et les
// règles de sécurité de la base (supabase/schema.sql).
// La clé SECRÈTE (sb_secret_…) ne doit JAMAIS être écrite ici.

const SUPABASE_URL = "https://jvdghejqqeparitspxbr.supabase.co";
const SUPABASE_CLE = "sb_publishable_RIvevC8lsW4uJC4fVQGVJw_wF-kpg8I";

// La clé PUBLIQUE des notifications (sa jumelle privée est dans les Secrets de Supabase)
const VAPID_PUBLIQUE = "BO447g-VrhA6qgk9yZbKVtavpQGtOD6vukAqazaJoa3XmbSCBW4rknGoosYD0Ol4U5LGoWz2Fz4Ce0CRLoCcAnM";
