// api/aw-auth.js — Bridge SSO Brumerie → Address-Web
// Utilise la table brumerie_users pour retrouver/créer les comptes
// sans lister tous les users Supabase (évite l'erreur 500)

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY;

const ALLOWED_ORIGINS = [
  'https://brumerie.com',
  'https://www.brumerie.com',
  'http://localhost:3000',
  'http://localhost:5173',
];

const headers = (key) => ({
  'apikey':        key,
  'Authorization': `Bearer ${key}`,
  'Content-Type':  'application/json',
  'Prefer':        'return=representation',
});

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: 'Variables manquantes: SUPABASE_URL, SUPABASE_SERVICE_KEY' });
  }

  const { uid, email, name } = req.body || {};
  if (!uid || !email) return res.status(400).json({ error: 'uid et email requis' });

  const h = headers(SERVICE_KEY);

  try {
    // ── ÉTAPE 1 : Chercher dans brumerie_users par Firebase UID ──
    const lookupRes = await fetch(
      `${SUPABASE_URL}/rest/v1/brumerie_users?brumerie_uid=eq.${encodeURIComponent(uid)}&select=supabase_id`,
      { headers: h }
    );
    const existing = await lookupRes.json();

    let supabaseUserId;
    let isNewUser = false;

    if (existing && existing.length > 0) {
      // ✅ Utilisateur connu — récupérer son Supabase ID directement
      supabaseUserId = existing[0].supabase_id;

    } else {
      // 🆕 Nouvel utilisateur — créer le compte Supabase
      const createRes = await fetch(
        `${SUPABASE_URL}/auth/v1/admin/users`,
        {
          method: 'POST',
          headers: h,
          body: JSON.stringify({
            email,
            email_confirm: true,
            user_metadata: {
              brumerie_uid: uid,
              full_name: name || email.split('@')[0],
              source: 'brumerie_sso',
            },
          }),
        }
      );
      const created = await createRes.json();

      // Gérer le cas où le compte email existe déjà dans Supabase
      // mais pas encore dans brumerie_users (migration)
      if (!created.id && created.msg?.includes('already been registered')) {
        // Chercher par email via l'endpoint individuel
        const byEmailRes = await fetch(
          `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}&page=1&per_page=1`,
          { headers: h }
        );
        const byEmail = await byEmailRes.json();
        if (byEmail.users && byEmail.users.length > 0) {
          supabaseUserId = byEmail.users[0].id;
        } else {
          return res.status(500).json({ error: 'Compte existant introuvable', detail: created });
        }
      } else if (!created.id) {
        return res.status(500).json({ error: 'Erreur création compte', detail: created });
      } else {
        supabaseUserId = created.id;
        isNewUser = true;
      }

      // Enregistrer le lien Firebase UID ↔ Supabase UUID dans brumerie_users
      await fetch(
        `${SUPABASE_URL}/rest/v1/brumerie_users`,
        {
          method: 'POST',
          headers: h,
          body: JSON.stringify({
            brumerie_uid: uid,
            supabase_id:  supabaseUserId,
            email,
          }),
        }
      );
    }

    // ── ÉTAPE 2 : Générer le magic link ──────────────────────────
    const otpRes = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users/${supabaseUserId}/magiclink`,
      {
        method: 'POST',
        headers: h,
        body: JSON.stringify({
          redirect_to: 'https://addressweb.brumerie.com/auth/brumerie',
        }),
      }
    );
    const otpData = await otpRes.json();

    if (!otpData.action_link) {
      return res.status(500).json({ error: 'Erreur magic link', detail: otpData });
    }

    return res.status(200).json({
      magicLink:      otpData.action_link,
      supabaseUserId, // stocker côté Brumerie pour les créations d'adresses
      isNewUser,
    });

  } catch (err) {
    console.error('SSO Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
