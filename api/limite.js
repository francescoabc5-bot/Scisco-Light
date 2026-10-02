import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  const { visiteur, code } = req.body || {};
  if (!visiteur) return res.status(400).json({ error: 'Identifiant manquant' });

  // Code proprio : vérification côté serveur, jamais exposée
  if (code) {
    if (code === process.env.CODE_PROPRIO) {
      return res.status(200).json({ autorise: true, proprio: true, reste: Infinity });
    }
    return res.status(401).json({ autorise: false, error: 'Code proprio incorrect' });
  }

  // Compteur côté serveur : on hache l'identifiant pour l'anonymat
  const cleVisiteur = crypto.createHash('sha256').update(visiteur + 'scisco-sel').digest('hex').slice(0, 16);
  const compteur = global.__compteurs || (global.__compteurs = {});
  const aujourdHui = new Date().toISOString().slice(0, 10);
  const cle = cleVisiteur + ':' + aujourdHui;
  const LIMITE = 3;

  if (!(cle in compteur)) compteur[cle] = 0;
  // Nettoyage des vieux compteurs
  Object.keys(compteur).forEach(k => { if (!k.endsWith(aujourdHui)) delete compteur[k]; });

  if (compteur[cle] >= LIMITE) {
    return res.status(429).json({ autorise: false, reste: 0, error: 'Limite gratuite atteinte (3 par jour). Choisis un pack pour continuer !' });
  }
  compteur[cle]++;
  return res.status(200).json({ autorise: true, reste: LIMITE - compteur[cle] });
}
