// Leonida Ledger — wiring.
// Boots the guide: fetches the local trophy data, restores progress, applies
// the hash route (#view=, #trophy=, #demo, #spoiler=1, #menu=data), and keeps
// the checklist, roadmap, missables, filters and guide panel in sync.
// Offline by design: the only fetch is this app's own data/trophies.json.
'use strict';

const ledgerState = {
  trophies: [],
  progress: loadProgress(),
  view: 'checklist',
  selectedName: null,
  dataMenuOpen: false,
  filters: { search: '', kind: 'all', grade: 'all', state: 'all' }
};

function findTrophy(name) {
  return ledgerState.trophies.find((trophy) => trophy.name === name) || null;
}

function selectedTrophy() {
  return ledgerState.selectedName ? findTrophy(ledgerState.selectedName) : null;
}

function persistAndRender() {
  saveProgress(ledgerState.progress);
  renderAll();
}

const ledgerCallbacks = {
  get selectedName() { return ledgerState.selectedName; },
  onToggleEarned(trophy, earned) {
    if (earned) ledgerState.progress.earned[trophy.name] = true;
    else delete ledgerState.progress.earned[trophy.name];
    if (ledgerState.progress.sample && Object.keys(ledgerState.progress.earned).length === 0) {
      ledgerState.progress.sample = false;
    }
    persistAndRender();
  },
  onCounter(trophy, delta) {
    if (!trophy.target) return;
    const step = trophy.target >= 10000 ? 500 : 1;
    const current = ledgerState.progress.counters[trophy.name] || 0;
    const next = Math.max(0, Math.min(trophy.target, current + delta * step));
    ledgerState.progress.counters[trophy.name] = next;
    if (next >= trophy.target) ledgerState.progress.earned[trophy.name] = true;
    else delete ledgerState.progress.earned[trophy.name];
    persistAndRender();
  },
  onSelect(trophy) {
    ledgerState.selectedName = trophy.name;
    writeHash();
    renderAll();
    document.getElementById('guide-panel').scrollIntoView({ block: 'nearest' });
  }
};

function trophyMatchesFilters(trophy) {
  const filters = ledgerState.filters;
  const progress = ledgerState.progress;
  if (filters.kind === 'missable') {
    if (!trophy.missable && trophy.kind !== 'missable') return false;
  } else if (filters.kind !== 'all' && trophy.kind !== filters.kind) {
    return false;
  }
  if (filters.grade !== 'all' && trophy.grade !== filters.grade) return false;
  if (filters.state === 'earned' && !progress.earned[trophy.name]) return false;
  if (filters.state === 'unearned' && progress.earned[trophy.name]) return false;
  if (filters.state === 'hidden' && !trophy.hidden) return false;
  if (filters.search) {
    // A shielded story trophy must not leak through search: while the
    // spoiler shield hides it, only its grade and kind are searchable,
    // never its name, description, chapter or guide text.
    const shielded = typeof isSpoilerHidden === 'function' && isSpoilerHidden(trophy, progress);
    const haystack = shielded
      ? (trophy.grade + ' ' + trophy.kind + ' hidden story').toLowerCase()
      : (trophy.name + ' ' + trophy.description + ' ' + trophy.guide + ' ' + (trophy.chapter || '')).toLowerCase();
    if (!haystack.includes(filters.search.toLowerCase())) return false;
  }
  return true;
}

function renderProgressHeader() {
  const trophies = ledgerState.trophies;
  const progress = ledgerState.progress;
  const earnedCount = trophies.filter((trophy) => progress.earned[trophy.name]).length;
  document.getElementById('progress-count').textContent = earnedCount + ' of ' + trophies.length + ' earned';
  document.getElementById('progress-fill').style.width = (trophies.length ? (earnedCount / trophies.length) * 100 : 0) + '%';
  const byGrade = { platinum: [0, 0], gold: [0, 0], silver: [0, 0], bronze: [0, 0] };
  for (const trophy of trophies) {
    byGrade[trophy.grade][1] += 1;
    if (progress.earned[trophy.name]) byGrade[trophy.grade][0] += 1;
  }
  document.getElementById('progress-grades').textContent =
    'Platinum ' + byGrade.platinum[0] + '/' + byGrade.platinum[1]
    + ' · Gold ' + byGrade.gold[0] + '/' + byGrade.gold[1]
    + ' · Silver ' + byGrade.silver[0] + '/' + byGrade.silver[1]
    + ' · Bronze ' + byGrade.bronze[0] + '/' + byGrade.bronze[1]
    + ' · 28 hidden in the full list';
  document.getElementById('sample-banner').hidden = !progress.sample;
}

function renderChecklist() {
  const list = document.getElementById('trophy-list');
  list.replaceChildren();
  const visible = ledgerState.trophies.filter(trophyMatchesFilters);
  for (const trophy of visible) {
    list.appendChild(renderTrophyCard(trophy, ledgerState.progress, ledgerCallbacks));
  }
  if (!visible.length) {
    const none = document.createElement('p');
    none.textContent = 'No trophies match these filters. Loosen a filter — or, for the Online kind, note that this PS5 list contains no online trophies at all.';
    list.appendChild(none);
  }
  document.getElementById('result-count').textContent = 'Showing ' + visible.length + ' of ' + ledgerState.trophies.length + ' trophies';
}

function renderAll() {
  renderProgressHeader();
  document.getElementById('view-checklist').hidden = ledgerState.view !== 'checklist';
  document.getElementById('view-roadmap').hidden = ledgerState.view !== 'roadmap';
  document.getElementById('view-missables').hidden = ledgerState.view !== 'missables';
  document.querySelectorAll('#view-tabs .tab[data-view]').forEach((tab) => {
    tab.classList.toggle('is-active', tab.dataset.view === ledgerState.view);
  });
  document.getElementById('data-menu').hidden = !ledgerState.dataMenuOpen;
  document.getElementById('spoiler-toggle').checked = ledgerState.progress.spoilerShield === true;
  if (ledgerState.view === 'checklist') renderChecklist();
  if (ledgerState.view === 'roadmap') renderRoadmap(ledgerState.trophies, ledgerState.progress, ledgerCallbacks);
  if (ledgerState.view === 'missables') renderMissables(ledgerState.trophies, ledgerState.progress, ledgerCallbacks);
  renderGuidePanel(selectedTrophy(), ledgerState.progress, ledgerCallbacks);
}

function writeHash() {
  const parts = [];
  if (ledgerState.view !== 'checklist') parts.push('view=' + ledgerState.view);
  if (ledgerState.selectedName) parts.push('trophy=' + encodeURIComponent(ledgerState.selectedName));
  if (ledgerState.progress.sample) parts.push('demo');
  if (ledgerState.progress.spoilerShield) parts.push('spoiler=1');
  if (ledgerState.dataMenuOpen) parts.push('menu=data');
  const next = '#' + parts.join('&');
  if (location.hash !== next) history.replaceState(null, '', next);
}

function applyHash() {
  const raw = location.hash.replace(/^#/, '');
  const params = new URLSearchParams(raw.replace(/&/g, '&'));
  // URLSearchParams cannot hold bare flags, so check them in the raw text.
  const flags = raw.split('&').filter((part) => !part.includes('='));
  const view = params.get('view');
  if (view === 'roadmap' || view === 'missables' || view === 'checklist') ledgerState.view = view;
  const trophyName = params.get('trophy');
  if (trophyName && findTrophy(trophyName)) ledgerState.selectedName = trophyName;
  if (flags.includes('demo') && !ledgerState.progress.sample) {
    ledgerState.progress = createSampleProgress(ledgerState.trophies);
    saveProgress(ledgerState.progress);
  }
  if (params.get('spoiler') === '1') ledgerState.progress.spoilerShield = true;
  if (params.get('menu') === 'data') ledgerState.dataMenuOpen = true;
}

function setStatus(message) {
  document.getElementById('data-status').textContent = message;
}

function bindControls() {
  document.querySelectorAll('#view-tabs .tab[data-view]').forEach((tab) => {
    tab.addEventListener('click', () => {
      ledgerState.view = tab.dataset.view;
      writeHash();
      renderAll();
    });
  });
  document.getElementById('data-tab').addEventListener('click', () => {
    ledgerState.dataMenuOpen = !ledgerState.dataMenuOpen;
    writeHash();
    renderAll();
  });
  document.getElementById('search').addEventListener('input', (event) => {
    ledgerState.filters.search = event.target.value;
    if (ledgerState.view === 'checklist') renderChecklist();
  });
  document.getElementById('kind-filter').addEventListener('change', (event) => {
    ledgerState.filters.kind = event.target.value;
    if (ledgerState.view === 'checklist') renderChecklist();
  });
  document.getElementById('grade-filter').addEventListener('change', (event) => {
    ledgerState.filters.grade = event.target.value;
    if (ledgerState.view === 'checklist') renderChecklist();
  });
  document.getElementById('state-filter').addEventListener('change', (event) => {
    ledgerState.filters.state = event.target.value;
    if (ledgerState.view === 'checklist') renderChecklist();
  });
  document.getElementById('spoiler-toggle').addEventListener('change', (event) => {
    ledgerState.progress.spoilerShield = event.target.checked;
    writeHash();
    persistAndRender();
  });
  document.getElementById('export-btn').addEventListener('click', () => {
    exportProgressFile(ledgerState.progress);
    setStatus('Exported: leonida-ledger-progress.json downloaded. Import it anywhere to restore this exact progress.');
  });
  document.getElementById('import-file').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      ledgerState.progress = parseImportedProgress(await file.text());
      ledgerState.progress.sample = false;
      persistAndRender();
      setStatus('Import complete: progress restored from ' + file.name + ' and saved in this browser.');
    } catch (err) {
      setStatus('Import failed: that file is not valid progress JSON. Your current progress was left untouched.');
    }
    event.target.value = '';
  });
  document.getElementById('demo-btn').addEventListener('click', () => {
    ledgerState.progress = createSampleProgress(ledgerState.trophies);
    writeHash();
    persistAndRender();
    setStatus('SAMPLE progress loaded (clearly labelled in the header). It is demo data, not your save.');
  });
  document.getElementById('sample-clear').addEventListener('click', () => {
    ledgerState.progress = createEmptyProgress();
    writeHash();
    persistAndRender();
    setStatus('Sample cleared. Your own progress starts now, saved in this browser.');
  });
  document.getElementById('reset-btn').addEventListener('click', () => {
    ledgerState.progress = createEmptyProgress();
    writeHash();
    persistAndRender();
    setStatus('All progress reset: 0 of 55 earned, counters cleared, spoiler shield off.');
  });
  window.addEventListener('hashchange', () => {
    applyHash();
    renderAll();
  });
}

async function bootLedger() {
  const response = await fetch('data/trophies.json');
  const data = await response.json();
  ledgerState.trophies = Array.isArray(data) ? data : data.trophies;
  applyHash();
  bindControls();
  renderAll();
}

bootLedger();
