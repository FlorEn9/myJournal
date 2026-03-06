const STORAGE_KEY = "journal_entries_v1";

function loadEntries() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function setYearFooter() {
  const y = new Date().getFullYear();
  const el = document.getElementById("year");
  if (el) el.textContent = String(y);
}

function monthName(mIdx) {
  const names = ["Ian","Feb","Mar","Apr","Mai","Iun","Iul","Aug","Sep","Oct","Noi","Dec"];
  return names[mIdx] || "";
}

/* ===== Canvas chart 0..10 ===== */
function drawChart(canvas, labels, values, opts = {}) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const padL = 44, padR = 16, padT = 18, padB = 34;
  const x0 = padL, y0 = padT;
  const cw = w - padL - padR, ch = h - padT - padB;

  const yMin = 0, yMax = 10;
  const yOf = (v) => y0 + (1 - (v - yMin) / (yMax - yMin)) * ch;

  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";

  for (let yy = 0; yy <= 10; yy += 2) {
    const y = yOf(yy);
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x0 + cw, y);
    ctx.stroke();
    ctx.fillText(String(yy), 10, y + 4);
  }

  const n = labels.length;
  const stepX = n > 1 ? cw / (n - 1) : 0;

  const sparse = opts.sparseX ?? Math.ceil(n / 7);
  for (let i = 0; i < n; i++) {
    if (i % sparse !== 0 && i !== n - 1) continue;
    const x = x0 + i * stepX;
    const lab = labels[i];
    ctx.save();
    ctx.translate(x, y0 + ch + 18);
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText(lab, 0, 0);
    ctx.restore();
  }

  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.beginPath();
  ctx.moveTo(x0, y0 + ch);
  ctx.lineTo(x0 + cw, y0 + ch);
  ctx.stroke();

  // line
  ctx.strokeStyle = "rgba(140,255,193,0.90)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  let started = false;

  for (let i = 0; i < n; i++) {
    const v = values[i];
    if (v == null) { started = false; continue; }
    const x = x0 + i * stepX;
    const y = yOf(v);
    if (!started) { ctx.moveTo(x, y); started = true; }
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // points
  ctx.fillStyle = "rgba(106,168,255,0.90)";
  for (let i = 0; i < n; i++) {
    const v = values[i];
    if (v == null) continue;
    const x = x0 + i * stepX;
    const y = yOf(v);
    ctx.beginPath();
    ctx.arc(x, y, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

  if (opts.cornerText) {
    ctx.fillStyle = "rgba(255,255,255,0.60)";
    ctx.textAlign = "right";
    ctx.fillText(opts.cornerText, w - 10, 14);
    ctx.textAlign = "left";
  }
}

/* ===== Data helpers ===== */
function mapByDate(entries) {
  const m = new Map();
  for (const e of entries) if (e?.date) m.set(e.date, e);
  return m;
}

function getWeekSeries(entries) {
  const by = mapByDate(entries);
  const today = new Date();
  const labels = [];
  const values = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = toISODate(d);
    labels.push(iso.slice(5)); // MM-DD
    const e = by.get(iso);
    values.push(e ? Number(e.score) : null);
  }
  return { labels, values };
}

function daysInMonth(year, monthIdx) {
  return new Date(year, monthIdx + 1, 0).getDate();
}

function getMonthSeries(entries) {
  const by = mapByDate(entries);
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const dim = daysInMonth(y, m);

  const labels = [];
  const values = [];
  for (let day = 1; day <= dim; day++) {
    const d = new Date(y, m, day);
    const iso = toISODate(d);
    labels.push(String(day));
    const e = by.get(iso);
    values.push(e ? Number(e.score) : null);
  }
  return { labels, values, year: y, monthIdx: m };
}

function getYearSeries(entries) {
  const now = new Date();
  const y = now.getFullYear();

  const buckets = Array.from({ length: 12 }, () => []);
  for (const e of entries) {
    if (!e?.date) continue;
    if (!e.date.startsWith(String(y))) continue;
    const m = Number(e.date.slice(5, 7)) - 1;
    const s = Number(e.score);
    if (m >= 0 && m < 12 && Number.isFinite(s)) buckets[m].push(s);
  }

  const labels = [];
  const values = [];
  for (let m = 0; m < 12; m++) {
    labels.push(monthName(m));
    const arr = buckets[m];
    values.push(arr.length ? (arr.reduce((a,b)=>a+b,0) / arr.length) : null);
  }
  return { labels, values, year: y };
}

// robust: prinde "10", 10, "10 "
function getLastTenDay(entries) {
  const sorted = [...entries]
    .filter(e => e && e.date)
    .sort((a,b) => b.date.localeCompare(a.date));

  for (const e of sorted) {
    const s = parseInt(String(e.score).trim(), 10);
    if (s === 10) return e;
  }
  return null;
}

function main() {
  setYearFooter();
  const entries = loadEntries();

  const week = getWeekSeries(entries);
  document.getElementById("weekPill").textContent = "Ultimele 7 zile";
  drawChart(document.getElementById("weekChart"), week.labels, week.values, { sparseX: 1, cornerText: "0–10" });

  const month = getMonthSeries(entries);
  document.getElementById("monthPill").textContent = `${monthName(month.monthIdx)} ${month.year}`;
  drawChart(document.getElementById("monthChart"), month.labels, month.values, { sparseX: 4, cornerText: "0–10" });

  const year = getYearSeries(entries);
  document.getElementById("yearPill").textContent = String(year.year);
  drawChart(document.getElementById("yearChart"), year.labels, year.values, { sparseX: 1, cornerText: "medie/lună" });

  const lastTen = getLastTenDay(entries);
  document.getElementById("tenPill").textContent = entries.length ? "Cea mai recentă zi de 10" : "Fără date";

  if (lastTen) {
    document.getElementById("tenDate").textContent = lastTen.date;
    const opinion = (lastTen.text && lastTen.text.trim()) ? lastTen.text.trim()
      : "(Nu ai scris părerea la „Cum a fost ziua?”)";
    document.getElementById("tenText").textContent = opinion;
  } else {
    document.getElementById("tenDate").textContent = "—";
    document.getElementById("tenText").textContent = "Nu există încă o zi de 10/10.";
  }
    const debugEl = document.getElementById("debugInfo");
  if (debugEl) {
    const tens = entries.filter(e => parseInt(String(e.score).trim(), 10) === 10);
    debugEl.textContent = `Total entries: ${entries.length} | Zile 10/10: ${tens.length} | Ultima zi 10/10: ${tens.sort((a,b)=>b.date.localeCompare(a.date))[0]?.date || "—"}`;
  }
}

main();
