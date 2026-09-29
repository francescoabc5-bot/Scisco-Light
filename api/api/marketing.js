export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  const { produit, cible } = req.body || {};
  if (!produit || produit.trim().length < 10) return res.status(400).json({ error: 'Décris ton produit ou service (au moins une phrase).' });

const prompt = `Tu es un créateur de contenu publicitaire expert du marché africain (Cameroun, TikTok, WhatsApp, Facebook). Pour ce produit/service, réponds UNIQUEMENT avec les 5 blocs suivants, chacun précédé exactement de son marqueur sur sa propre ligne, sans autre commentaire ni mise en forme markdown :

###SCRIPT### puis le script vidéo principal (30-45 sec, format UGC, scène par scène : visuel + voix off)
###TIKTOK### puis 3 accroches TikTok (hook de 3 secondes), une par ligne
###META### puis 2 accroches Facebook/Instagram, une par ligne
###WHATSAPP### puis un message WhatsApp de vente prêt à envoyer
###PLAN### puis un plan de contenu 7 jours (un post par jour : jour, idée, plateforme)

Produit/Service : """${produit}"""
Cible (optionnel) : """${cible || 'non précisée'}"""`;

  const erreurs = [];
  const key = process.env.GEMINI_API_KEY;
  const modeles = ['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash'];
  if (key) {
    for (const modele of modeles) {
      try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modele}:generateContent?key=${key}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
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
  const dsKey = process.env.DEEPSEEK_API_KEY;
  if (dsKey) {
    try {
      const r = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${dsKey}` },
        body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }] })
      });
      const data = await r.json();
      const rep = data?.choices?.[0]?.message?.content;
      if (r.ok && rep) return res.status(200).json({ analyse: rep });
      erreurs.push('deepseek (' + r.status + ')');
    } catch (e) { erreurs.push('deepseek : ' + e.message); }
  }
  res.status(500).json({ error: 'Services surchargés, réessaie plus tard. Détail : ' + erreurs.join(' | ') });
}
