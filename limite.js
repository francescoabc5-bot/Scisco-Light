(function () {
  const CLE_VISITEUR = 'sciscoVisiteur', CLE_PROPRIO = 'sciscoProprio';
  let visiteur = localStorage.getItem(CLE_VISITEUR);
  if (!visiteur) { visiteur = 'v-' + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem(CLE_VISITEUR, visiteur); }
  const estProprio = localStorage.getItem(CLE_PROPRIO) === '1';

  window.sciscoVerifieLimite = async function () {
    if (estProprio) return { autorise: true, proprio: true };
    try {
      const r = await fetch('/api/limite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visiteur }) });
      return await r.json();
    } catch (e) { return { autorise: true }; } // en cas d'erreur réseau, on laisse passer
  };
  window.sciscoDevenirProprio = async function () {
    const code = prompt('Code propriétaire :');
    if (!code) return false;
    try {
      const r = await fetch('/api/limite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visiteur, code }) });
      const d = await r.json();
      if (d.proprio) { localStorage.setItem(CLE_PROPRIO, '1'); alert('✅ Mode propriétaire activé : accès illimité.'); return true; }
      alert('❌ ' + (d.error || 'Code incorrect'));
    } catch (e) { alert('Erreur de connexion'); }
    return false;
  };
  window.sciscoAfficheLimite = function (reste) {
    if (estProprio) return;
    let bandeau = document.getElementById('bandeauLimite');
    if (!bandeau) {
      bandeau = document.createElement('div');
      bandeau.id = 'bandeauLimite';
      bandeau.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#6c5ce7;color:#fff;text-align:center;padding:8px;font-size:13px;z-index:7000';
      document.body.appendChild(bandeau);
    }
    bandeau.textContent = '🎁 Version gratuite : ' + reste + ' analyse(s) restante(s) aujourd\u2019hui · <u style="cursor:pointer" onclick="location.href=\'offres.html\'">Passer en illimité</u>'.replace('<u', '<a').replace('</u>', '</a>').replace(/<u[^>]*>/, '<a href="offres.html" style="color:#fff">').replace('</u>', '</a>');
  };
})();
