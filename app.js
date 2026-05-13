// ── State ──────────────────────────────────────────────────────────────────
const DEFAULT_PLAYERS = [
  'Alex Johnson', 'Maria Garcia', 'James Lee', 'Sofia Patel',
  'Liam Brown', 'Emma Wilson', 'Noah Martinez', 'Olivia Davis',
  'Ethan Taylor', 'Ava Thomas'
];

let state = {
  players: [],
  records: []
};

// ── Persistence ────────────────────────────────────────────────────────────
function loadState() {
  try {
    const saved = localStorage.getItem('soccerAttendance');
    if (saved) {
      state = JSON.parse(saved);
    } else {
      state.players = [...DEFAULT_PLAYERS];
    }
  } catch {
    state.players = [...DEFAULT_PLAYERS];
  }
}

function saveState() {
  localStorage.setItem('soccerAttendance', JSON.stringify(state));
}

// ── DOM References ─────────────────────────────────────────────────────────
const playerSelect   = document.getElementById('playerSelect');
const dateInput      = document.getElementById('dateInput');
const sessionInput   = document.getElementById('sessionInput');
const markPresentBtn = document.getElementById('markPresentBtn');
const markAbsentBtn  = document.getElementById('markAbsentBtn');
const newPlayerInput = document.getElementById('newPlayerInput');
const addPlayerBtn   = document.getElementById('addPlayerBtn');
const playerTagList  = document.getElementById('playerTagList');
const filterPlayer   = document.getElementById('filterPlayer');
const recordsBody    = document.getElementById('recordsBody');
const emptyMsg       = document.getElementById('emptyMsg');
const exportBtn      = document.getElementById('exportBtn');
const clearBtn       = document.getElementById('clearBtn');
const summaryGrid    = document.getElementById('summaryGrid');
const toast          = document.getElementById('toast');

// ── Helpers ────────────────────────────────────────────────────────────────
function showToast(msg, duration = 2500) {
  toast.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.add('hidden'), duration);
}

function formatDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ── Render: player dropdowns & tags ───────────────────────────────────────
function renderPlayers() {
  const sorted = [...state.players].sort();

  // Main select
  const prev = playerSelect.value;
  playerSelect.innerHTML = '<option value="">-- Select a player --</option>';
  sorted.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p;
    if (p === prev) opt.selected = true;
    playerSelect.appendChild(opt);
  });

  // Filter select
  const prevFilter = filterPlayer.value;
  filterPlayer.innerHTML = '<option value="">All Players</option>';
  sorted.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p;
    if (p === prevFilter) opt.selected = true;
    filterPlayer.appendChild(opt);
  });

  // Tags
  playerTagList.innerHTML = '';
  sorted.forEach(p => {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.innerHTML = `${escapeHtml(p)} <button class="remove-tag" aria-label="Remove ${escapeHtml(p)}" data-player="${escapeHtml(p)}">×</button>`;
    playerTagList.appendChild(tag);
  });
}

// ── Render: records table ──────────────────────────────────────────────────
function renderRecords() {
  const filter = filterPlayer.value;
  const visible = filter
    ? state.records.filter(r => r.player === filter)
    : state.records;

  // Sort newest first
  const sorted = [...visible].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  emptyMsg.style.display = sorted.length ? 'none' : 'block';
  document.getElementById('recordsTable').style.display = sorted.length ? 'table' : 'none';

  recordsBody.innerHTML = '';
  sorted.forEach(rec => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatDate(rec.date)}</td>
      <td>${escapeHtml(rec.player)}</td>
      <td>${escapeHtml(rec.session || '—')}</td>
      <td><span class="badge badge-${rec.status}">${rec.status}</span></td>
      <td><button class="btn-delete" data-id="${rec.id}" title="Delete record">✕</button></td>
    `;
    recordsBody.appendChild(tr);
  });
}

// ── Render: summary ────────────────────────────────────────────────────────
function renderSummary() {
  summaryGrid.innerHTML = '';
  const sorted = [...state.players].sort();

  sorted.forEach(p => {
    const playerRecs = state.records.filter(r => r.player === p);
    const total   = playerRecs.length;
    const present = playerRecs.filter(r => r.status === 'present').length;
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

// ── Render all ─────────────────────────────────────────────────────────────
function render() {
  renderPlayers();
  renderRecords();
  renderSummary();
}

// ── XSS guard ──────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Actions ────────────────────────────────────────────────────────────────
function markAttendance(status) {
  const player  = playerSelect.value.trim();
  const date    = dateInput.value;
  const session = sessionInput.value.trim();

  if (!player) { showToast('⚠ Please select a player.'); return; }
  if (!date)   { showToast('⚠ Please select a date.');   return; }

  // Prevent duplicate for same player + date + session
  const duplicate = state.records.some(
    r => r.player === player && r.date === date && (r.session || '') === session
  );
  if (duplicate) {
    showToast('⚠ A record already exists for this player, date, and session.');
    return;
  }

  state.records.push({ id: generateId(), player, date, session, status });
  saveState();
  render();
  showToast(`✔ Marked ${player} as ${status} on ${formatDate(date)}.`);
}

function addPlayer() {
  const name = newPlayerInput.value.trim();
  if (!name) { showToast('⚠ Enter a player name.'); return; }
  if (state.players.map(p => p.toLowerCase()).includes(name.toLowerCase())) {
    showToast('⚠ Player already exists.');
    return;
  }
  state.players.push(name);
  newPlayerInput.value = '';
  saveState();
  render();
  showToast(`✔ Added player: ${name}`);
}

function removePlayer(name) {
  if (!confirm(`Remove "${name}" and all their records?`)) return;
  state.players  = state.players.filter(p => p !== name);
  state.records  = state.records.filter(r => r.player !== name);
  saveState();
  render();
  showToast(`Removed player: ${name}`);
}

function deleteRecord(id) {
  state.records = state.records.filter(r => r.id !== id);
  saveState();
  render();
  showToast('Record deleted.');
}

function clearAll() {
  if (!confirm('Delete ALL attendance records? Player list will be kept.')) return;
  state.records = [];
  saveState();
  render();
  showToast('All records cleared.');
}

// ── CSV Export ─────────────────────────────────────────────────────────────
function exportCSV() {
  if (!state.records.length) { showToast('No records to export.'); return; }
  const header = 'Date,Player,Session,Status\n';
  const rows   = state.records
    .slice()
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    .map(r => `"${r.date}","${r.player.replace(/"/g, '""')}","${(r.session || '').replace(/"/g, '""')}","${r.status}"`)
    .join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `soccer-attendance-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Event Listeners ────────────────────────────────────────────────────────
markPresentBtn.addEventListener('click', () => markAttendance('present'));
markAbsentBtn.addEventListener('click',  () => markAttendance('absent'));
addPlayerBtn.addEventListener('click',   addPlayer);
exportBtn.addEventListener('click',      exportCSV);
clearBtn.addEventListener('click',       clearAll);
filterPlayer.addEventListener('change',  renderRecords);

newPlayerInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') addPlayer();
});

// Delegated: remove player tag
playerTagList.addEventListener('click', e => {
  const btn = e.target.closest('.remove-tag');
  if (btn) removePlayer(btn.dataset.player);
});

// Delegated: delete record row
recordsBody.addEventListener('click', e => {
  const btn = e.target.closest('.btn-delete');
  if (btn) deleteRecord(btn.dataset.id);
});

// ── Init ───────────────────────────────────────────────────────────────────
// Default date = today
dateInput.valueAsDate = new Date();

loadState();
render();
