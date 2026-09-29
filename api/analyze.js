export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  const { texte } = req.body || {};
  if (!texte || texte.trim().length < 20) return res.status(400).json({ error: 'Décris ta pub ou ton produit (au moins quelques phrases).' });

  const prompt = `Tu es un expert en marketing digital africain (Cameroun, marchés FCFA). Analyse ce contenu marketing et réponds UNIQUEMENT avec les 4 blocs suivants, chacun précédé exactement de son marqueur sur sa propre ligne, sans markdown ni commentaire :

###ANALYSE### points forts et points faibles
###CIBLE### public cible : à qui ça parle vraiment et comment mieux le toucher
###ANGLES### 5 accroches concrètes prêtes à utiliser, une par ligne
###NOTE### note globale sur 10 avec justification en 2 phrases

Contenu à analyser : """${texte}"""`;
  const erreurs = [];

  // 1) Essai des modèles Gemini
  const key = process.env.GEMINI_API_KEY;
  const modeles = ['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash'];
  if (key) {
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
        erreurs.push(`${modele} (${r.status})`);
      } catch (e) { erreurs.push(`${modele} : ${e.message}`); }
    }
  }

  // 2) Secours DeepSeek (si la clé est configurée)
  const dsKey = process.env.DEEPSEEK_API_KEY;
  if (dsKey) {
    try {
      const r = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${dsKey}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const data = await r.json();
      const reponse = data?.choices?.[0]?.message?.content;
      if (r.ok && reponse) return res.status(200).json({ analyse: reponse });
      erreurs.push('deepseek (' + r.status + ')');
    } catch (e) { erreurs.push('deepseek : ' + e.message); }
  }

  res.status(500).json({ error: 'Tous les services sont surchargés pour le moment, réessaie dans quelques minutes. Détail : ' + erreurs.join(' | ') });
}
