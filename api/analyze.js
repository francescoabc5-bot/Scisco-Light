export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  const { texte } = req.body || {};
  if (!texte || texte.trim().length < 20) return res.status(400).json({ error: 'Décris ta pub ou ton produit (au moins quelques phrases).' });

  const prompt = `Tu es un consultant senior en marketing et stratégie commerciale, spécialiste du marché africain (Cameroun, zone FCFA). À partir du contenu fourni (pub, produit ou description d'activité), produis une analyse stratégique complète. Réponds UNIQUEMENT avec les 10 blocs suivants, chacun précédé exactement de son marqueur sur sa propre ligne, sans markdown ni commentaire :

###SECTEUR### Le domaine : secteur d'activité, taille approximative sur le marché local, tendances actuelles
###ACTEURS### Les acteurs : concurrents et acteurs en place, leurs positionnements
###DYNAMIQUES### Les dynamiques d'achat : ce qui dicte les décisions d'achat (prix, confiance, urgence, statut, bouche-à-oreille...)
###OFFRE### Analyse de l'offre de vente : décortique l'offre, forces/faiblesses, comment la reformuler sous le meilleur angle
###SEGMENT### Segment d'audience : à qui on s'adresse précisément et ce qui les motive VRAIMENT
###CONSCIENCE### Conscience du marché : stade de conscience du prospect et comment adapter le discours
###ANGLES### Angles marketing : les 5 angles les plus percutants, une par ligne
###SCRIPTS### Scripts pour vidéos : 2 scripts courts (30-45 sec, format UGC, scène par scène)
###MECANISME### Mécanisme de vente - Le mécanisme dominant : (confiance, démonstration, autorité, preuve sociale, urgence...) explique pourquoi et comment l'exploiter
###VOIR### Mécanisme de vente - Ce que le prospect doit voir + le type de vidéo recommandé (UGC, démo produit, témoignage, avatar...) avec justification

Contenu à analyser : """${texte}"""`;

  const erreurs = [];
  const messages = [{ role: 'user', content: prompt }];

  // 1) Groq (gratuit, très rapide) — compatible format OpenAI
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
