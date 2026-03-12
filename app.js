(() => {
  'use strict';

  // ── Storage ──────────────────────────────────────────────────
  const STORAGE_KEY = 'ocounter';

  const DEFAULT_CATEGORIES = [
    { id: crypto.randomUUID(), name: 'Masturbation', color: '#6c5ce7' },
    { id: crypto.randomUUID(), name: 'Pool-Handjob', color: '#00cec9' },
    { id: crypto.randomUUID(), name: 'Handjob', color: '#fdcb6e' },
    { id: crypto.randomUUID(), name: 'Sex', color: '#e84393' },
  ];

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { categories: DEFAULT_CATEGORIES, entries: [] };
  }

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  let data = loadData();

  // ── DOM refs ─────────────────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ── Navigation ───────────────────────────────────────────────
  $$('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.nav-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      $$('.view').forEach((v) => v.classList.remove('active'));
      $(`#view-${btn.dataset.view}`).classList.add('active');
      if (btn.dataset.view === 'stats') renderStats();
      if (btn.dataset.view === 'calendar') renderCalendar();
      if (btn.dataset.view === 'settings') renderSettings();
    });
  });

  // ── Category Buttons (Log View) ──────────────────────────────
  function renderCategoryButtons() {
    const container = $('#category-buttons');
    container.innerHTML = '';
    data.categories.forEach((cat) => {
      const btn = document.createElement('button');
      btn.className = 'cat-btn';
      btn.innerHTML = `<span class="cat-dot" style="background:${cat.color}"></span>${cat.name}`;
      btn.style.borderColor = cat.color + '44';
      btn.addEventListener('click', () => {
        addEntry(cat.id);
        btn.classList.add('logged');
        setTimeout(() => btn.classList.remove('logged'), 400);
      });
      container.appendChild(btn);
    });
  }

  // ── Entries CRUD ─────────────────────────────────────────────
  function addEntry(categoryId) {
    data.entries.push({
      id: crypto.randomUUID(),
      categoryId,
      timestamp: new Date().toISOString(),
      note: '',
    });
    saveData();
    renderEntryList();
  }

  function deleteEntry(id) {
    data.entries = data.entries.filter((e) => e.id !== id);
    saveData();
    renderEntryList();
  }

  function updateEntry(id, updates) {
    const entry = data.entries.find((e) => e.id === id);
    if (entry) Object.assign(entry, updates);
    saveData();
  }

  function getCategoryById(id) {
    return data.categories.find((c) => c.id === id);
  }

  // ── Entry List ───────────────────────────────────────────────
  function renderEntryList(targetList, entriesToShow) {
    const list = targetList || $('#entry-list');
    const filterCat = targetList ? '' : $('#filter-category').value;
    const filterDate = targetList ? '' : $('#filter-date').value;

    let entries = entriesToShow || [...data.entries];
    if (filterCat) entries = entries.filter((e) => e.categoryId === filterCat);
    if (filterDate) {
      entries = entries.filter((e) => e.timestamp.startsWith(filterDate));
    }

    entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (entries.length === 0) {
      list.innerHTML = '<li class="empty-state">Keine Eintr\u00e4ge vorhanden.</li>';
      return;
    }

    list.innerHTML = entries
      .map((e) => {
        const cat = getCategoryById(e.categoryId);
        const color = cat ? cat.color : '#666';
        const name = cat ? cat.name : 'Unbekannt';
        const d = new Date(e.timestamp);
        const dateStr = d.toLocaleDateString('de-DE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
        const timeStr = d.toLocaleTimeString('de-DE', {
          hour: '2-digit',
          minute: '2-digit',
        });
        return `
        <li class="entry-item" data-id="${e.id}">
          <span class="entry-dot" style="background:${color}"></span>
          <div class="entry-info">
            <div class="entry-cat">${name}</div>
            <div class="entry-date">${dateStr} ${timeStr}</div>
            ${e.note ? `<div class="entry-note">${e.note}</div>` : ''}
          </div>
          <div class="entry-actions">
            <button class="btn-edit" data-id="${e.id}" title="Bearbeiten">&#9998;</button>
            <button class="btn-delete" data-id="${e.id}" title="L\u00f6schen">&#10005;</button>
          </div>
        </li>`;
      })
      .join('');

    list.querySelectorAll('.btn-edit').forEach((btn) => {
      btn.addEventListener('click', () => openEditModal(btn.dataset.id));
    });
    list.querySelectorAll('.btn-delete').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (confirm('Eintrag wirklich l\u00f6schen?')) {
          deleteEntry(btn.dataset.id);
          // Re-render day modal if open
          if (!$('#day-modal').hidden) {
            const title = $('#day-modal-title').textContent;
            // Refresh shown entries
          }
        }
      });
    });
  }

  // Filter controls
  function renderFilterDropdown() {
    const sel = $('#filter-category');
    const val = sel.value;
    sel.innerHTML = '<option value="">Alle Kategorien</option>';
    data.categories.forEach((cat) => {
      sel.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
    });
    sel.value = val;
  }

  $('#filter-category').addEventListener('change', () => renderEntryList());
  $('#filter-date').addEventListener('change', () => renderEntryList());
  $('#filter-clear').addEventListener('click', () => {
    $('#filter-category').value = '';
    $('#filter-date').value = '';
    renderEntryList();
  });

  // ── Edit Modal ───────────────────────────────────────────────
  let editingEntryId = null;

  function openEditModal(id) {
    const entry = data.entries.find((e) => e.id === id);
    if (!entry) return;
    editingEntryId = id;

    const sel = $('#edit-category');
    sel.innerHTML = data.categories
      .map((c) => `<option value="${c.id}">${c.name}</option>`)
      .join('');
    sel.value = entry.categoryId;

    const dt = new Date(entry.timestamp);
    const pad = (n) => String(n).padStart(2, '0');
    $('#edit-datetime').value = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
    $('#edit-note').value = entry.note || '';

    $('#edit-modal').hidden = false;
  }

  $('#edit-save').addEventListener('click', () => {
    if (!editingEntryId) return;
    const newCat = $('#edit-category').value;
    const newDt = $('#edit-datetime').value;
    const newNote = $('#edit-note').value.trim();
    updateEntry(editingEntryId, {
      categoryId: newCat,
      timestamp: new Date(newDt).toISOString(),
      note: newNote,
    });
    $('#edit-modal').hidden = true;
    editingEntryId = null;
    renderEntryList();
  });

  $('#edit-cancel').addEventListener('click', () => {
    $('#edit-modal').hidden = true;
    editingEntryId = null;
  });

  $('#edit-modal').addEventListener('click', (e) => {
    if (e.target === $('#edit-modal')) {
      $('#edit-modal').hidden = true;
      editingEntryId = null;
    }
  });

  // ── Statistics ───────────────────────────────────────────────
  let pieChart = null;

  function getFilteredEntries(period) {
    const now = new Date();
    return data.entries.filter((e) => {
      if (period === 'all') return true;
      const d = new Date(e.timestamp);
      if (period === 'month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      if (period === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return d >= weekAgo;
      }
      return true;
    });
  }

  function renderStats() {
    const activePeriod =
      $('.period-btn.active')?.dataset.period || 'all';
    const entries = getFilteredEntries(activePeriod);

    const counts = {};
    data.categories.forEach((c) => (counts[c.id] = 0));
    entries.forEach((e) => {
      if (counts[e.categoryId] !== undefined) counts[e.categoryId]++;
    });

    const labels = [];
    const values = [];
    const colors = [];
    data.categories.forEach((c) => {
      if (counts[c.id] > 0) {
        labels.push(c.name);
        values.push(counts[c.id]);
        colors.push(c.color);
      }
    });

    if (pieChart) pieChart.destroy();

    const ctx = $('#pie-chart').getContext('2d');

    if (values.length === 0) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.fillStyle = '#8888aa';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Keine Daten vorhanden.', ctx.canvas.width / 2, ctx.canvas.height / 2);
      $('#stats-summary').innerHTML = '';
      return;
    }

    pieChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: colors,
            borderColor: '#0f0f13',
            borderWidth: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#e8e8f0', padding: 16, font: { size: 13 } },
          },
        },
      },
    });

    const total = values.reduce((a, b) => a + b, 0);
    let summaryHtml = `
      <div class="stat-card">
        <div class="stat-num">${total}</div>
        <div class="stat-label">Gesamt</div>
      </div>`;
    data.categories.forEach((c) => {
      summaryHtml += `
        <div class="stat-card">
          <div class="stat-num" style="color:${c.color}">${counts[c.id] || 0}</div>
          <div class="stat-label">${c.name}</div>
        </div>`;
    });
    $('#stats-summary').innerHTML = summaryHtml;
  }

  $$('.period-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.period-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderStats();
    });
  });

  // ── Calendar ─────────────────────────────────────────────────
  let calYear, calMonth;
  const now = new Date();
  calYear = now.getFullYear();
  calMonth = now.getMonth();

  const MONTHS_DE = [
    'Januar', 'Februar', 'M\u00E4rz', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
  ];

  function renderCalendar() {
    $('#cal-title').textContent = `${MONTHS_DE[calMonth]} ${calYear}`;

    const firstDay = new Date(calYear, calMonth, 1);
    let startDow = firstDay.getDay(); // 0=Sun
    startDow = startDow === 0 ? 6 : startDow - 1; // Mon=0

    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Group entries by date
    const byDate = {};
    data.entries.forEach((e) => {
      const d = e.timestamp.substring(0, 10);
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push(e);
    });

    let html = '';
    for (let i = 0; i < startDow; i++) {
      html += '<div class="cal-day empty"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEntries = byDate[dateStr] || [];
      const isToday = dateStr === todayStr;

      let inner = `<span>${day}</span>`;
      if (dayEntries.length > 0) {
        inner += `<span class="cal-count">${dayEntries.length}</span>`;
        const dots = dayEntries
          .slice(0, 5)
          .map((e) => {
            const cat = getCategoryById(e.categoryId);
            return `<span class="cal-dot-mini" style="background:${cat ? cat.color : '#666'}"></span>`;
          })
          .join('');
        inner += `<div class="cal-dots">${dots}</div>`;
      }

      html += `<div class="cal-day${isToday ? ' today' : ''}" data-date="${dateStr}">${inner}</div>`;
    }

    $('#cal-days').innerHTML = html;

    // Click on day to see entries
    $$('.cal-day:not(.empty)').forEach((el) => {
      el.addEventListener('click', () => {
        const date = el.dataset.date;
        const entries = byDate[date] || [];
        if (entries.length === 0) return;

        const d = new Date(date + 'T00:00:00');
        $('#day-modal-title').textContent = d.toLocaleDateString('de-DE', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        renderEntryList($('#day-modal-list'), entries);
        $('#day-modal').hidden = false;
      });
    });
  }

  $('#cal-prev').addEventListener('click', () => {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCalendar();
  });

  $('#cal-next').addEventListener('click', () => {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendar();
  });

  $('#day-modal-close').addEventListener('click', () => {
    $('#day-modal').hidden = true;
  });

  $('#day-modal').addEventListener('click', (e) => {
    if (e.target === $('#day-modal')) $('#day-modal').hidden = true;
  });

  // ── Settings ─────────────────────────────────────────────────
  function renderSettings() {
    const list = $('#category-list');
    list.innerHTML = data.categories
      .map(
        (c) => `
      <li class="cat-manage-item" data-id="${c.id}">
        <span class="cat-color-preview" style="background:${c.color}"></span>
        <input type="text" value="${c.name}" data-field="name" data-id="${c.id}">
        <input type="color" value="${c.color}" data-field="color" data-id="${c.id}">
        <button data-delete="${c.id}" title="L\u00f6schen">&#10005;</button>
      </li>`
      )
      .join('');

    // Inline editing
    list.querySelectorAll('input[data-field="name"]').forEach((inp) => {
      inp.addEventListener('change', () => {
        const cat = getCategoryById(inp.dataset.id);
        if (cat) {
          cat.name = inp.value.trim() || cat.name;
          saveData();
          renderCategoryButtons();
          renderFilterDropdown();
        }
      });
    });

    list.querySelectorAll('input[data-field="color"]').forEach((inp) => {
      inp.addEventListener('input', () => {
        const cat = getCategoryById(inp.dataset.id);
        if (cat) {
          cat.color = inp.value;
          saveData();
          inp.previousElementSibling.previousElementSibling.style.background = inp.value;
          renderCategoryButtons();
        }
      });
    });

    list.querySelectorAll('button[data-delete]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.delete;
        const cat = getCategoryById(id);
        if (!cat) return;
        if (!confirm(`Kategorie "${cat.name}" wirklich l\u00f6schen? Eintr\u00e4ge bleiben erhalten.`)) return;
        data.categories = data.categories.filter((c) => c.id !== id);
        saveData();
        renderSettings();
        renderCategoryButtons();
        renderFilterDropdown();
      });
    });
  }

  // Add new category
  $('#add-category-btn').addEventListener('click', () => {
    const nameInput = $('#new-category-name');
    const colorInput = $('#new-category-color');
    const name = nameInput.value.trim();
    if (!name) return;
    data.categories.push({
      id: crypto.randomUUID(),
      name,
      color: colorInput.value,
    });
    saveData();
    nameInput.value = '';
    renderSettings();
    renderCategoryButtons();
    renderFilterDropdown();
  });

  // Export
  $('#export-btn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocounter-backup-${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Import
  $('#import-btn').addEventListener('click', () => $('#import-file').click());
  $('#import-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        if (imported.categories && imported.entries) {
          data = imported;
          saveData();
          initAll();
          alert('Daten erfolgreich importiert!');
        } else {
          alert('Ung\u00fcltiges Dateiformat.');
        }
      } catch {
        alert('Fehler beim Lesen der Datei.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  // Reset
  $('#reset-btn').addEventListener('click', () => {
    if (!confirm('Wirklich ALLE Daten l\u00f6schen? Dies kann nicht r\u00fcckg\u00e4ngig gemacht werden!')) return;
    if (!confirm('Bist du sicher? Alle Eintr\u00e4ge und Kategorien werden gel\u00f6scht.')) return;
    data = { categories: DEFAULT_CATEGORIES.map(c => ({...c, id: crypto.randomUUID()})), entries: [] };
    saveData();
    initAll();
  });

  // ── Init ─────────────────────────────────────────────────────
  function initAll() {
    renderCategoryButtons();
    renderFilterDropdown();
    renderEntryList();
  }

  initAll();
})();
