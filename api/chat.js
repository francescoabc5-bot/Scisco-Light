export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  const { messages, modele } = req.body || {};
  if (!messages || !messages.length) return res.status(400).json({ error: 'Conversation vide.' });

  const erreurs = [];
  const m = modele || 'auto';

  // 1) Groq (gratuit) — llama 70B ou 8B
  if (m === 'groq' || m === 'deepseek' || m === 'auto') {
    const k = process.env.GROQ_API_KEY;
    if (k) {
      for (const g of ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']) {
        try {
          const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${k}` },
            body: JSON.stringify({ model: g, messages })
          });
          const d = await r.json();
          const rep = d?.choices?.[0]?.message?.content;
          if (r.ok && rep) return res.status(200).json({ reponse: rep, utilise: 'Groq (' + g + ')' });
          erreurs.push('groq/' + g + ' (' + r.status + ')');
        } catch (e) { erreurs.push('groq/' + g + ' : ' + e.message); }
      }
    } else if (m === 'groq') return res.status(500).json({ error: 'Clé GROQ_API_KEY absente dans Vercel.' });
  }

  // 2) ChatGPT (si clé payante ajoutée plus tard)
  if (m === 'chatgpt' || m === 'auto') {
    const k = process.env.OPENAI_API_KEY;
    if (k) {
      try {
        const r = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${k}` },
          body: JSON.stringify({ model: 'gpt-4o-mini', messages })
        });
        const d = await r.json();
        const rep = d?.choices?.[0]?.message?.content;
        if (r.ok && rep) return res.status(200).json({ reponse: rep, utilise: 'ChatGPT' });
        erreurs.push('chatgpt (' + r.status + ')');
      } catch (e) { erreurs.push('chatgpt : ' + e.message); }
    } else if (m === 'chatgpt') return res.status(500).json({ error: 'Clé OPENAI_API_KEY absente dans Vercel.' });
  }

  // 3) Claude (si clé payante ajoutée plus tard)
  if (m === 'claude' || m === 'auto') {
    const k = process.env.ANTHROPIC_API_KEY;
    if (k) {
      try {
        const r = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': k, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: 'claude-3-5-haiku-20241022', max_tokens: 2000, messages })
        });
        const d = await r.json();
        const rep = d?.content?.[0]?.text;
        if (r.ok && rep) return res.status(200).json({ reponse: rep, utilise: 'Claude' });
        erreurs.push('claude (' + r.status + ')');
      } catch (e) { erreurs.push('claude : ' + e.message); }
    } else if (m === 'claude') return res.status(500).json({ error: 'Clé ANTHROPIC_API_KEY absente dans Vercel.' });
  }

  // 4) Gemini (gratuit, déjà en place)
  if (m === 'gemini' || m === 'auto') {
    const k = process.env.GEMINI_API_KEY;
    if (k) {
      for (const g of ['gemini-3.8-flash', 'gemini-3.5-flash-lite']) {
        try {
          const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${g}:generateContent?key=${k}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: messages.map(x => ({ role: x.role === 'assistant' ? 'model' : 'user', parts: [{ text: x.content }] })) })
          });
          const d = await r.json();
          const rep = d?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (r.ok && rep) return res.status(200).json({ reponse: rep, utilise: 'Gemini' });
          erreurs.push(g + ' (' + r.status + ')');
        } catch (e) { erreurs.push(g + ' : ' + e.message); }
      }
    }
  }

  res.status(500).json({ error: 'Aucun modèle disponible. Détail : ' + erreurs.join(' | ') });
}
