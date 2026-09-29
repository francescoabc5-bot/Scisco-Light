export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  const { texte } = req.body || {};
  if (!texte || texte.trim().length < 20) return res.status(400).json({ error: 'Décris ta pub ou ton produit (au moins quelques phrases).' });

  const prompt = `Tu es un expert en marketing digital africain (Cameroun, marchés FCFA). Analyse ce contenu marketing et réponds en français, structuré en 4 parties avec des titres clairs :
1. ANALYSE : points forts et points faibles
2. PUBLIC CIBLE : à qui ça parle vraiment, et comment mieux le toucher
3. ANGLES AMÉLIORÉS : 5 accroches concrètes prêtes à utiliser
4. NOTE GLOBALE sur 10 avec justification en 2 phrases.

Contenu à analyser : """${texte}"""`;

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: 'Clé absente sur le serveur (GEMINI_API_KEY non configurée dans Vercel).' });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await r.json();
    if (!r.ok) {
      // On affiche l'erreur exacte de Google pour le diagnostic
      return res.status(500).json({ error: 'Google a répondu : ' + JSON.stringify(data).slice(0, 500) });
    }
    const analyse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!analyse) return res.status(500).json({ error: 'Réponse vide de Gemini : ' + JSON.stringify(data).slice(0, 500) });
    res.status(200).json({ analyse });
  } catch (e) {
    res.status(500).json({ error: 'Erreur réseau : ' + e.message });
  }
}
