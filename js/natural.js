/**
 * natural.js — Parser de linguagem natural
 * Detecta data, hora, prioridade e categoria do texto
 */
const NaturalLanguage = (() => {
  const preview = document.getElementById('nlPreview');
  const taskInput = document.getElementById('taskInput');

  // Mapeamentos
  const prioridades = {
    'alta': 'alta', 'urgente': 'alta', 'importante': 'alta', 'crítico': 'alta', 'critico': 'alta',
    'média': 'media', 'media': 'media', 'normal': 'media',
    'baixa': 'baixa', 'tranquilo': 'baixa', 'relax': 'baixa'
  };

  const categorias = {
    'trabalho': 'trabalho', 'work': 'trabalho', 'job': 'trabalho',
    'pessoal': 'pessoal', 'personal': 'pessoal',
    'estudo': 'estudo', 'estudar': 'estudo', 'study': 'estudo',
    'manutenção': 'manutenção', 'manutencao': 'manutenção', 'maint': 'manutenção',
    'reunião': 'reunião', 'reuniao': 'reunião', 'meeting': 'reunião'
  };

  const diasSemana = {
    'segunda': 1, 'terça': 2, 'terca': 2, 'quarta': 3,
    'quinta': 4, 'sexta': 5, 'sábado': 6, 'sabado': 6, 'domingo': 0,
    'seg': 1, 'ter': 2, 'qua': 3, 'qui': 4, 'sex': 5, 'sab': 6, 'dom': 0
  };

  function parse(text) {
    const original = text;
    let cleanText = text;
    const result = {
      text: '',
      dueDate: '',
      dueTime: '',
      priority: '',
      category: '',
      estimate: 0,
      detected: []
    };

    const lower = text.toLowerCase();

    // === DETECTAR DATA ===
    const today = new Date();

    // "hoje"
    if (lower.includes('hoje')) {
      result.dueDate = formatDate(today);
      result.detected.push('hoje');
      cleanText = cleanText.replace(/\bhoje\b/gi, '');
    }

    // "amanhã"
    if (lower.includes('amanhã') || lower.includes('amanha')) {
      const d = new Date(today);
      d.setDate(d.getDate() + 1);
      result.dueDate = formatDate(d);
      result.detected.push('amanhã');
      cleanText = cleanText.replace(/\bamanh[aã]\b/gi, '');
    }

    // "depois de amanhã"
    if (lower.includes('depois de amanhã') || lower.includes('depois de amanha')) {
      const d = new Date(today);
      d.setDate(d.getDate() + 2);
      result.dueDate = formatDate(d);
      result.detected.push('depois de amanhã');
      cleanText = cleanText.replace(/depois de amanh[aã]/gi, '');
    }

    // "próxima segunda", "na sexta", etc
    Object.keys(diasSemana).forEach(dia => {
      const re = new RegExp('\\b(na |próxima |proxima |nessa |nesta )?' + dia + '\\b', 'gi');
      if (re.test(lower) && !result.dueDate) {
        const target = diasSemana[dia];
        const d = new Date(today);
        let diff = target - d.getDay();
        if (diff <= 0) diff += 7;
        d.setDate(d.getDate() + diff);
        result.dueDate = formatDate(d);
        result.detected.push(dia);
        cleanText = cleanText.replace(re, '');
      }
    });

    // "em X dias"
    const emDias = lower.match(/em (\d+) dias?/);
    if (emDias && !result.dueDate) {
      const d = new Date(today);
      d.setDate(d.getDate() + parseInt(emDias[1]));
      result.dueDate = formatDate(d);
      result.detected.push('em ' + emDias[1] + ' dias');
      cleanText = cleanText.replace(/em \d+ dias?/gi, '');
    }

    // Data DD/MM ou DD/MM/YYYY
    const dateMatch = text.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
    if (dateMatch && !result.dueDate) {
      const day = parseInt(dateMatch[1]);
      const month = parseInt(dateMatch[2]) - 1;
      const year = dateMatch[3] ? (dateMatch[3].length === 2 ? 2000 + parseInt(dateMatch[3]) : parseInt(dateMatch[3])) : today.getFullYear();
      const d = new Date(year, month, day);
      result.dueDate = formatDate(d);
      result.detected.push(dateMatch[0]);
      cleanText = cleanText.replace(dateMatch[0], '');
    }

    // === DETECTAR HORA ===
    // "14h", "14:30", "às 14h", "14h30"
    const horaMatch = text.match(/(?:às?\s*)?(\d{1,2})[h:](\d{2})?\s*(?:h)?/i);
    if (horaMatch) {
      const h = parseInt(horaMatch[1]);
      const m = horaMatch[2] ? parseInt(horaMatch[2]) : 0;
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        result.dueTime = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
        result.detected.push(horaMatch[0].trim());
        cleanText = cleanText.replace(horaMatch[0], '');
      }
    }

    // === DETECTAR PRIORIDADE ===
    Object.keys(prioridades).forEach(key => {
      const re = new RegExp('\\b' + key + '\\b', 'gi');
      if (re.test(lower) && !result.priority) {
        result.priority = prioridades[key];
        result.detected.push(key);
        cleanText = cleanText.replace(re, '');
      }
    });

    // === DETECTAR CATEGORIA ===
    Object.keys(categorias).forEach(key => {
      const re = new RegExp('\\b' + key + '\\b', 'gi');
      if (re.test(lower) && !result.category) {
        result.category = categorias[key];
        result.detected.push(key);
        cleanText = cleanText.replace(re, '');
      }
    });

    // === DETECTAR ESTIMATIVA ===
    // "~2h", "2 horas", "30min", "30 minutos"
    const estHoras = text.match(/~?(\d+)\s*h(?:oras?)?/i);
    const estMin = text.match(/~?(\d+)\s*min(?:utos?)?/i);
    if (estHoras) {
      result.estimate = parseInt(estHoras[1]) * 60;
      if (estMin) result.estimate += parseInt(estMin[1]);
      result.detected.push(estHoras[0].trim());
      cleanText = cleanText.replace(estHoras[0], '');
    } else if (estMin) {
      result.estimate = parseInt(estMin[1]);
      result.detected.push(estMin[0].trim());
      cleanText = cleanText.replace(estMin[0], '');
    }

    // Limpar texto
    result.text = cleanText.replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '').replace(/^[-–,;:.\s]+|[-–,;:.\s]+$/g, '').trim();

    return result;
  }

  function formatDate(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function formatDateBR(d) {
    if (!d) return '';
    const dt = new Date(d + 'T00:00:00');
    return String(dt.getDate()).padStart(2, '0') + '/' + String(dt.getMonth() + 1).padStart(2, '0') + '/' + dt.getFullYear();
  }

  function showPreview(result) {
    if (!preview) return;
    if (!result.detected.length) {
      preview.classList.remove('visible');
      return;
    }

    let html = '';
    if (result.text) html += '<div class="nl-row"><span class="nl-label">📋 Tarefa:</span><span class="nl-value">' + escHtml(result.text) + '</span></div>';
    if (result.dueDate) html += '<div class="nl-row"><span class="nl-label">📅 Data:</span><span class="nl-value detected">' + formatDateBR(result.dueDate) + '</span></div>';
    if (result.dueTime) html += '<div class="nl-row"><span class="nl-label">⏰ Hora:</span><span class="nl-value detected">' + result.dueTime + '</span></div>';
    if (result.priority) html += '<div class="nl-row"><span class="nl-label">⚡ Prior:</span><span class="nl-value detected p-' + result.priority + '">' + result.priority.toUpperCase() + '</span></div>';
    if (result.category) html += '<div class="nl-row"><span class="nl-label">📁 Cat:</span><span class="nl-value detected">' + result.category + '</span></div>';
    if (result.estimate) {
      const h = Math.floor(result.estimate / 60);
      const m = result.estimate % 60;
      html += '<div class="nl-row"><span class="nl-label">📏 Estim:</span><span class="nl-value detected">' + (h > 0 ? h + 'h' : '') + (m > 0 ? m + 'min' : '') + '</span></div>';
    }

    preview.innerHTML = html;
    preview.classList.add('visible');
  }

  function hidePreview() {
    if (preview) preview.classList.remove('visible');
  }

  function escHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  // === BIND ===
  if (taskInput) {
    let debounce = null;
    taskInput.addEventListener('input', () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => {
        const text = taskInput.value.trim();
        if (text.length > 3) {
          const result = parse(text);
          showPreview(result);
        } else {
          hidePreview();
        }
      }, 300);
    });
  }

  return { parse, hidePreview };
})();