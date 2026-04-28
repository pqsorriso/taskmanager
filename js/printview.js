/**
 * printview.js — Impressão formatada
 */
const PrintView = (() => {
  function print() {
    const tasks = TaskManager.getAll();
    const pending = tasks.filter(t => !t.done);
    const alta = pending.filter(t => t.priority === 'alta').length;
    const media = pending.filter(t => t.priority === 'media').length;
    const baixa = pending.filter(t => t.priority === 'baixa').length;

    const now = new Date();
    const dateStr = String(now.getDate()).padStart(2, '0') + '/' +
                    String(now.getMonth() + 1).padStart(2, '0') + '/' +
                    now.getFullYear() + ' ' +
                    String(now.getHours()).padStart(2, '0') + ':' +
                    String(now.getMinutes()).padStart(2, '0');

    const printDate = document.getElementById('printDate');
    if (printDate) printDate.textContent = 'Data: ' + dateStr + '  |  Gustavo Nogueira — GM Joinville';

    const printInfo = document.getElementById('printInfo');
    if (printInfo) printInfo.textContent = 'Total: ' + pending.length + ' pendentes | ' + alta + ' alta | ' + media + ' média | ' + baixa + ' baixa';

    // Expandir todas as subtarefas e descrições pra impressão
    document.querySelectorAll('.subtask-expand').forEach(el => el.classList.add('visible'));
    document.querySelectorAll('.task-desc-row').forEach(el => el.classList.add('visible'));

    window.print();

    // Restaurar após imprimir
    setTimeout(() => {
      document.querySelectorAll('.subtask-expand').forEach(el => el.classList.remove('visible'));
      document.querySelectorAll('.task-desc-row').forEach(el => el.classList.remove('visible'));
    }, 1000);
  }

  // Bind
  const btnPrint = document.getElementById('btnPrint');
  if (btnPrint) btnPrint.addEventListener('click', print);

  const btnFocus = document.getElementById('btnFocus');
  if (btnFocus) btnFocus.addEventListener('click', () => {
    if (typeof FocusMode !== 'undefined') FocusMode.open();
  });

  return { print };
})();