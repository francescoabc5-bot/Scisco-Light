export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  const { contenu, monProduit } = req.body || {};
  if (!contenu || contenu.trim().length < 20) return res.status(400).json({ error: 'Colle la pub ou le contenu du concurrent (au moins quelques phrases).' });

  const prompt = `Tu es un analyste concurrentiel spécialiste du marché africain (Cameroun, zone FCFA). Voici le contenu marketing d'un concurrent (pub, transcription de vidéo, post ou description). Produis une contre-analyse stratégique. Réponds UNIQUEMENT avec les 7 blocs suivants, chacun précédé exactement de son marqueur sur sa propre ligne, sans markdown ni commentaire :

###IDENTITE### Identité du concurrent : ce qu'il vend, à quel prix, à quelle cible, son positionnement apparent
###STRATEGIE### Sa stratégie de vente : le mécanisme persuasif utilisé (confiance, urgence, autorité, preuve sociale...), ses déclencheurs d'achat, sa structure de message
###FORCES### Ses forces : ce qui fonctionne bien dans sa communication et qu'il faut apprendre de lui
###FAIBLESSES### Ses faiblesses : ce qu'il fait mal ou oublie, les objections clients qu'il ne traite pas, les segments qu'il néglige
###ANGLES### Comment le battre : 5 angles concrets pour se différencier et capter SES clients, une par ligne
###SCRIPTS### Contre-attaque en vidéo : 2 scripts courts (30-45 sec, format UGC) qui utilisent ses faiblesses comme levier${monProduit ? ' en tenant compte de mon produit : """' + monProduit + '"""' : ''}
###PLAN### Plan d'action 7 jours : actions concrètes jour par jour pour exploiter ces découvertes

Contenu du concurrent : """${contenu}"""`;

  const erreurs = [];
  const messages = [{ role: 'user', content: prompt }];

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
