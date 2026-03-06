// === 1) Pune aici datele din Supabase Project Settings → API ===
const SUPABASE_URL = "PASTE_SUPABASE_URL_HERE";
const SUPABASE_ANON_KEY = "PASTE_SUPABASE_ANON_KEY_HERE";

// localStorage key (pentru export/import)
const STORAGE_KEY = "journal_entries_v1";

function setYear() {
  const y = new Date().getFullYear();
  const el = document.getElementById("year");
  if (el) el.textContent = String(y);
}

function showAuthMsg(msg, ok = true) {
  const el = document.getElementById("authMsg");
  el.textContent = msg || "";
  el.style.color = ok ? "" : "#ff9a9a";
  if (msg) setTimeout(() => (el.textContent = ""), 3500);
}

function showDataMsg(msg, ok = true) {
  const el = document.getElementById("dataMsg");
  el.textContent = msg || "";
  el.style.color = ok ? "" : "#ff9a9a";
  if (msg) setTimeout(() => (el.textContent = ""), 3500);
}

function loadEntries() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function downloadJSON(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function main() {
  setYear();

  // Dacă userul n-a pus cheile încă, nu crăpăm, doar afișăm mesaj
  let supabase = null;
  if (SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY.length > 20) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } else {
    showAuthMsg("Pune SUPABASE_URL și SUPABASE_ANON_KEY în settings.js ca să meargă Login/Register.", false);
  }

  const emailInput = document.getElementById("emailInput");
  const passInput = document.getElementById("passInput");
  const registerBtn = document.getElementById("registerBtn");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  async function refreshAuthUI() {
    const pill = document.getElementById("authStatusPill");
    const statusText = document.getElementById("authStatusText");
    const emailText = document.getElementById("authEmail");

    if (!supabase) {
      pill.textContent = "Neconfigurat";
      statusText.textContent = "Supabase nu e configurat încă.";
      emailText.textContent = "—";
      logoutBtn.style.display = "none";
      return;
    }

    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    if (user) {
      pill.textContent = "Logat";
      statusText.textContent = "Ești logat.";
      emailText.textContent = user.email || "—";
      logoutBtn.style.display = "inline-block";
    } else {
      pill.textContent = "Neautentificat";
      statusText.textContent = "Nu ești logat.";
      emailText.textContent = "—";
      logoutBtn.style.display = "none";
    }
  }

  registerBtn.addEventListener("click", async () => {
    if (!supabase) return showAuthMsg("Supabase nu e configurat.", false);

    const email = (emailInput.value || "").trim();
    const password = passInput.value || "";

    if (!email) return showAuthMsg("Introduceți email.", false);
    if (password.length < 6) return showAuthMsg("Parola trebuie să aibă minim 6 caractere.", false);

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return showAuthMsg(error.message, false);

    showAuthMsg("Register OK. Verifică email-ul dacă e nevoie de confirmare.");
    await refreshAuthUI();
  });

  loginBtn.addEventListener("click", async () => {
    if (!supabase) return showAuthMsg("Supabase nu e configurat.", false);

    const email = (emailInput.value || "").trim();
    const password = passInput.value || "";

    if (!email) return showAuthMsg("Introduceți email.", false);
    if (!password) return showAuthMsg("Introduceți parola.", false);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return showAuthMsg(error.message, false);

    showAuthMsg("Login OK ✅");
    await refreshAuthUI();
  });

  logoutBtn.addEventListener("click", async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    showAuthMsg("Logout OK");
    await refreshAuthUI();
  });

  // Export/Import local (util chiar și cu Supabase)
  document.getElementById("exportBtn").addEventListener("click", () => {
    const entries = loadEntries();
    downloadJSON("myJurnal-export.json", { version: 1, exportedAt: Date.now(), entries });
    showDataMsg("Export realizat ✅");
  });

  document.getElementById("importBtn").addEventListener("click", () => {
    document.getElementById("importFile").click();
  });

  document.getElementById("importFile").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const txt = await file.text();
      const obj = JSON.parse(txt);
      const entries = Array.isArray(obj.entries) ? obj.entries : (Array.isArray(obj) ? obj : null);
      if (!entries) throw new Error("Format invalid. Aștept {entries:[...]} sau o listă directă.");
      saveEntries(entries);
      showDataMsg("Import realizat ✅ (date salvate local)");
    } catch (err) {
      showDataMsg(String(err.message || err), false);
    } finally {
      e.target.value = "";
    }
  });

  await refreshAuthUI();

  // actualizează UI când se schimbă sesiunea
  if (supabase) {
    supabase.auth.onAuthStateChange(() => refreshAuthUI());
  }
}

main();
