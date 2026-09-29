export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  const { produit, cible } = req.body || {};
  if (!produit || produit.trim().length < 10) return res.status(400).json({ error: 'Décris ton produit ou service (au moins une phrase).' });

  const prompt = `Tu es un créateur de contenu publicitaire expert du marché africain (Cameroun, TikTok, WhatsApp, Facebook). Pour ce produit/service, réponds en français structuré :

1. SCRIPT VIDÉO PRINCIPAL (30-45 sec) : format UGC, avec indication scène par scène (visuel + voix off), conçu pour convertir
2. 3 ACCROCHES TIKTOK (hook de 3 secondes, punchy)
3. 2 ACCROCHES FACEBOOK/INSTAGRAM (style pub Meta)
4. MESSAGE WHATSAPP DE VENTE (message direct prêt à envoyer aux prospects)
5. PLAN DE CONTENU 7 JOURS : un post par jour avec l'idée et la plateforme

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
