(function () {
  const CLE_VISITEUR = 'sciscoVisiteur', CLE_PROPRIO = 'sciscoProprio';
  let visiteur = localStorage.getItem(CLE_VISITEUR);
  if (!visiteur) { visiteur = 'v-' + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem(CLE_VISITEUR, visiteur); }
  let estProprio = localStorage.getItem(CLE_PROPRIO) === '1';

  // Activation proprio par lien spécial : tonsite.vercel.app/analyse.html?proprio=1
  const params = new URLSearchParams(location.search);
  if (params.get('proprio') === '1' && !estProprio) {
    const code = prompt('Code propriétaire :');
    if (code) {
      fetch('/api/limite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visiteur, code }) })
        .then(r => r.json()).then(d => {
          if (d.proprio) { localStorage.setItem(CLE_PROPRIO, '1'); alert('✅ Mode propriétaire activé : accès illimité.'); location.href = location.pathname; }
          else alert('❌ ' + (d.error || 'Code incorrect'));
        }).catch(() => alert('Erreur de connexion'));
    }
  }
  estProprio = localStorage.getItem(CLE_PROPRIO) === '1';

  window.sciscoVerifieLimite = async function () {
    if (estProprio) return { autorise: true, proprio: true };
    try {
      const r = await fetch('/api/limite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visiteur }) });
      return await r.json();
    } catch (e) { return { autorise: true }; }
  };
  window.sciscoAfficheLimite = function (reste) {
    if (estProprio) return;
    let b = document.getElementById('bandeauLimite');
    if (!b) { b = document.createElement('div'); b.id = 'bandeauLimite'; b.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#6c5ce7;color:#fff;text-align:center;padding:8px;font-size:13px;z-index:7000'; document.body.appendChild(b); }
    b.innerHTML = '🎁 Version gratuite : ' + reste + ' analyse(s) restante(s) aujourd\u2019hui · <a href="offres.html" style="color:#fff">Passer en illimité</a>';
  };
})();
