// ── JSONBin config ─────────────────────────────────────────────────────────
const MASTER_KEY = '$2a$10$.MFByt1FGqQikgzUuG48/uSlAaJYIbIMC3yqreh0/fQGzwUvWu3T.';
const BIN_BASE   = 'https://api.jsonbin.io/v3/b';

const DEFAULT_PLAYERS = [
  'Alex Johnson', 'Maria Garcia', 'James Lee', 'Sofia Patel',
  'Liam Brown', 'Emma Wilson', 'Noah Martinez', 'Olivia Davis',
  'Ethan Taylor', 'Ava Thomas'
];

// ── State ──────────────────────────────────────────────────────────────────
let binId = localStorage.getItem('soccerBinId') || '';
let state = { players: [], records: [] };
let saveTimer = null;

// ── JSONBin API ────────────────────────────────────────────────────────────
async function apiFetch(url, method = 'GET', body = null) {
  const opts = {
    method,
    headers: {
      'X-Master-Key': MASTER_KEY,
      'Content-Type': 'application/json',
      'X-Bin-Meta': 'false'
    }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function loadFromCloud() {
  setStatus('Loading data...');
  try {
    const data = await apiFetch(`${BIN_BASE}/${binId}`);
    state = data.record ?? data;
    if (!state.players) state.players = [...DEFAULT_PLAYERS];
    if (!state.records) state.records = [];
    setStatus('');
    render();
  } catch (e) {
    setStatus('Could not load data. Check your Club Code.');
    console.error(e);
  }
}

async function saveToCloud() {
  try {
    await apiFetch(`${BIN_BASE}/${binId}`, 'PUT', state);
  } catch (e) {
    showToast('Save failed - check your connection.');
    console.error(e);
  }
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveToCloud, 800);
}

async function createNewBin() {
  setStatus('Creating database...');
  try {
    const result = await apiFetch(BIN_BASE, 'POST', {
      players: [...DEFAULT_PLAYERS],
      records: []
    });
    return result.metadata.id;
  } catch (e) {
    setStatus('Failed to create database: ' + e.message);
    throw e;
  }
}

// ── Setup Modal ────────────────────────────────────────────────────────────
const setupOverlay    = document.getElementById('setupOverlay');
const createBinBtn    = document.getElementById('createBinBtn');
const connectBinBtn   = document.getElementById('connectBinBtn');
const binIdInput      = document.getElementById('binIdInput');
const setupStatusEl   = document.getElementById('setupStatus');
const clubCodeBar     = document.getElementById('clubCodeBar');
const clubCodeDisplay = document.getElementById('clubCodeDisplay');
const copyCodeBtn     = document.getElementById('copyCodeBtn');
const changeDbBtn     = document.getElementById('changeDbBtn');

function setStatus(msg) { setupStatusEl.textContent = msg; }

function showApp() {
  setupOverlay.classList.add('hidden');
  clubCodeBar.classList.remove('hidden');
  clubCodeDisplay.textContent = binId;
}

function showSetup() {
  setupOverlay.classList.remove('hidden');
  clubCodeBar.classList.add('hidden');
}

createBinBtn.addEventListener('click', async () => {
  createBinBtn.disabled = true;
  try {
    binId = await createNewBin();
    localStorage.setItem('soccerBinId', binId);
    state = { players: [...DEFAULT_PLAYERS], records: [] };
    setStatus('Database created! Your Club Code is: ' + binId);
    setTimeout(() => { showApp(); render(); }, 1500);
  } catch {
    createBinBtn.disabled = false;
  }
});

connectBinBtn.addEventListener('click', async () => {
  const id = binIdInput.value.trim();
  if (!id) { setStatus('Please paste your Club Code.'); return; }
  binId = id;
  localStorage.setItem('soccerBinId', binId);
  showApp();
  await loadFromCloud();
});

copyCodeBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(binId).then(() => showToast('Club Code copied!'));
});

changeDbBtn.addEventListener('click', () => {
  if (!confirm('Switch to a different database?\n\nYour current Club Code is:\n' + binId)) return;
  localStorage.removeItem('soccerBinId');
  binId = '';
  showSetup();
});

// ── DOM References ─────────────────────────────────────────────────────────
const playerCheckList = document.getElementById('playerCheckList');
const selectAllBtn    = document.getElementById('selectAllBtn');
const clearSelBtn     = document.getElementById('clearSelBtn');
const dateInput       = document.getElementById('dateInput');
const sessionInput    = document.getElementById('sessionInput');
const markPresentBtn  = document.getElementById('markPresentBtn');
const markAbsentBtn   = document.getElementById('markAbsentBtn');
const newPlayerInput  = document.getElementById('newPlayerInput');
const addPlayerBtn    = document.getElementById('addPlayerBtn');
const playerTagList   = document.getElementById('playerTagList');
const filterPlayer    = document.getElementById('filterPlayer');
const recordsBody     = document.getElementById('recordsBody');
const emptyMsg        = document.getElementById('emptyMsg');
const exportBtn       = document.getElementById('exportBtn');
const clearBtn        = document.getElementById('clearBtn');
const summaryGrid     = document.getElementById('summaryGrid');
const toast           = document.getElementById('toast');

// ── Helpers ────────────────────────────────────────────────────────────────
function showToast(msg, duration = 2800) {
  toast.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.add('hidden'), duration);
}

function formatDate(iso) {
  if (!iso) return '-';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function getSelectedPlayers() {
  return [...playerCheckList.querySelectorAll('input[type="checkbox"]:checked')]
    .map(cb => cb.value);
}

// ── Render ─────────────────────────────────────────────────────────────────
function renderPlayers() {
  const sorted = [...state.players].sort();
  const prevChecked = getSelectedPlayers();

  playerCheckList.innerHTML = '';
  sorted.forEach(p => {
    const lbl = document.createElement('label');
    const cb  = document.createElement('input');
    cb.type  = 'checkbox';
    cb.value = p;
    if (prevChecked.includes(p)) cb.checked = true;
    lbl.appendChild(cb);
    lbl.appendChild(document.createTextNode(p));
    playerCheckList.appendChild(lbl);
  });

  const prevFilter = filterPlayer.value;
  filterPlayer.innerHTML = '<option value="">All Players</option>';
  sorted.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p; opt.textContent = p;
    if (p === prevFilter) opt.selected = true;
    filterPlayer.appendChild(opt);
  });

  playerTagList.innerHTML = '';
  sorted.forEach(p => {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.innerHTML = `${escapeHtml(p)} <button class="remove-tag" data-player="${escapeHtml(p)}">x</button>`;
    playerTagList.appendChild(tag);
  });
}

function renderRecords() {
  const filter  = filterPlayer.value;
  const visible = filter ? state.records.filter(r => r.player === filter) : state.records;
  const sorted  = [...visible].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  emptyMsg.style.display = sorted.length ? 'none' : 'block';
  document.getElementById('recordsTable').style.display = sorted.length ? 'table' : 'none';

  recordsBody.innerHTML = '';
  sorted.forEach(rec => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatDate(rec.date)}</td>
      <td>${escapeHtml(rec.player)}</td>
      <td>${escapeHtml(rec.session || '-')}</td>
      <td><span class="badge badge-${rec.status}">${rec.status}</span></td>
      <td><button class="btn-delete" data-id="${rec.id}" title="Delete">x</button></td>
    `;
    recordsBody.appendChild(tr);
  });
}

function renderSummary() {
  summaryGrid.innerHTML = '';
  [...state.players].sort().forEach(p => {
    const recs    = state.records.filter(r => r.player === p);
    const total   = recs.length;
    const present = recs.filter(r => r.status === 'present').length;
    const pct     = total ? Math.round((present / total) * 100) : 0;
    const div = document.createElement('div');
    div.className = 'summary-item';
    div.innerHTML = `
      <div class="player-name" title="${escapeHtml(p)}">${escapeHtml(p)}</div>
      <div class="stats">${present} / ${total} sessions &nbsp;·&nbsp; ${pct}%</div>
      <div class="pct-bar"><div class="pct-fill" style="width:${pct}%"></div></div>
    `;
    summaryGrid.appendChild(div);
  });
}

function render() { renderPlayers(); renderRecords(); renderSummary(); }

// ── Actions ────────────────────────────────────────────────────────────────
function markAttendance(status) {
  const players = getSelectedPlayers();
  const date    = dateInput.value;
  const session = sessionInput.value.trim();
  if (!players.length) { showToast('Please select at least one player.'); return; }
  if (!date)           { showToast('Please select a date.'); return; }

  let added = 0, skipped = 0;
  players.forEach(player => {
    if (state.records.some(r => r.player === player && r.date === date && (r.session || '') === session)) {
      skipped++; return;
    }
    state.records.push({ id: generateId(), player, date, session, status });
    added++;
  });

  if (!added) { showToast('All selected players already have a record for this date/session.'); return; }
  const skipNote = skipped ? ` (${skipped} duplicate${skipped > 1 ? 's' : ''} skipped)` : '';
  showToast(`Marked ${added} player${added > 1 ? 's' : ''} as ${status} on ${formatDate(date)}.${skipNote}`);
  render();
  scheduleSave();
}

function addPlayer() {
  const name = newPlayerInput.value.trim();
  if (!name) { showToast('Enter a player name.'); return; }
  if (state.players.map(p => p.toLowerCase()).includes(name.toLowerCase())) {
    showToast('Player already exists.'); return;
  }
  state.players.push(name);
  newPlayerInput.value = '';
  render();
  scheduleSave();
  showToast('Added player: ' + name);
}

function removePlayer(name) {
  if (!confirm(`Remove "${name}" and all their records?`)) return;
  state.players = state.players.filter(p => p !== name);
  state.records = state.records.filter(r => r.player !== name);
  render();
  scheduleSave();
  showToast('Removed player: ' + name);
}

function deleteRecord(id) {
  state.records = state.records.filter(r => r.id !== id);
  render();
  scheduleSave();
  showToast('Record deleted.');
}

function clearAll() {
  if (!confirm('Delete ALL attendance records? Player list will be kept.')) return;
  state.records = [];
  render();
  scheduleSave();
  showToast('All records cleared.');
}

function exportCSV() {
  if (!state.records.length) { showToast('No records to export.'); return; }
  const rows = state.records
    .slice().sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    .map(r => `"${r.date}","${r.player.replace(/"/g,'""')}","${(r.session||'').replace(/"/g,'""')}","${r.status}"`)
    .join('\n');
  const blob = new Blob(['Date,Player,Session,Status\n' + rows], { type: 'text/csv;charset=utf-8;' });
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: 'soccer-attendance-' + new Date().toISOString().slice(0,10) + '.csv'
  });
  a.click();
  URL.revokeObjectURL(a.href);
}

// ── Event Listeners ────────────────────────────────────────────────────────
markPresentBtn.addEventListener('click', () => markAttendance('present'));
markAbsentBtn.addEventListener('click',  () => markAttendance('absent'));
addPlayerBtn.addEventListener('click',   addPlayer);
exportBtn.addEventListener('click',      exportCSV);
clearBtn.addEventListener('click',       clearAll);
filterPlayer.addEventListener('change',  renderRecords);
selectAllBtn.addEventListener('click',   () => playerCheckList.querySelectorAll('input').forEach(cb => cb.checked = true));
clearSelBtn.addEventListener('click',    () => playerCheckList.querySelectorAll('input').forEach(cb => cb.checked = false));
newPlayerInput.addEventListener('keydown', e => { if (e.key === 'Enter') addPlayer(); });
playerTagList.addEventListener('click', e => { const b = e.target.closest('.remove-tag'); if (b) removePlayer(b.dataset.player); });
recordsBody.addEventListener('click',   e => { const b = e.target.closest('.btn-delete');  if (b) deleteRecord(b.dataset.id); });

// ── Init ───────────────────────────────────────────────────────────────────
dateInput.valueAsDate = new Date();

if (binId) {
  showApp();
  loadFromCloud();
} else {
  showSetup();
}
