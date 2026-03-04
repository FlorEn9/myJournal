const STORAGE_KEY = "journal_entries_v1";

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

function normalize(s) {
  return String(s || "").toLowerCase().trim();
}

function matches(entry, q) {
  if (!q) return true;
  const hay = [
    entry.date,
    entry.text,        // ziua (dacă există)
    entry.tomorrow,    // aspirații (dacă există)
    entry.score
  ].map(normalize).join(" ");
  return hay.includes(q);
}

function sortEntries(entries, mode) {
  const arr = [...entries];
  if (mode === "oldest") arr.sort((a,b) => a.date.localeCompare(b.date));
  if (mode === "newest") arr.sort((a,b) => b.date.localeCompare(a.date));
  if (mode === "score_desc") arr.sort((a,b) => (Number(b.score)||0) - (Number(a.score)||0));
  if (mode === "score_asc") arr.sort((a,b) => (Number(a.score)||0) - (Number(b.score)||0));
  return arr;
}

function render(entries) {
  const list = document.getElementById("historyList");
  const empty = document.getElementById("emptyState");
  list.innerHTML = "";

  if (!entries.length) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  for (const e of entries) {
    const wrap = document.createElement("div");
    wrap.className = "historyItem";

    const score = (e.score === undefined || e.score === null || e.score === "") ? "—" : e.score;
    const textPreview = (e.text || "").slice(0, 160);
    const tomorrowPreview = (e.tomorrow || "").slice(0, 160);

    wrap.innerHTML = `
      <div class="historyTop">
        <div class="historyMeta">
          <div class="historyDate">${e.date || "—"}</div>
          <div class="historyPills">
            <span class="pill">Notă: ${score}</span>
          </div>
        </div>
        <div class="historyActions">
          <button class="btn danger" data-del="${e.date}">Șterge</button>
        </div>
      </div>

      <div class="historyBody">
        <div class="historyBlock">
          <div class="historyLabel">Ziua</div>
          <div class="historyText muted">${textPreview ? escapeHtml(textPreview) : "—"}</div>
        </div>
        <div class="historyBlock">
          <div class="historyLabel">Aspiratii mâine</div>
          <div class="historyText muted">${tomorrowPreview ? escapeHtml(tomorrowPreview) : "—"}</div>
        </div>
      </div>
    `;

    list.appendChild(wrap);
  }

  // delete handlers
  list.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", () => {
      const d = btn.getAttribute("data-del");
      if (!d) return;
      const ok = confirm(`Sigur vrei să ștergi entry-ul din ${d}?`);
      if (!ok) return;

      const all = loadEntries();
      const next = all.filter(x => x.date !== d);
      saveEntries(next);
      applyAndRender();
    });
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function applyAndRender() {
  const q = normalize(document.getElementById("searchInput").value);
  const mode = document.getElementById("sortSelect").value;

  const all = loadEntries();
  const filtered = all.filter(e => matches(e, q));
  const sorted = sortEntries(filtered, mode);
  render(sorted);
}

function main() {
  setYear();

  document.getElementById("searchInput").addEventListener("input", applyAndRender);
  document.getElementById("sortSelect").addEventListener("change", applyAndRender);
  document.getElementById("clearBtn").addEventListener("click", () => {
    document.getElementById("searchInput").value = "";
    document.getElementById("sortSelect").value = "newest";
    applyAndRender();
  });

  applyAndRender();
}

main();
