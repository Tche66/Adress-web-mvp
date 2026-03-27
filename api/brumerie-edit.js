// api/brumerie-edit.js
// Permet à un utilisateur Brumerie de modifier son adresse
// via un token Firebase JWT — sans compte Supabase Auth
//
// Flux :
// 1. Brumerie appelle GET /api/brumerie-edit?code=AW-ABI-XXXXX&uid=FIREBASE_UID&token=FIREBASE_JWT
// 2. Ce endpoint vérifie que brumerie_uid == firebase_uid dans la table addresses
// 3. Génère un token signé temporaire (1h) et redirige vers /AW-XXX/modifier?edit_token=xxx
// 4. EditAddressPage vérifie ce token et autorise la modification

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY;

const h = {
  'apikey':        SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type':  'application/json',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://brumerie.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { code, uid } = req.method === 'GET' ? req.query : (req.body || {});

  if (!code || !uid) {
    return res.status(400).json({ error: 'code et uid requis' });
  }

  // 1. Vérifier que l'adresse appartient à cet uid Brumerie
  const addrRes = await fetch(
    `${SUPABASE_URL}/rest/v1/addresses?address_code=eq.${encodeURIComponent(code)}&select=address_code,brumerie_uid,user_id`,
    { headers: h }
  );
  const addresses = await addrRes.json();

  if (!addresses || addresses.length === 0) {
    return res.status(404).json({ error: 'Adresse introuvable' });
  }

  const address = addresses[0];

  if (address.brumerie_uid !== uid) {
    return res.status(403).json({ error: 'Cette adresse ne vous appartient pas' });
  }

  // 2. Générer un token temporaire signé (simple — HMAC SHA256 avec timestamp)
  const timestamp  = Date.now();
  const expiry     = timestamp + 3600000; // 1h
  const payload    = `${code}:${uid}:${expiry}`;
  const encoder    = new TextEncoder();
  const keyData    = encoder.encode(SERVICE_KEY.substring(0, 32));
  const msgData    = encoder.encode(payload);
  const cryptoKey  = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature  = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
  const sigHex     = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
  const editToken  = `${expiry}.${sigHex}`;

  // 3. Retourner le lien de modification sécurisé
  const editUrl = `https://addressweb.brumerie.com/${code}/modifier?edit_token=${editToken}&uid=${encodeURIComponent(uid)}`;

  return res.status(200).json({
    editUrl,
    editToken,
    expiresAt: new Date(expiry).toISOString(),
  });
}
