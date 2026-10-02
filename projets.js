(function () {
  window.sciscoSauverProjet = function (titre, type, htmlResultat) {
    try {
      const CLE = 'sciscoProjets';
      const projets = JSON.parse(localStorage.getItem(CLE) || '[]');
      projets.unshift({ id: Date.now(), date: new Date().toLocaleString('fr-FR'), titre: titre.slice(0, 80), type, html: htmlResultat.slice(0, 500000) });
      localStorage.setItem(CLE, JSON.stringify(projets.slice(-50)));
    } catch (e) {}
  };
  window.sciscoProjetsListe = function () {
    try { return JSON.parse(localStorage.getItem('sciscoProjets') || '[]'); } catch (e) { return []; }
  };
  window.sciscoSupprimerProjet = function (id) {
    const projets = window.sciscoProjetsListe().filter(p => p.id !== id);
    try { localStorage.setItem('sciscoProjets', JSON.stringify(projets)); } catch (e) {}
  };
})();
