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

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function setYear() {
  const y = new Date().getFullYear();
  const el = document.getElementById("year");
  if (el) el.textContent = String(y);
}

function findEntryByDate(entries, date) {
  return entries.find(e => e.date === date) || null;
}

function upsertEntry(entries, entry) {
  const idx = entries.findIndex(e => e.date === entry.date);
  if (idx >= 0) {
    entries[idx] = entry;
    return { entries, mode: "updated" };
  }
  entries.push(entry);
  return { entries, mode: "created" };
}

function removeEntry(entries, date) {
  return entries.filter(e => e.date !== date);
}

function showStatus(msg, ok=true) {
  const el = document.getElementById("statusMsg");
  el.textContent = msg;
  el.style.color = ok ? "" : "#ff9a9a";
  if (msg) setTimeout(() => { el.textContent = ""; }, 3000);
}

function main() {
  setYear();

  const dateInput = document.getElementById("dateInput");
  const scoreInput = document.getElementById("scoreInput");
  const textInput = document.getElementById("textInput");
  const tomorrowInput = document.getElementById("tomorrowInput");
  const deleteBtn = document.getElementById("deleteBtn");
  const form = document.getElementById("entryForm");

  // default: azi
  dateInput.value = toISODate(new Date());
  dateInput.disabled = true; // nu poți selecta altă dată

  function refreshFormForDate() {
    const entries = loadEntries();
    const date = dateInput.value;
    const existing = findEntryByDate(entries, date);

 if (existing) {
  scoreInput.value = existing.score ?? "";
  textInput.value = existing.text ?? "";
  tomorrowInput.value = existing.tomorrow ?? "";

  // LOCK: nu mai poți edita după salvare
  scoreInput.disabled = true;
  textInput.disabled = true;
  tomorrowInput.disabled = true;
  dateInput.disabled = true;

  deleteBtn.style.display = "inline-block";
  document.getElementById("saveBtn").style.display = "none";

  showStatus("Entry salvat ✅ (blocat, nu mai poate fi modificat).");
} else {
  scoreInput.value = "";
  textInput.value = "";
  tomorrowInput.value = "";

  // UNLOCK pentru o zi nouă
  scoreInput.disabled = false;
  textInput.disabled = false;
  tomorrowInput.disabled = false;
  dateInput.disabled = true; // rămâne blocat (vezi punctul 2)

  deleteBtn.style.display = "none";
  document.getElementById("saveBtn").style.display = "inline-block";
  document.getElementById("saveBtn").textContent = "Salvează";
}
  }

  dateInput.addEventListener("change", refreshFormForDate);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const date = dateInput.value;
    const score = Number(scoreInput.value);

    if (!date) return showStatus("Alege o dată.", false);
    if (!Number.isFinite(score) || score < 1 || score > 10) {
      return showStatus("Nota trebuie să fie între 1 și 10.", false);
    }

    const entry = {
      date,
      score,
      text: textInput.value || "",
      tomorrow: tomorrowInput.value || "",
      updatedAt: Date.now()
    };

    const entries = loadEntries();
    const { entries: next, mode } = upsertEntry(entries, entry);
    // sortare după dată (opțional)
    next.sort((a,b) => a.date.localeCompare(b.date));
    saveEntries(next);

    showStatus(mode === "created" ? "Salvat ✅" : "Actualizat ✅");
    refreshFormForDate();
  });

  deleteBtn.addEventListener("click", () => {
    const date = dateInput.value;
    if (!date) return;
    const ok = confirm(`Sigur vrei să ștergi entry-ul din ${date}?`);
    if (!ok) return;

    const entries = loadEntries();
    const next = removeEntry(entries, date);
    saveEntries(next);

    showStatus("Șters 🗑️");
    refreshFormForDate();
  });

  // inițial
  refreshFormForDate();
}

main();
