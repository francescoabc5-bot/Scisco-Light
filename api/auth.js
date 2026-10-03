import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

// Initialise la base au premier appel (tables créées automatiquement)
let initFait = false;
async function sql() {
  const s = neon(process.env.POSTGRES_URL);
  if (!initFait) {
    try {
      await s`CREATE TABLE IF NOT EXISTS utilisateurs (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        mdp_hash TEXT NOT NULL,
        credits INTEGER DEFAULT 0,
        date_creation TIMESTAMPTZ DEFAULT NOW()
      )`;
      await s`CREATE TABLE IF NOT EXISTS historique_credit (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES utilisateurs(id),
        type TEXT NOT NULL,
        montant INTEGER NOT NULL,
        date TIMESTAMPTZ DEFAULT NOW()
      )`;
      initFait = true;
    } catch (e) { /* déjà créées */ }
  }
  return s;
}

function hash(mdp) { return crypto.createHash('sha256').update('scisco-' + mdp).digest('hex'); }
function jeton() { return crypto.randomBytes(24).toString('hex'); }

export default async function handler(req, res) {
  const { action, email, mdp } = req.body || {};
  const s = await sql();

  if (action === 'inscription') {
    if (!email || !mdp || !email.includes('@') || mdp.length < 6) return res.status(400).json({ error: 'Email valide et mot de passe de 6+ caractères requis.' });
    const h = hash(mdp);
    try {
      const rows = await s`INSERT INTO utilisateurs (email, mdp_hash) VALUES (${email.toLowerCase().trim()}, ${h}) RETURNING id`;
      const j = jeton();
      await s`INSERT INTO historique_credit (user_id, type, montant) VALUES (${rows[0].id}, 'inscription', 10)`;
      await s`UPDATE utilisateurs SET credits = 10 WHERE id = ${rows[0].id}`;
      return res.status(200).json({ ok: true, jeton: j, credits: 10, message: 'Compte créé ! 10 crédits offerts.' });
    } catch (e) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé.' });
    }
  }

  if (action === 'connexion') {
    const rows = await s`SELECT id, credits, mdp_hash FROM utilisateurs WHERE email = ${email.toLowerCase().trim()}`;
    if (!rows.length || rows[0].mdp_hash !== hash(mdp)) return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    return res.status(200).json({ ok: true, credits: rows[0].credits, user_id: rows[0].id });
  }

  if (action === 'solde') {
    const rows = await s`SELECT credits FROM utilisateurs WHERE email = ${email.toLowerCase().trim()}`;
    if (!rows.length) return res.status(404).json({ error: 'Compte introuvable.' });
    return res.status(200).json({ credits: rows[0].credits });
  }

  res.status(400).json({ error: 'Action inconnue' });
  }
