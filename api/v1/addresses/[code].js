// api/v1/addresses/[code].js
// GET    /api/v1/addresses/:code  → lire une adresse
// DELETE /api/v1/addresses/:code  → supprimer

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY;
const ANON_KEY     = process.env.VITE_SUPABASE_ANON_KEY;

const headers = {
  'apikey': ANON_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

async function validateApiKey(keyHeader) {
  if (!keyHeader) return null;
  const key = keyHeader.replace('Bearer ', '').trim();
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(key));
  const keyHash = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/api_keys?key_hash=eq.${keyHash}&is_active=eq.true&select=id,user_id,plan,daily_limit,requests_today`,
    { headers }
  );
  const keys = await res.json();
  if (!keys || keys.length === 0) return null;
  const apiKey = keys[0];
  if (apiKey.daily_limit !== -1 && apiKey.requests_today >= apiKey.daily_limit) {
    return { error: 'Limite quotidienne atteinte' };
  }
  await fetch(`${SUPABASE_URL}/rest/v1/api_keys?id=eq.${apiKey.id}`, {
    method: 'PATCH', headers,
    body: JSON.stringify({ requests_today: apiKey.requests_today + 1, last_used_at: new Date().toISOString() }),
  });
  return { userId: apiKey.user_id, plan: apiKey.plan };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const auth = await validateApiKey(req.headers.authorization);
  if (!auth) return res.status(401).json({ error: 'Clé API invalide ou manquante' });
  if (auth.error) return res.status(429).json({ error: auth.error });

  const { code } = req.query;

  if (req.method === 'GET') {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/addresses?address_code=eq.${encodeURIComponent(code)}&select=*`,
      { headers }
    );
    const data = await response.json();
    if (!data || data.length === 0) return res.status(404).json({ error: 'Adresse introuvable' });
    const a = data[0];
    return res.status(200).json({
      addressCode: a.address_code,
      latitude:    a.latitude,
      longitude:   a.longitude,
      repere:      a.repere,
      ville:       a.ville,
      quartier:    a.quartier,
      pays:        a.pays,
      categorie:   a.categorie,
      isPublic:    a.is_public,
      isVerified:  a.is_verified,
      viewCount:   a.view_count,
      createdAt:   a.created_at,
      shareLink:   `https://addressweb.brumerie.com/${a.address_code}`,
      googleMaps:  `https://www.google.com/maps?q=${a.latitude},${a.longitude}`,
      waze:        `https://waze.com/ul?ll=${a.latitude},${a.longitude}&navigate=yes`,
    });
  }

  if (req.method === 'DELETE') {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/addresses?address_code=eq.${encodeURIComponent(code)}&user_id=eq.${auth.userId}`,
      { method: 'DELETE', headers }
    );
    if (!response.ok) return res.status(403).json({ error: 'Suppression refusée ou adresse introuvable' });
    return res.status(200).json({ success: true, message: `Adresse ${code} supprimée` });
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
}
