// Cheia unde vom salva entry-urile (mai târziu o folosim pe bune)
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

const activeStreak = calcActiveStreak(entries);
const lastStreak = calcLastStreak(entries);

document.getElementById("streakValue").textContent = String(activeStreak);
document.getElementById("streakPill").textContent = `${activeStreak} zile`;

// nou: ultima serie
document.getElementById("lastStreakText").textContent = `Ultima serie: ${lastStreak} zile`;

  // streak ACTIV: trebuie să ai entry azi, altfel 0
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
  const sorted = [...entries].sort((a,b) => a.date.localeCompare(b.date));
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

  // Streak
  const streak = calcStreak(entries);
  document.getElementById("streakValue").textContent = String(streak);
  document.getElementById("streakPill").textContent = `${streak} zile`;

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

  // dacă azi ai entry, "last streak" e tot active streak
  const todayIso = toISODate(new Date());
  let start = new Date();

  if (!set.has(todayIso)) {
    // caută cea mai recentă zi completată
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

main();
