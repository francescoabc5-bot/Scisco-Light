export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  const { message, modele, historique } = req.body || {};
  if (!message || message.trim().length === 0) return res.status(400).json({ error: 'Écris un message.' });

  const msgs = (historique || []).slice(-10).map(h => ({ role: h.role, content: String(h.content).slice(0, 4000) }));
  msgs.push({ role: 'user', content: String(message).slice(0, 4000) });

  // Liste des modèles disponibles selon les clés configurées
  const dispo = [];
  if (process.env.GEMINI_API_KEY) dispo.push('gemini');
  if (process.env.DEEPSEEK_API_KEY) dispo.push('deepseek');
  if (process.env.OPENAI_API_KEY) dispo.push('openai');
  if (process.env.ANTHROPIC_API_KEY) dispo.push('claude');
  if (req.method === 'POST' && req.body.liste) return res.status(200).json({ disponible: dispo });

  // Choix du modèle, avec secours automatique
  let ordre;
  if (modele && dispo.includes(modele)) ordre = [modele, ...dispo.filter(m => m !== modele)];
  else ordre = dispo;

  if (ordre.length === 0) return res.status(500).json({ error: 'Aucun modèle configuré. Ajoute au moins une clé API dans Vercel.' });

  const erreurs = [];
  for (const m of ordre) {
    try {
      let reponse = null;
      if (m === 'gemini') {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: msgs.map(x => ({ role: x.role === 'assistant' ? 'model' : 'user', parts: [{ text: x.content }] })) })
        });
        const d = await r.json();
        if (r.ok) reponse = d?.candidates?.[0]?.content?.parts?.[0]?.text; else erreurs.push('gemini ' + r.status);
      } else if (m === 'deepseek') {
        const r = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` },
          body: JSON.stringify({ model: 'deepseek-chat', messages: msgs })
        });
        const d = await r.json();
        if (r.ok) reponse = d?.choices?.[0]?.message?.content; else erreurs.push('deepseek ' + r.status);
      } else if (m === 'openai') {
        const r = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
          body: JSON.stringify({ model: 'gpt-4o-mini', messages: msgs })
        });
        const d = await r.json();
        if (r.ok) reponse = d?.choices?.[0]?.message?.content; else erreurs.push('openai ' + r.status);
      } else if (m === 'claude') {
        const r = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: 'claude-3-5-haiku-20241022', max_tokens: 2000, messages: msgs })
        });
        const d = await r.json();
        if (r.ok) reponse = d?.content?.[0]?.text; else erreurs.push('claude ' + r.status);
      }
      if (reponse) return res.status(200).json({ reponse, utilise: m });
    } catch (e) { erreurs.push(m + ' : ' + e.message); }
  }
  res.status(500).json({ error: 'Aucun modèle n\'a répondu. Détail : ' + erreurs.join(' | ') });
                                }
