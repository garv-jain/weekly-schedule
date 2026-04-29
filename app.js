// Days order: Sat, Sun, Mon, Tue, Wed, Thu, Fri
const DAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const WEEKEND_INDICES = [0, 1]; // Sat = 0, Sun = 1
const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 8am–10pm

const CLASS_COLORS = [
  { bg: '#EEEDFE', border: '#7F77DD', text: '#3C3489' },
  { bg: '#E6F1FB', border: '#378ADD', text: '#0C447C' },
  { bg: '#FAECE7', border: '#D85A30', text: '#712B13' },
  { bg: '#E1F5EE', border: '#1D9E75', text: '#085041' },
  { bg: '#FBEAF0', border: '#D4537E', text: '#4B1528' },
  { bg: '#EAF3DE', border: '#639922', text: '#173404' },
  { bg: '#FAEEDA', border: '#BA7517', text: '#633806' },
];

const ACT_COLORS = [
  { bg: '#F1EFE8', border: '#888780', text: '#444441' },
  { bg: '#FCEBEB', border: '#E24B4A', text: '#501313' },
  { bg: '#E1F5EE', border: '#1D9E75', text: '#085041' },
  { bg: '#FAEEDA', border: '#BA7517', text: '#633806' },
  { bg: '#EEEDFE', border: '#7F77DD', text: '#3C3489' },
  { bg: '#FBEAF0', border: '#D4537E', text: '#4B1528' },
  { bg: '#E6F1FB', border: '#378ADD', text: '#0C447C' },
];

// Sat=0, Sun=1, Mon=2, Tue=3, Wed=4, Thu=5, Fri=6
let entries = [
  { id: 1, type: 'class', name: 'Calculus II',    room: 'Hall 102',         days: [2, 4, 6], start: 9,    end: 10,   color: 0 },
  { id: 2, type: 'class', name: 'Intro to CS',    room: 'Tech 301',         days: [3, 5],    start: 11,   end: 12.5, color: 1 },
  { id: 3, type: 'class', name: 'English Comp',   room: 'Liberal Arts 205', days: [2, 4],    start: 13,   end: 14,   color: 2 },
  { id: 4, type: 'class', name: 'Physics Lab',    room: 'Science 110',      days: [5],       start: 14,   end: 16,   color: 3 },
  { id: 5, type: 'activity', name: 'Dance Practice', room: 'Studio B',      days: [3, 6, 1], start: 17,   end: 18.5, color: 0 },
  { id: 6, type: 'activity', name: 'CS Club',     room: 'Tech Lounge',      days: [4],       start: 18,   end: 19,   color: 4 },
  { id: 7, type: 'activity', name: 'Gym',         room: 'Rec Center',       days: [0, 1],    start: 10,   end: 11.5, color: 2 },
];

let nextId = 8;
let editId = null;
let selectedColor = 0;
let modalType = 'class';
let activeFilter = 'all';

// ── Storage ──────────────────────────────────────────────
function saveToStorage() {
  try { localStorage.setItem('schedule_entries', JSON.stringify(entries)); } catch(e) {}
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem('schedule_entries');
    if (raw) {
      entries = JSON.parse(raw);
      nextId = Math.max(...entries.map(e => e.id), 0) + 1;
    }
  } catch(e) {}
}

// ── Time helpers ──────────────────────────────────────────
function timeOptions() {
  const opts = [];
  for (let h = 7; h <= 22; h++) {
    const ampm = h < 12 ? 'AM' : 'PM';
    const d = h <= 12 ? h : h - 12;
    opts.push({ val: h,       label: `${d}:00 ${ampm}` });
    opts.push({ val: h + 0.5, label: `${d}:30 ${ampm}` });
  }
  return opts;
}

function populateSelects() {
  const opts = timeOptions();
  ['f-start', 'f-end'].forEach(id => {
    document.getElementById(id).innerHTML =
      opts.map(o => `<option value="${o.val}">${o.label}</option>`).join('');
  });
}

// ── Color picker ──────────────────────────────────────────
function buildColorPicker(type) {
  const colors = type === 'class' ? CLASS_COLORS : ACT_COLORS;
  document.getElementById('color-row').innerHTML = colors.map((c, i) => `
    <div class="color-swatch ${i === selectedColor ? 'selected' : ''}"
         style="background:${c.bg}; outline-color:${c.border}; ${i === selectedColor ? `border-color:${c.border};` : ''}"
         onclick="pickColor(${i})"></div>
  `).join('');
}

function pickColor(i) {
  selectedColor = i;
  buildColorPicker(modalType);
}

// ── Filter tabs ───────────────────────────────────────────
function setFilter(f, el) {
  activeFilter = f;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  render();
}

// ── Modal type toggle ─────────────────────────────────────
function switchType(t) {
  modalType = t;
  document.getElementById('tog-class').classList.toggle('active', t === 'class');
  document.getElementById('tog-activity').classList.toggle('active', t === 'activity');
  document.getElementById('name-label').textContent = t === 'class' ? 'Class name' : 'Activity name';
  document.getElementById('room-label').textContent = t === 'class' ? 'Room / location' : 'Location (optional)';
  document.getElementById('f-name').placeholder = t === 'class' ? 'e.g. Calculus II' : 'e.g. Dance Practice';
  document.getElementById('f-room').placeholder = t === 'class' ? 'e.g. Hall 204' : 'e.g. Studio B';
  selectedColor = 0;
  buildColorPicker(t);
}

// ── Render grid ───────────────────────────────────────────
function render() {
  const grid = document.getElementById('grid');
  grid.innerHTML = '';

  // Time column
  const timeCol = document.createElement('div');
  timeCol.className = 'time-col';
  timeCol.innerHTML = '<div class="day-header"></div>' +
    HOURS.map(h => {
      const ap = h < 12 ? 'am' : 'pm';
      const d = h <= 12 ? h : h - 12;
      return `<div class="time-label">${d}${ap}</div>`;
    }).join('');
  grid.appendChild(timeCol);

  // Day columns
  DAYS.forEach((day, di) => {
    const isWE = WEEKEND_INDICES.includes(di);
    const col = document.createElement('div');
    col.className = 'day-col' + (isWE ? ' weekend' : '');
    col.innerHTML = `<div class="day-header${isWE ? ' weekend' : ''}">${day}</div>` +
      HOURS.map(() => `<div class="slot"></div>`).join('');

    const visible = entries.filter(e =>
      e.days.includes(di) && (activeFilter === 'all' || e.type === activeFilter)
    );

    visible.forEach(cls => {
      const colors = cls.type === 'class' ? CLASS_COLORS : ACT_COLORS;
      const c = colors[cls.color] || colors[0];
      const startOff = cls.start - 8;
      const dur = cls.end - cls.start;

      const block = document.createElement('div');
      block.className = 'class-block';
      block.style.cssText = `
        background: ${c.bg};
        border-left-color: ${c.border};
        top: ${48 + startOff * 48}px;
        height: ${dur * 48 - 2}px;
      `;
      block.innerHTML = `
        <div class="name" style="color:${c.text}">${cls.name}</div>
        <div class="room" style="color:${c.text}">${cls.room}</div>
        ${cls.type === 'activity' ? `<div class="type-badge" style="color:${c.text}">activity</div>` : ''}
      `;
      block.addEventListener('click', () => openEdit(cls.id));
      col.appendChild(block);
    });

    grid.appendChild(col);
  });

  // Legend
  const leg = document.getElementById('legend');
  const vis = entries.filter(e => activeFilter === 'all' || e.type === activeFilter);
  leg.innerHTML = vis.map(e => {
    const colors = e.type === 'class' ? CLASS_COLORS : ACT_COLORS;
    const c = colors[e.color] || colors[0];
    return `<div class="legend-item"><div class="legend-dot" style="background:${c.border}"></div>${e.name}</div>`;
  }).join('');
}

// ── Open / close modal ────────────────────────────────────
function openAdd(type) {
  editId = null;
  modalType = type || 'class';
  selectedColor = 0;
  document.getElementById('modal-title').textContent = modalType === 'class' ? 'Add class' : 'Add activity';
  document.getElementById('f-name').value = '';
  document.getElementById('f-room').value = '';
  document.querySelectorAll('#day-checks input').forEach(cb => cb.checked = false);
  document.getElementById('f-start').value = 9;
  document.getElementById('f-end').value = 10;
  document.getElementById('del-btn').style.display = 'none';
  switchType(modalType);
  document.getElementById('modal-bg').classList.add('open');
}

function openEdit(id) {
  const e = entries.find(x => x.id === id);
  if (!e) return;
  editId = id;
  modalType = e.type;
  selectedColor = e.color;
  document.getElementById('modal-title').textContent = e.type === 'class' ? 'Edit class' : 'Edit activity';
  document.getElementById('f-name').value = e.name;
  document.getElementById('f-room').value = e.room;
  document.querySelectorAll('#day-checks input').forEach(cb => {
    cb.checked = e.days.includes(Number(cb.value));
  });
  document.getElementById('f-start').value = e.start;
  document.getElementById('f-end').value = e.end;
  document.getElementById('del-btn').style.display = 'inline-block';
  switchType(e.type);
  document.getElementById('modal-bg').classList.add('open');
}

function saveEntry() {
  const name = document.getElementById('f-name').value.trim();
  if (!name) return;
  const days = [...document.querySelectorAll('#day-checks input:checked')].map(cb => Number(cb.value));
  const start = parseFloat(document.getElementById('f-start').value);
  const end = parseFloat(document.getElementById('f-end').value);
  if (end <= start || !days.length) return;
  const room = document.getElementById('f-room').value.trim();

  if (editId) {
    const e = entries.find(x => x.id === editId);
    Object.assign(e, { name, room, days, start, end, color: selectedColor, type: modalType });
  } else {
    entries.push({ id: nextId++, type: modalType, name, room, days, start, end, color: selectedColor });
  }

  saveToStorage();
  closeModalDirect();
  render();
}

function deleteEntry() {
  entries = entries.filter(e => e.id !== editId);
  saveToStorage();
  closeModalDirect();
  render();
}

function closeModal(ev) {
  if (ev.target === document.getElementById('modal-bg')) closeModalDirect();
}

function closeModalDirect() {
  document.getElementById('modal-bg').classList.remove('open');
}

// ── Toast ─────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ── Export PNG ────────────────────────────────────────────
function exportPNG() {
  showToast('Generating PNG…');

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'background:#ffffff; padding:28px; display:inline-block; font-family:sans-serif;';

  const title = document.createElement('div');
  title.style.cssText = 'font-size:20px; font-weight:500; color:#111; margin-bottom:18px;';
  title.textContent = 'Weekly Schedule';
  wrapper.appendChild(title);

  const gridClone = document.querySelector('.schedule-container').cloneNode(true);
  gridClone.style.overflowX = 'visible';
  wrapper.appendChild(gridClone);

  const legClone = document.getElementById('legend').cloneNode(true);
  legClone.style.marginTop = '16px';
  wrapper.appendChild(legClone);

  document.body.appendChild(wrapper);

  html2canvas(wrapper, { backgroundColor: '#ffffff', scale: 2, useCORS: true })
    .then(canvas => {
      document.body.removeChild(wrapper);
      const link = document.createElement('a');
      link.download = 'my-schedule.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('Downloaded!');
    })
    .catch(() => {
      document.body.removeChild(wrapper);
      showToast('Export failed — try again');
    });
}

// ── Init ──────────────────────────────────────────────────
loadFromStorage();
populateSelects();
render();
