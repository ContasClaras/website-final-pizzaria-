// Bella Domus — painel de administração
// Gere pedidos de reserva e a configuração das mesas (28 lugares).

let CURRENT_TABLES = [];      // cache local da coleção "tables"
let CURRENT_RESERVATIONS = []; // cache local da coleção "reservations"
let SEEDED_TABLES = false;

// ------------------------------------------------------------------
// Auth guard
// ------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  if (!FIREBASE_READY) {
    document.querySelector('main').innerHTML =
      '<div class="empty-state">O painel ainda não está configurado. Ver README.md (secção Firebase) para ativar o acesso.</div>';
    return;
  }

  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = 'admin-login.html';
      return;
    }
    document.getElementById('admin-user-email').textContent = user.email;
    initDashboard();
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    auth.signOut().then(() => window.location.href = 'admin-login.html');
  });

  // tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });

  // filters
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('filter-date').value = today;
  document.getElementById('filter-date').addEventListener('change', renderReservations);
  document.getElementById('filter-status').addEventListener('change', renderReservations);
  document.getElementById('clear-date').addEventListener('click', () => {
    document.getElementById('filter-date').value = '';
    renderReservations();
  });

  document.getElementById('add-table-form').addEventListener('submit', handleAddTable);
});

function initDashboard() {
  // tables (realtime)
  db.collection('tables').orderBy('name').onSnapshot(snap => {
    CURRENT_TABLES = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (CURRENT_TABLES.length === 0 && !SEEDED_TABLES) {
      SEEDED_TABLES = true;
      seedDefaultTables();
    }
    renderTables();
    renderReservations(); // table chips depend on this list too
    updateStats();
  });

  // reservations (realtime)
  db.collection('reservations').orderBy('createdAt', 'desc').onSnapshot(snap => {
    CURRENT_RESERVATIONS = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderReservations();
    updateStats();
  }, err => console.error('Erro a carregar reservas:', err));
}

// ------------------------------------------------------------------
// Seed: cria 7 mesas de 4 lugares (28 no total) na primeira utilização.
// A equipa pode depois editar livremente na aba "Mesas".
// ------------------------------------------------------------------
function seedDefaultTables() {
  const batch = db.batch();
  for (let i = 1; i <= 7; i++) {
    const ref = db.collection('tables').doc();
    batch.set(ref, { name: `Mesa ${i}`, capacity: 4, area: 'Sala' });
  }
  batch.commit().catch(err => console.error('Erro ao criar mesas por omissão:', err));
}

// ------------------------------------------------------------------
// Mesas — CRUD
// ------------------------------------------------------------------
function renderTables() {
  const list = document.getElementById('tables-list');
  if (CURRENT_TABLES.length === 0) {
    list.innerHTML = '<div class="empty-state">Ainda não há mesas configuradas.</div>';
    return;
  }
  list.innerHTML = CURRENT_TABLES.map(t => `
    <div class="table-row" data-id="${t.id}">
      <input type="text" class="grow" value="${escapeAttr(t.name)}" data-field="name">
      <input type="number" min="1" max="28" style="width:90px;" value="${t.capacity}" data-field="capacity">
      <input type="text" style="width:150px;" value="${escapeAttr(t.area || '')}" data-field="area" placeholder="Zona">
      <button class="btn btn-outline" data-action="save" style="padding:0.5em 1em;">Guardar</button>
      <button class="btn btn-outline" data-action="delete" style="padding:0.5em 1em; color:var(--color-primary); border-color:var(--color-primary);">Remover</button>
    </div>
  `).join('');

  list.querySelectorAll('[data-action="save"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const row = e.target.closest('.table-row');
      const id = row.dataset.id;
      const name = row.querySelector('[data-field="name"]').value.trim();
      const capacity = parseInt(row.querySelector('[data-field="capacity"]').value, 10) || 1;
      const area = row.querySelector('[data-field="area"]').value.trim();
      db.collection('tables').doc(id).update({ name, capacity, area })
        .catch(err => alert('Erro ao guardar mesa: ' + err.message));
    });
  });

  list.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const row = e.target.closest('.table-row');
      const id = row.dataset.id;
      if (confirm('Remover esta mesa? Esta ação não pode ser desfeita.')) {
        db.collection('tables').doc(id).delete().catch(err => alert('Erro ao remover mesa: ' + err.message));
      }
    });
  });
}

function handleAddTable(e) {
  e.preventDefault();
  const name = document.getElementById('new-table-name').value.trim();
  const capacity = parseInt(document.getElementById('new-table-capacity').value, 10) || 1;
  const area = document.getElementById('new-table-area').value.trim();
  if (!name) return;

  db.collection('tables').add({ name, capacity, area }).then(() => {
    document.getElementById('add-table-form').reset();
    document.getElementById('new-table-capacity').value = 4;
    document.getElementById('new-table-area').value = 'Sala';
  }).catch(err => alert('Erro ao adicionar mesa: ' + err.message));
}

// ------------------------------------------------------------------
// Reservas — listagem + filtros
// ------------------------------------------------------------------
function renderReservations() {
  const dateFilter = document.getElementById('filter-date').value;
  const statusFilter = document.getElementById('filter-status').value;
  const list = document.getElementById('res-list');

  let items = CURRENT_RESERVATIONS.slice();
  if (dateFilter) items = items.filter(r => r.date === dateFilter);
  if (statusFilter !== 'all') items = items.filter(r => r.status === statusFilter);

  if (items.length === 0) {
    list.innerHTML = '<div class="empty-state">Sem pedidos de reserva para este filtro.</div>';
    return;
  }

  list.innerHTML = items.map(renderReservationCard).join('');
  wireReservationCardEvents(items);
}

function pillFor(status) {
  const map = {
    pending: ['pill-pending', 'Pendente'],
    confirmed: ['pill-confirmed', 'Confirmada'],
    declined: ['pill-declined', 'Recusada'],
    cancelled: ['pill-declined', 'Cancelada']
  };
  const [cls, label] = map[status] || ['pill-pending', status];
  return `<span class="pill ${cls}">${label}</span>`;
}

function renderReservationCard(r) {
  const assignedNames = (r.tableIds || [])
    .map(id => CURRENT_TABLES.find(t => t.id === id)?.name)
    .filter(Boolean).join(', ');

  let body = `
    <div class="res-card" data-id="${r.id}">
      <div class="res-card-top">
        <div>
          <h3>${escapeHtml(r.name)} — ${r.partySize} pessoa${r.partySize > 1 ? 's' : ''}</h3>
          <div class="res-meta">
            <span>📅 ${formatDate(r.date)}</span>
            <span>🕐 ${r.time}</span>
            <span>✉️ ${escapeHtml(r.email)}</span>
            <span>📞 ${escapeHtml(r.phone)}</span>
          </div>
        </div>
        ${pillFor(r.status)}
      </div>
      ${r.notes ? `<div class="res-notes">${escapeHtml(r.notes)}</div>` : ''}
  `;

  if (r.status === 'pending') {
    const chips = CURRENT_TABLES.map(t => `
      <label class="table-chip" data-capacity="${t.capacity}">
        <input type="checkbox" value="${t.id}"> ${escapeHtml(t.name)} (${t.capacity})
      </label>
    `).join('');

    body += `
      <div class="table-picker" data-res="${r.id}">
        ${chips || '<span class="hint">Sem mesas configuradas — vá à aba "Mesas".</span>'}
      </div>
      <div class="capacity-note" data-capacity-note="${r.id}"></div>
      <div class="conflict-slot" data-conflict-slot="${r.id}"></div>
      <div class="res-actions">
        <button class="btn btn-olive" data-action="accept" data-id="${r.id}">Aceitar e enviar confirmação</button>
        <button class="btn btn-outline" data-action="decline" data-id="${r.id}" style="color:var(--color-primary); border-color:var(--color-primary);">Recusar</button>
      </div>
    `;
  } else if (r.status === 'confirmed') {
    body += `
      <div class="res-meta"><span>🪑 Mesa(s): ${assignedNames || '—'}</span></div>
      <div class="res-actions">
        <button class="btn btn-outline" data-action="cancel" data-id="${r.id}" style="color:var(--color-primary); border-color:var(--color-primary);">Cancelar reserva</button>
      </div>
    `;
  }

  body += `</div>`;
  return body;
}

function wireReservationCardEvents(items) {
  // atualizar nota de capacidade / conflitos ao marcar mesas
  document.querySelectorAll('.table-picker').forEach(picker => {
    const resId = picker.dataset.res;
    const reservation = items.find(r => r.id === resId);
    picker.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        cb.closest('.table-chip').classList.toggle('checked', cb.checked);
        updateCapacityNote(resId, reservation);
        updateConflictWarning(resId, reservation);
      });
    });
  });

  document.querySelectorAll('[data-action="accept"]').forEach(btn => {
    btn.addEventListener('click', () => acceptReservation(btn.dataset.id, items));
  });
  document.querySelectorAll('[data-action="decline"]').forEach(btn => {
    btn.addEventListener('click', () => declineReservation(btn.dataset.id, items));
  });
  document.querySelectorAll('[data-action="cancel"]').forEach(btn => {
    btn.addEventListener('click', () => cancelReservation(btn.dataset.id));
  });
}

function getSelectedTableIds(resId) {
  const picker = document.querySelector(`.table-picker[data-res="${resId}"]`);
  if (!picker) return [];
  return Array.from(picker.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
}

function updateCapacityNote(resId, reservation) {
  const ids = getSelectedTableIds(resId);
  const totalCapacity = ids.reduce((sum, id) => sum + (CURRENT_TABLES.find(t => t.id === id)?.capacity || 0), 0);
  const note = document.querySelector(`[data-capacity-note="${resId}"]`);
  if (!note) return;
  if (ids.length === 0) {
    note.textContent = `Selecione pelo menos uma mesa para ${reservation.partySize} pessoa(s).`;
    note.className = 'capacity-note warn';
  } else if (totalCapacity < reservation.partySize) {
    note.textContent = `⚠ Capacidade selecionada: ${totalCapacity} lugares — insuficiente para ${reservation.partySize} pessoas.`;
    note.className = 'capacity-note warn';
  } else {
    note.textContent = `✓ Capacidade selecionada: ${totalCapacity} lugares.`;
    note.className = 'capacity-note ok';
  }
}

// aviso simples de sobreposição: mesma data, mesma(s) mesa(s) já confirmada(s)
// dentro de uma janela de 2h em torno da hora pedida.
function updateConflictWarning(resId, reservation) {
  const slot = document.querySelector(`[data-conflict-slot="${resId}"]`);
  if (!slot) return;
  const ids = getSelectedTableIds(resId);
  if (ids.length === 0) { slot.innerHTML = ''; return; }

  const reqMinutes = toMinutes(reservation.time);
  const conflicts = CURRENT_RESERVATIONS.filter(other => {
    if (other.id === reservation.id) return false;
    if (other.status !== 'confirmed') return false;
    if (other.date !== reservation.date) return false;
    const sharesTable = (other.tableIds || []).some(id => ids.includes(id));
    if (!sharesTable) return false;
    return Math.abs(toMinutes(other.time) - reqMinutes) < 120; // janela de 2h
  });

  if (conflicts.length === 0) {
    slot.innerHTML = '';
    return;
  }
  slot.innerHTML = `<div class="conflict-box">⚠ Possível sobreposição: ${conflicts.map(c => `${escapeHtml(c.name)} às ${c.time}`).join(', ')} usa(m) a(s) mesma(s) mesa(s) num horário próximo. Confirme com atenção.</div>`;
}

function toMinutes(hhmm) {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

// ------------------------------------------------------------------
// Ações: aceitar / recusar / cancelar
// ------------------------------------------------------------------
async function acceptReservation(resId, items) {
  const reservation = items.find(r => r.id === resId);
  const tableIds = getSelectedTableIds(resId);

  if (tableIds.length === 0) {
    alert('Selecione pelo menos uma mesa antes de aceitar a reserva.');
    return;
  }

  const btn = document.querySelector(`[data-action="accept"][data-id="${resId}"]`);
  btn.disabled = true;
  btn.textContent = 'A confirmar…';

  try {
    await db.collection('reservations').doc(resId).update({
      status: 'confirmed',
      tableIds,
      respondedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    if (window.emailjs && EMAILJS_CONFIG.PUBLIC_KEY !== "SUBSTITUIR_PUBLIC_KEY") {
      const tableNames = tableIds.map(id => CURRENT_TABLES.find(t => t.id === id)?.name).filter(Boolean).join(', ');
      await emailjs.send(EMAILJS_CONFIG.SERVICE_ID, EMAILJS_CONFIG.TEMPLATE_CONFIRMACAO_CLIENTE, {
        to_email: reservation.email,
        client_name: reservation.name,
        date: reservation.date,
        time: reservation.time,
        party_size: reservation.partySize,
        table_names: tableNames
      }).catch(err => console.warn('Reserva confirmada, mas o email ao cliente falhou:', err));
    }
  } catch (err) {
    alert('Erro ao confirmar reserva: ' + err.message);
    btn.disabled = false;
    btn.textContent = 'Aceitar e enviar confirmação';
  }
}

async function declineReservation(resId, items) {
  const reservation = items.find(r => r.id === resId);
  if (!confirm(`Recusar o pedido de ${reservation.name}?`)) return;

  const btn = document.querySelector(`[data-action="decline"][data-id="${resId}"]`);
  btn.disabled = true;
  btn.textContent = 'A recusar…';

  try {
    await db.collection('reservations').doc(resId).update({
      status: 'declined',
      respondedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    if (window.emailjs && EMAILJS_CONFIG.PUBLIC_KEY !== "SUBSTITUIR_PUBLIC_KEY") {
      await emailjs.send(EMAILJS_CONFIG.SERVICE_ID, EMAILJS_CONFIG.TEMPLATE_RECUSA_CLIENTE, {
        to_email: reservation.email,
        client_name: reservation.name,
        date: reservation.date,
        time: reservation.time
      }).catch(err => console.warn('Reserva recusada, mas o email ao cliente falhou:', err));
    }
  } catch (err) {
    alert('Erro ao recusar reserva: ' + err.message);
    btn.disabled = false;
    btn.textContent = 'Recusar';
  }
}

async function cancelReservation(resId) {
  if (!confirm('Cancelar esta reserva já confirmada?')) return;
  try {
    await db.collection('reservations').doc(resId).update({ status: 'cancelled' });
  } catch (err) {
    alert('Erro ao cancelar reserva: ' + err.message);
  }
}

// ------------------------------------------------------------------
// Estatísticas
// ------------------------------------------------------------------
function updateStats() {
  const today = new Date().toISOString().split('T')[0];
  const pending = CURRENT_RESERVATIONS.filter(r => r.status === 'pending').length;
  const confirmedToday = CURRENT_RESERVATIONS.filter(r => r.status === 'confirmed' && r.date === today).length;
  const totalSeats = CURRENT_TABLES.reduce((sum, t) => sum + (t.capacity || 0), 0);

  document.getElementById('stat-pending').textContent = pending;
  document.getElementById('stat-confirmed-today').textContent = confirmedToday;
  document.getElementById('stat-total-seats').textContent = totalSeats;
}

// ------------------------------------------------------------------
// Utilitários
// ------------------------------------------------------------------
function escapeHtml(str = '') {
  return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
function escapeAttr(str = '') { return escapeHtml(str); }
function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
