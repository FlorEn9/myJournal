const STORAGE_KEY = "journal_entries_v1";

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function calcActiveStreak(entries) {
  const set = new Set(entries.map(e => e.date));
  if (set.size === 0) return 0;

  // streak ACTIV: trebuie să ai entry azi
  let cur = new Date();
  let streak = 0;

  while (true) {
    const iso = toISODate(cur);
    if (!set.has(iso)) break;
    streak += 1;
    cur.setDate(cur.getDate() - 1);
  }
  return streak;
}

function calcLastStreak(entries) {
  const set = new Set(entries.map(e => e.date));
  if (set.size === 0) return 0;

  const todayIso = toISODate(new Date());
  let start = new Date();

  // dacă azi nu ai entry, pornește de la ultima zi completată
  if (!set.has(todayIso)) {
    const dates = Array.from(set).sort(); // crescător
    start = new Date(dates[dates.length - 1]);
  }

  let streak = 0;
  while (true) {
    const iso = toISODate(start);
    if (!set.has(iso)) break;
    streak += 1;
    start.setDate(start.getDate() - 1);
  }
  return streak;
}

function averageLast7(entries) {
  const map = new Map(entries.map(e => [e.date, e.score]));
  const today = new Date();
  let sum = 0, cnt = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = toISODate(d);
    if (map.has(iso)) {
      sum += Number(map.get(iso));
      cnt += 1;
    }
  }
  return cnt === 0 ? null : (sum / cnt);
}

function getLastEntry(entries) {
  if (entries.length === 0) return null;
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  return sorted[sorted.length - 1];
}

function hasTodayEntry(entries) {
  const todayIso = toISODate(new Date());
  return entries.some(e => e.date === todayIso);
}

function main() {
  const entries = loadEntries();
  const todayIso = toISODate(new Date());

  document.getElementById("todayLabel").textContent = todayIso;
  document.getElementById("year").textContent = String(new Date().getFullYear());

  // Streaks
  const activeStreak = calcActiveStreak(entries);
  const lastStreak = calcLastStreak(entries);

  document.getElementById("streakValue").textContent = String(activeStreak);
  document.getElementById("streakPill").textContent = `${activeStreak} zile`;

  const lastEl = document.getElementById("lastStreakText");
  if (lastEl) lastEl.textContent = `Ultima serie: ${lastStreak} zile`;

  // Today status
  const done = hasTodayEntry(entries);
  document.getElementById("todayStatusPill").textContent = done ? "Completat" : "Necompletat";
  document.getElementById("todayStatusText").textContent = done ? "Ai entry azi ✅" : "Nu ai entry azi ⏳";
  document.getElementById("primaryCta").textContent = done ? "Editează entry-ul de azi" : "+ Adaugă entry-ul de azi";
  document.getElementById("primaryCta").href = "add.html";

  // Avg 7 days
  const avg = averageLast7(entries);
  document.getElementById("avgValue").textContent = avg == null ? "—" : avg.toFixed(2);
  document.getElementById("avgPill").textContent = avg == null ? "Fără date" : "Ultimele 7 zile";

  // Last entry
  const last = getLastEntry(entries);
  document.getElementById("lastScore").textContent = last ? String(last.score) : "—";
  document.getElementById("lastDatePill").textContent = last ? last.date : "—";
}
function calcPreviousStreak(entries) {
  const set = new Set(entries.map(e => e.date));
  if (set.size === 0) return 0;

  const active = calcActiveStreak(entries);
  if (active === 0) {
    // dacă nu ai streak activ, "ultima serie" e chiar seria cea mai recentă
    return calcLastStreak(entries);
  }

  // Ai streak activ. Găsim ziua de START a streak-ului curent:
  // start = azi - (active-1) zile
  const start = new Date();
  start.setDate(start.getDate() - (active - 1));

  // ziua înainte de start (aici trebuie să fie gap)
  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);

  // dacă nu există entry în prevEnd, ok; începem să numărăm înapoi de la prevEnd
  let streak = 0;
  while (true) {
    const iso = toISODate(prevEnd);
    if (!set.has(iso)) break;
    streak += 1;
    prevEnd.setDate(prevEnd.getDate() - 1);
  }
  return streak;
}
main();
