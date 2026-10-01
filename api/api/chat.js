export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  const { messages, modele } = req.body || {};
  if (!messages || !messages.length) return res.status(400).json({ error: 'Conversation vide.' });

  const erreurs = [];
  const m = modele || 'auto';

  // 1) ChatGPT (OpenAI) — clé OPENAI_API_KEY (sk-...)
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

  // 2) Claude (Anthropic) — clé ANTHROPIC_API_KEY (sk-ant-...)
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

  // 3) DeepSeek — clé DEEPSEEK_API_KEY (sk-...)
  if (m === 'deepseek' || m === 'auto') {
    const k = process.env.DEEPSEEK_API_KEY;
    if (k) {
      try {
        const r = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${k}` },
          body: JSON.stringify({ model: 'deepseek-chat', messages })
        });
        const d = await r.json();
        const rep = d?.choices?.[0]?.message?.content;
        if (r.ok && rep) return res.status(200).json({ reponse: rep, utilise: 'DeepSeek' });
        erreurs.push('deepseek (' + r.status + ')');
      } catch (e) { erreurs.push('deepseek : ' + e.message); }
    } else if (m === 'deepseek') return res.status(500).json({ error: 'Clé DEEPSEEK_API_KEY absente dans Vercel.' });
  }

  // 4) Gemini — GEMINI_API_KEY (déjà configurée)
  if (m === 'gemini' || m === 'auto') {
    const k = process.env.GEMINI_API_KEY;
    if (k) {
      const modeles = ['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash'];
      for (const g of modeles) {
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

  res.status(500).json({ error: 'Aucun modèle disponible. Ajoute au moins une clé dans Vercel (OPENAI_API_KEY, ANTHROPIC_API_KEY, DEEPSEEK_API_KEY ou GEMINI_API_KEY). Détail : ' + erreurs.join(' | ') });
          }
