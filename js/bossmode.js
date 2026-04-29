/**
 * bossmode.js — Modo Boss (Ctrl+B)
 * Tela fake de spreadsheet pra esconder o app
 */
var BossMode = (function() {
  var overlay = document.getElementById('bossOverlay');
  var grid = document.getElementById('bossGrid');
  var active = false;

  function generateData() {
    var months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    var deps = ['Produção','Manutenção','Qualidade','Logística','RH','TI','Financeiro','Compras'];

    var html = '<table>';
    html += '<tr><th></th><th>A</th><th>B</th><th>C</th><th>D</th><th>E</th><th>F</th></tr>';
    html += '<tr><td class="row-num">1</td><td style="font-weight:bold">Departamento</td><td style="font-weight:bold">Meta Q1</td><td style="font-weight:bold">Realizado</td><td style="font-weight:bold">%</td><td style="font-weight:bold">Status</td><td style="font-weight:bold">Obs</td></tr>';

    deps.forEach(function(dep, i) {
      var meta = Math.floor(Math.random() * 50000 + 20000);
      var real = Math.floor(meta * (0.7 + Math.random() * 0.5));
      var pct = Math.round((real / meta) * 100);
      var status = pct >= 100 ? '✅ Atingido' : pct >= 80 ? '🟡 Parcial' : '🔴 Abaixo';
      html += '<tr><td class="row-num">' + (i + 2) + '</td>';
      html += '<td>' + dep + '</td>';
      html += '<td>R$ ' + meta.toLocaleString() + '</td>';
      html += '<td>R$ ' + real.toLocaleString() + '</td>';
      html += '<td>' + pct + '%</td>';
      html += '<td>' + status + '</td>';
      html += '<td></td></tr>';
    });

    // Linhas vazias
    for (var j = deps.length + 2; j <= 25; j++) {
      html += '<tr><td class="row-num">' + j + '</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
    }

    html += '</table>';
    return html;
  }

  function show() {
    if (!overlay || !grid) return;
    grid.innerHTML = generateData();
    overlay.classList.add('visible');
    active = true;
    if (typeof Sounds !== 'undefined') Sounds.click();
  }

  function hide() {
    if (!overlay) return;
    overlay.classList.remove('visible');
    active = false;
    if (typeof Sounds !== 'undefined') Sounds.click();
  }

  function toggle() {
    if (active) hide();
    else show();
  }

  function isActive() { return active; }

  // Ctrl+B
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      toggle();
    }
  });

  return { show: show, hide: hide, toggle: toggle, isActive: isActive };
})();