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

// Simplu: streak = zile consecutive de la ultima zi completată înapoi
function calcStreak(entries) {
  const set = new Set(entries.map(e => e.date)); // date = YYYY-MM-DD
  if (set.size === 0) return 0;

  // găsim cea mai recentă zi
  const sorted = Array.from(set).sort(); // crescător
  let cur = new Date(sorted[sorted.length - 1]);
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
  document.getElementById("primaryCta").href = "new.html";

  // Avg 7 days
  const avg = averageLast7(entries);
  document.getElementById("avgValue").textContent = avg == null ? "—" : avg.toFixed(2);
  document.getElementById("avgPill").textContent = avg == null ? "Fără date" : "Ultimele 7 zile";

  // Last entry
  const last = getLastEntry(entries);
  document.getElementById("lastScore").textContent = last ? String(last.score) : "—";
  document.getElementById("lastDatePill").textContent = last ? last.date : "—";
}

main();
