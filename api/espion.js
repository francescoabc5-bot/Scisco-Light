export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  const { contenu, monProduit } = req.body || {};
  if (!contenu || contenu.trim().length < 20) return res.status(400).json({ error: 'Décris la pub ou l\'activité du concurrent (au moins quelques phrases).' });

  const prompt = `Tu es un agent de renseignement marketing, expert du marché africain (Cameroun, zone FCFA). On te fournit les observations sur un concurrent. Produis un rapport de contre-attaque. Réponds UNIQUEMENT avec les 7 blocs suivants, chacun précédé exactement de son marqueur sur sa propre ligne, sans markdown ni commentaire :

###OFFRE_CONCURRENT### Décortique l'offre du concurrent : produit, prix, promesse, cible apparente
###PROMESSE### Sa promesse principale et ce qu'elle sous-entend (désir profond exploité)
###FAIBLESSES### Ses faiblesses et angles morts : ce qu'il ne dit pas, ce qu'il fait mal, les insatisfactions probables de ses clients
###FORCE_ADOPTER### Ses forces à adopter : ce qu'il fait bien et qu'il faut recopier intelligemment
###DIFFERENCIATION### Comment se différencier : 5 façons concrètes d'être meilleur, différent ou plus crédible que lui
###ATTAQUE### Plan d'attaque concret : 3 actions immédiates pour capter ses clients (offre, message, canal)
###CONTRE_SCRIPT### Un script vidéo de 30-45 sec (format UGC, scène par scène) qui positionne notre offre contre la sienne

Observations sur le concurrent : """${contenu}"""
Notre produit/service (si fourni) : """${monProduit || 'non précisé'}"""`;

  const erreurs = [];
  const messages = [{ role: 'user', content: prompt }];

  // 1) Groq (gratuit, rapide)
  const gqKey = process.env.GROQ_API_KEY;
  if (gqKey) {
    for (const g of ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']) {
      try {
        const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${gqKey}` },
          body: JSON.stringify({ model: g, messages })
        });
        const d = await r.json();
        const rep = d?.choices?.[0]?.message?.content;
        if (r.ok && rep) return res.status(200).json({ analyse: rep });
        erreurs.push('groq/' + g + ' (' + r.status + ')');
      } catch (e) { erreurs.push('groq/' + g + ' : ' + e.message); }
    }
  }

  // 2) Gemini (gratuit)
  const key = process.env.GEMINI_API_KEY;
  if (key) {
    for (const modele of ['gemini-3.8-flash', 'gemini-3.5-flash-lite']) {
      try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modele}:generateContent?key=${key}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const d = await r.json();
        if (r.ok && d?.candidates?.[0]?.content?.parts?.[0]?.text) {
          return res.status(200).json({ analyse: d.candidates[0].content.parts[0].text });
        }
        erreurs.push(modele + ' (' + r.status + ')');
      } catch (e) { erreurs.push(modele + ' : ' + e.message); }
    }
  }

  res.status(500).json({ error: 'Aucun service disponible. Détail : ' + erreurs.join(' | ') });
}
