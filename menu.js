(function () {
  const CSS = `
.ov{position:fixed;inset:0;background:rgba(0,0,0,.65);display:none;z-index:9000}
.dr{position:fixed;top:0;left:0;bottom:0;width:80%;max-width:320px;background:#121212;border-radius:0 18px 18px 0;overflow-y:auto;padding:20px 14px;z-index:9100;display:none}
.dr.open,.ov.open{display:block}
.dh{display:flex;align-items:center;gap:12px;margin-bottom:18px}
.dh .sq{width:42px;height:42px;background:#6c5ce7;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:20px;color:#fff}
.dh .t{font-weight:bold;color:#fff}.dh .s{color:#aaa;font-size:13px}
.cat{color:#aaa;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:16px 0 8px;padding-left:8px}
.it{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:22px;color:#eee;text-decoration:none;font-size:15px}
.it:hover{background:#242424}
.it.actif{background:#2c2c2c}
.bg{position:fixed;top:16px;left:16px;width:44px;height:44px;background:#1a1a1a;border:1px solid #2e2e2e;border-radius:12px;color:#fff;font-size:20px;cursor:pointer;z-index:8000}
`;
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

  const DEFAUT = [
    { cat: 'Menu principal', items: [ ['🏷️','Analyse Offre','analyse.html'], ['👥','Segmentation','analyse.html'], ['🎯','Conscience','analyse.html'], ['⚡','Angles','analyse.html'] ] },
    { cat: 'Création', items: [ ['▦','Studio','app.html'], ['🧠','Marketing IA','marketing.html'], ['🕵️','Espion concurrent','espion.html'], ['🔍','Analyse Marketing','analyse.html'], ['💬','Chat IA','chat.html'] ] },
    { cat: 'Bibliothèque', items: [ ['📁','Mes projets','projets.html'], ['🖼️','Galerie','exemples.html'], ['📄','Scripts','exemples.html'] ] },
    { cat: 'Compte', items: [ ['⚙️','Paramètres','faq.html'] ] }
  ];
  const sections = window.MENU_PAGE || DEFAUT;

  const ov = document.createElement('div'); ov.className = 'ov';
  const dr = document.createElement('div'); dr.className = 'dr';
  let html = '<div class="dh"><div class="sq">S</div><div><div class="t">Scisco Studio</div><div class="s">Marketing OS</div></div></div>';
  html += '<a class="it" href="analyse.html" style="border:1px solid #333;border-radius:12px;margin-bottom:10px">✨ <b>Nouveau projet</b>&nbsp;<span style="color:#aaa;font-size:12px">Analyser un produit</span></a>';
  sections.forEach(s => {
    html += '<div class="cat">' + s.cat + '</div>';
    s.items.forEach(it => { html += '<a class="it" href="' + it[2] + '"><span style="width:22px;text-align:center">' + it[0] + '</span>' + it[1] + '</a>'; });
  });
  dr.innerHTML = html;
  document.body.appendChild(ov); document.body.appendChild(dr);
  const burger = document.createElement('button'); burger.className = 'bg'; burger.textContent = '☰';
  document.body.appendChild(burger);
  burger.onclick = () => { dr.classList.add('open'); ov.classList.add('open'); };
  ov.onclick = () => { dr.classList.remove('open'); ov.classList.remove('open'); };
})();
