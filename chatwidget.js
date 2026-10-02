(function () {
(function () {
  const CSS = `
.cw-btn{position:fixed;bottom:20px;right:20px;width:56px;height:56px;border-radius:50%;background:#6c5ce7;color:#fff;border:none;font-size:24px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.5);z-index:9998}
.cw-btn:hover{background:#8b7cf7}
.cw-panel{position:fixed;bottom:86px;right:20px;width:92%;max-width:380px;height:70vh;max-height:560px;background:#121212;border:1px solid #2e2e2e;border-radius:16px;display:none;flex-direction:column;z-index:9999;overflow:hidden}
.cw-panel.open{display:flex}
.cw-head{background:#1a1a1a;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #2e2e2e}
.cw-head b{font-size:14px}.cw-head span{color:#a78bfa;font-size:11px;display:block}
.cw-fermer{background:none;border:none;color:#aaa;font-size:18px;cursor:pointer}
.cw-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}
.cw-m{max-width:88%;padding:10px 13px;border-radius:12px;font-size:13px;white-space:pre-wrap;word-wrap:break-word;line-height:1.5}
.cw-user{align-self:flex-end;background:#6c5ce7;color:#fff}
.cw-bot{align-self:flex-start;background:#1a1a1a;border:1px solid #2e2e2e;color:#ccc}
.cw-foot{padding:10px;border-top:1px solid #2e2e2e;display:flex;gap:8px}
.cw-input{flex:1;background:#0d0d0d;border:1px solid #2e2e2e;color:#fff;border-radius:10px;padding:10px;font-family:inherit;font-size:13px}
.cw-env{background:#6c5ce7;color:#fff;border:none;border-radius:10px;padding:10px 14px;cursor:pointer;font-weight:bold}
.cw-vide{color:#888;font-size:12px;text-align:center;margin:auto}
`;
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);

  const CLE = 'chatSciscoHistorique';
  let historique = [];
  try { historique = JSON.parse(localStorage.getItem(CLE) || '[]'); } catch (e) { historique = []; }
  function sauver() { try { localStorage.setItem(CLE, JSON.stringify(historique.slice(-40))); } catch (e) {} }

  const btn = document.createElement('button'); btn.className = 'cw-btn'; btn.textContent = '💬'; btn.title = 'Assistant IA';
  const panel = document.createElement('div'); panel.className = 'cw-panel';
  panel.innerHTML = `
    <div class="cw-head"><div><b>Assistant IA</b><span id="cw-ctx"></span></div><button class="cw-fermer">✕</button></div>
    <div class="cw-msgs" id="cw-msgs"></div>
    <div class="cw-foot"><input class="cw-input" id="cw-input" placeholder="Pose ta question…"><button class="cw-env" id="cw-env">➤</button></div>`;
  document.body.appendChild(btn); document.body.appendChild(panel);

  const msgs = panel.querySelector('#cw-msgs'), input = panel.querySelector('#cw-input');
  const ctx = (document.querySelector('h2') && document.querySelector('h2').textContent.trim()) || document.title;
  panel.querySelector('#cw-ctx').textContent = 'Contexte : ' + ctx;

  function bulle(texte, qui) {
    const d = document.createElement('div'); d.className = 'cw-m cw-' + qui; d.textContent = texte;
    msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight;
    return d; // ← CORRECTION : on renvoie l'élément
  }
  function afficherHistorique() {
    msgs.innerHTML = '';
    if (!historique.length) { msgs.innerHTML = '<div class="cw-vide">Pose ta question — l\'assistant connaît le contexte de cette page.</div>'; return; }
    historique.forEach(h => bulle(h.content, h.role === 'user' ? 'user' : 'bot'));
  }
  btn.onclick = () => { panel.classList.toggle('open'); if (panel.classList.contains('open')) { afficherHistorique(); input.focus(); } };
  panel.querySelector('.cw-fermer').onclick = () => panel.classList.remove('open');

  async function envoyer() {
    const t = input.value.trim(); if (!t) return;
    input.value = '';
    bulle(t, 'user');
    historique.push({ role: 'user', content: t });
    const bot = bulle('…', 'bot');
    try {
      const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'system', content: 'Tu es l\'assistant de Scisco Studio. Contexte de la page : ' + ctx + '. Réponds en français.' }, ...historique.slice(-12)] }) });
      const d = await r.json();
      if (d.reponse) { bot.textContent = d.reponse; historique.push({ role: 'assistant', content: d.reponse }); }
      else bot.textContent = '⚠️ ' + (d.error || 'Erreur');
    } catch (e) { bot.textContent = '⚠️ Erreur de connexion : ' + e.message; }
    sauver(); msgs.scrollTop = msgs.scrollHeight;
  }
  panel.querySelector('#cw-env').onclick = envoyer;
  input.addEventListener('keydown', e => { if (e.key === 'Enter') envoyer(); });
})();
