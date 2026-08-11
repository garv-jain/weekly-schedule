// Days order: Sun, Mon, Tue, Wed, Thu, Fri, Sat
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKEND_INDICES = [0, 6]; // Sun = 0, Sat = 6
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

// Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6
let entries = [
  { id: 1, type: 'class',    name: 'Calculus II',    room: 'Hall 102',         days: [1, 3, 5], start: 9,    end: 10,   color: 0 },
  { id: 2, type: 'class',    name: 'Intro to CS',    room: 'Tech 301',         days: [2, 4],    start: 11,   end: 12.5, color: 1 },
  { id: 3, type: 'class',    name: 'English Comp',   room: 'Liberal Arts 205', days: [1, 3],    start: 13,   end: 14,   color: 2 },
  { id: 4, type: 'class',    name: 'Physics Lab',    room: 'Science 110',      days: [4],       start: 14,   end: 16,   color: 3 },
  { id: 5, type: 'activity', name: 'Dance Practice', room: 'Studio B',         days: [2, 5, 0], start: 17,   end: 18.5, color: 0 },
  { id: 6, type: 'activity', name: 'CS Club',        room: 'Tech Lounge',      days: [3],       start: 18,   end: 19,   color: 4 },
  { id: 7, type: 'activity', name: 'Gym',            room: 'Rec Center',       days: [0, 6],    start: 10,   end: 11.5, color: 2 },
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
    opts.push({ val: h,        label: `${d}:00 ${ampm}` });
    opts.push({ val: h + 0.25, label: `${d}:15 ${ampm}` });
    opts.push({ val: h + 0.5,  label: `${d}:30 ${ampm}` });
    opts.push({ val: h + 0.75, label: `${d}:45 ${ampm}` });
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
let exportOrientation = 'vertical'; // 'vertical' | 'horizontal'

function toggleOrientation() {
  exportOrientation = exportOrientation === 'vertical' ? 'horizontal' : 'vertical';
  const btn = document.getElementById('orient-btn');
  btn.textContent = exportOrientation === 'vertical' ? 'Switch to horizontal' : 'Switch to vertical';
}

function applyLightStyles(root) {
  root.querySelectorAll('.grid-wrap').forEach(el => {
    el.style.background = '#ffffff';
    el.style.borderColor = 'rgba(0,0,0,0.12)';
  });
  root.querySelectorAll('.day-header').forEach(el => {
    el.style.background = '#f5f4f0';
    el.style.color = el.classList.contains('weekend') ? '#999999' : '#666666';
    el.style.borderBottomColor = 'rgba(0,0,0,0.12)';
    el.style.borderRightColor = 'rgba(0,0,0,0.12)';
  });
  root.querySelectorAll('.time-col').forEach(el => {
    el.style.background = '#f5f4f0';
  });
  root.querySelectorAll('.time-label').forEach(el => {
    el.style.color = '#999999';
  });
  root.querySelectorAll('.day-col').forEach(el => {
    el.style.background = el.classList.contains('weekend') ? '#f9f8f5' : '#ffffff';
    el.style.borderLeftColor = 'rgba(0,0,0,0.12)';
    el.style.borderTopColor = 'rgba(0,0,0,0.12)';
  });
  root.querySelectorAll('.slot').forEach(el => {
    el.style.borderBottomColor = 'rgba(0,0,0,0.12)';
    el.style.borderRightColor = 'rgba(0,0,0,0.12)';
  });
  root.querySelectorAll('.legend-item').forEach(el => {
    el.style.color = '#666666';
  });
}

function buildVerticalExport() {
  const container = document.createElement('div');
  container.style.cssText = 'overflow:visible;';

  // Build a fresh vertical grid with bigger slots so text fits
  const ESLOT = 64, EHDR = 44, ETIMEW = 56;
  const grid = document.createElement('div');
  grid.style.cssText = \`display:grid; grid-template-columns:\${ETIMEW}px repeat(7,1fr); border:0.5px solid rgba(0,0,0,0.12); border-radius:10px; overflow:hidden; width:900px; background:#fff;\`;

  // Time column
  const tc = document.createElement('div');
  tc.style.cssText = 'background:#f5f4f0;';
  tc.innerHTML = \`<div style="height:\${EHDR}px;background:#f5f4f0;border-bottom:0.5px solid rgba(0,0,0,0.12);"></div>\` +
    HOURS.map(h => {
      const ap = h < 12 ? 'am' : 'pm', d = h <= 12 ? h : h - 12;
      return \`<div style="height:\${ESLOT}px;display:flex;align-items:flex-start;justify-content:flex-end;padding:5px 8px 0 0;font-size:11px;color:#999;">\${d}\${ap}</div>\`;
    }).join('');
  grid.appendChild(tc);

  const vis = entries.filter(e => activeFilter === 'all' || e.type === activeFilter);

  DAYS.forEach((day, di) => {
    const isWE = WE.includes(di);
    const col = document.createElement('div');
    col.style.cssText = \`position:relative;border-left:0.5px solid rgba(0,0,0,0.12);background:\${isWE ? '#f9f8f5' : '#fff'};\`;
    col.innerHTML = \`<div style="height:\${EHDR}px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:500;color:\${isWE ? '#999' : '#666'};border-bottom:0.5px solid rgba(0,0,0,0.12);background:#f5f4f0;">\${day}</div>\` +
      HOURS.map(() => \`<div style="height:\${ESLOT}px;border-bottom:0.5px solid rgba(0,0,0,0.12);"></div>\`).join('');

    vis.filter(e => e.days.includes(di)).forEach(cls => {
      const pal = cls.type === 'class' ? CLASS_COLORS : ACT_COLORS;
      const c = pal[cls.color] || pal[0];
      const top = EHDR + (cls.start - 8) * ESLOT;
      const h = (cls.end - cls.start) * ESLOT - 2;
      const blk = document.createElement('div');
      blk.style.cssText = \`position:absolute;left:3px;right:3px;border-radius:6px;padding:5px 7px;overflow:hidden;z-index:1;border-left:3px solid \${c.border};background:\${c.bg};top:\${top}px;height:\${h}px;\`;
      blk.innerHTML = \`<div style="font-size:11px;font-weight:500;line-height:1.3;color:\${c.text};white-space:normal;word-break:break-word;">\${cls.name}</div><div style="font-size:10px;opacity:.75;margin-top:2px;color:\${c.text};white-space:normal;word-break:break-word;">\${cls.room}</div>\${cls.type === 'activity' ? \`<div style="font-size:9px;opacity:.6;margin-top:1px;text-transform:uppercase;letter-spacing:.04em;color:\${c.text};">activity</div>\` : ''}\`;
      col.appendChild(blk);
    });
    grid.appendChild(col);
  });

  container.appendChild(grid);
  return container;
}

function buildHorizontalExport() {
  // Horizontal: days = rows, hours = columns
  const ECOL = 72, EHDR = 40, EDAYW = 52;
  const vis = entries.filter(e => activeFilter === 'all' || e.type === activeFilter);
  const totalW = EDAYW + HOURS.length * ECOL;

  const table = document.createElement('div');
  table.style.cssText = \`position:relative;border:0.5px solid rgba(0,0,0,0.12);border-radius:10px;overflow:hidden;width:\${totalW}px;background:#fff;\`;

  // Header row: empty corner + hour labels
  const hdrRow = document.createElement('div');
  hdrRow.style.cssText = \`display:flex;border-bottom:0.5px solid rgba(0,0,0,0.12);background:#f5f4f0;\`;
  hdrRow.innerHTML = \`<div style="width:\${EDAYW}px;flex-shrink:0;height:\${EHDR}px;"></div>\` +
    HOURS.map(h => {
      const ap = h < 12 ? 'am' : 'pm', d = h <= 12 ? h : h - 12;
      return \`<div style="width:\${ECOL}px;flex-shrink:0;height:\${EHDR}px;display:flex;align-items:center;justify-content:center;font-size:11px;color:#999;border-left:0.5px solid rgba(0,0,0,0.12);">\${d}\${ap}</div>\`;
    }).join('');
  table.appendChild(hdrRow);

  // One row per day
  const ROW_H = 56;
  DAYS.forEach((day, di) => {
    const isWE = WE.includes(di);
    const row = document.createElement('div');
    row.style.cssText = \`display:flex;position:relative;border-bottom:0.5px solid rgba(0,0,0,0.12);height:\${ROW_H}px;background:\${isWE ? '#f9f8f5' : '#fff'};\`;

    // Day label cell
    const dayCell = document.createElement('div');
    dayCell.style.cssText = \`width:\${EDAYW}px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:500;color:\${isWE ? '#999' : '#666'};background:#f5f4f0;border-right:0.5px solid rgba(0,0,0,0.12);\`;
    dayCell.textContent = day;
    row.appendChild(dayCell);

    // Hour slot cells
    const cellsWrap = document.createElement('div');
    cellsWrap.style.cssText = \`position:relative;flex:1;display:flex;\`;
    HOURS.forEach(() => {
      const cell = document.createElement('div');
      cell.style.cssText = \`width:\${ECOL}px;flex-shrink:0;height:\${ROW_H}px;border-left:0.5px solid rgba(0,0,0,0.12);\`;
      cellsWrap.appendChild(cell);
    });

    // Place blocks
    vis.filter(e => e.days.includes(di)).forEach(cls => {
      const pal = cls.type === 'class' ? CLASS_COLORS : ACT_COLORS;
      const c = pal[cls.color] || pal[0];
      const left = (cls.start - 8) * ECOL + 2;
      const width = (cls.end - cls.start) * ECOL - 4;
      const blk = document.createElement('div');
      blk.style.cssText = \`position:absolute;top:3px;bottom:3px;left:\${left}px;width:\${width}px;border-radius:5px;padding:4px 6px;overflow:hidden;border-left:3px solid \${c.border};background:\${c.bg};z-index:1;\`;
      blk.innerHTML = \`<div style="font-size:10px;font-weight:500;line-height:1.3;color:\${c.text};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">\${cls.name}</div><div style="font-size:9px;opacity:.72;color:\${c.text};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">\${cls.room}</div>\`;
      cellsWrap.appendChild(blk);
    });

    row.appendChild(cellsWrap);
    table.appendChild(row);
  });

  return table;
}

function exportPNG() {
  showToast('Generating PNG…');

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'background:#ffffff; padding:28px; display:inline-block; font-family:-apple-system,BlinkMacSystemFont,sans-serif;';

  const lightVars = {
    '--bg': '#ffffff', '--bg-secondary': '#f5f4f0', '--bg-weekend': '#f9f8f5',
    '--text-primary': '#111111', '--text-secondary': '#666666', '--text-tertiary': '#999999',
    '--border': 'rgba(0,0,0,0.12)', '--border-hover': 'rgba(0,0,0,0.25)',
  };
  Object.entries(lightVars).forEach(([k, v]) => wrapper.style.setProperty(k, v));

  const title = document.createElement('div');
  title.style.cssText = 'font-size:20px; font-weight:500; color:#111111; margin-bottom:18px;';
  title.textContent = 'Weekly Schedule';
  wrapper.appendChild(title);

  const content = exportOrientation === 'horizontal' ? buildHorizontalExport() : buildVerticalExport();
  wrapper.appendChild(content);

  const legClone = document.getElementById('legend').cloneNode(true);
  legClone.style.cssText += 'margin-top:16px;display:flex;flex-wrap:wrap;gap:10px;';
  legClone.querySelectorAll('.legend-item').forEach(el => { el.style.color = '#666666'; });
  wrapper.appendChild(legClone);

  document.body.appendChild(wrapper);

  html2canvas(wrapper, { backgroundColor: '#ffffff', scale: 2, useCORS: true, logging: false })
    .then(canvas => {
      document.body.removeChild(wrapper);
      const link = document.createElement('a');
      link.download = \`my-schedule-\${exportOrientation}.png\`;
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
