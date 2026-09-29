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
  if (!key) return res.status(500).json({ error: 'Clé absente sur le serveur.' });

  // Plusieurs modèles de secours : si l'un est surchargé, on passe au suivant
  const modeles = ['gemini-3.8-flash', 'gemini-3.8-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash-lite'];
  let dernierErreur = null;

  for (const modele of modeles) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modele}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await r.json();
      if (r.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return res.status(200).json({ analyse: data.candidates[0].content.parts[0].text });
      }
      dernierErreur = `${modele} (code ${r.status}) : ` + JSON.stringify(data?.error?.message || data).slice(0, 200);
    } catch (e) {
      dernierErreur = `${modele} : ${e.message}`;
    }
  }
  res.status(500).json({ error: 'Tous les modèles sont surchargés pour le moment, réessaie dans quelques minutes. Détail : ' + dernierErreur });
}
