// api/aw-auth.js — Bridge SSO Brumerie → Address-Web
// Déployer sur Vercel comme Serverless Function
// Variables nécessaires dans Vercel : SUPABASE_URL + SUPABASE_SERVICE_KEY

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY; // clé service_role (jamais publique)

const ALLOWED_ORIGINS = [
  'https://brumerie.com',
  'https://www.brumerie.com',
  'http://localhost:3000',
  'http://localhost:5173',
];

module.exports = async function handler(req, res) {
  // CORS — autoriser uniquement Brumerie
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: 'Variables d\'environnement manquantes' });
  }

  const { uid, email, name } = req.body || {};
  if (!uid || !email) {
    return res.status(400).json({ error: 'uid et email requis' });
  }

  const headers = {
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
  };

  try {
    // 1. Chercher si l'utilisateur existe déjà par email
    const searchRes = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
      { headers }
    );
    const searchData = await searchRes.json();

    let supabaseUserId;

    if (searchData.users && searchData.users.length > 0) {
      // Utilisateur existant — récupérer son ID
      supabaseUserId = searchData.users[0].id;
    } else {
      // Créer le compte Supabase automatiquement
      const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email,
          email_confirm: true, // pas besoin de confirmation email
          user_metadata: {
            brumerie_uid: uid,
            full_name: name || email.split('@')[0],
            source: 'brumerie_sso',
          },
        }),
      });
      const created = await createRes.json();
      if (!created.id) {
        return res.status(500).json({ error: 'Erreur création compte', detail: created });
      }
      supabaseUserId = created.id;
    }

    // 2. Générer un lien magique (OTP) valable 1h
    const otpRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${supabaseUserId}/magiclink`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        redirect_to: 'https://addressweb.brumerie.com/auth/brumerie',
      }),
    });
    const otpData = await otpRes.json();

    if (!otpData.action_link) {
      return res.status(500).json({ error: 'Erreur génération magic link', detail: otpData });
    }

    return res.status(200).json({
      magicLink: otpData.action_link,
      supabaseUserId,
      isNewUser: !searchData.users?.length,
    });

  } catch (err) {
    console.error('SSO Error:', err);
    return res.status(500).json({ error: err.message });
  }
};
