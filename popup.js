/* Save to Stash — MV3 popup */
const $ = (id) => document.getElementById(id);

const get = () =>
  new Promise((res) => chrome.storage.local.get(["baseUrl", "token"], res));
const set = (obj) =>
  new Promise((res) => chrome.storage.local.set(obj, res));

function show(which) {
  $("setup").classList.toggle("hidden", which !== "setup");
  $("save").classList.toggle("hidden", which !== "save");
}

function msg(el, text, ok) {
  el.textContent = text;
  el.className = "msg " + (ok ? "ok" : "err");
}

async function init() {
  const s = await get();
  if (s.baseUrl) {
    try {
      $("serverLabel").textContent = new URL(s.baseUrl).host;
    } catch {
      $("serverLabel").textContent = "";
    }
  }
  if (!s.baseUrl || !s.token) return show("setup");

  show("save");
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  $("title").value = tab?.title ?? "";
  $("url").value = tab?.url ?? "";
  // browser internal pages can't be saved
  if (!tab?.url || !/^https?:/i.test(tab.url)) {
    $("saveBtn").disabled = true;
    msg($("saveMsg"), "This page can't be saved (browser internal page).", false);
  }
}

$("loginBtn").addEventListener("click", async () => {
  const baseUrl = $("baseUrl").value.trim().replace(/\/+$/, "");
  const email = $("email").value.trim();
  const password = $("password").value;
  if (!baseUrl || !email || !password)
    return msg($("setupMsg"), "Fill server URL, email and password.", false);
  $("loginBtn").disabled = true;
  try {
    const r = await fetch(baseUrl + "/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const j = await r.json();
    const token = j?.data?.session?.accessToken;
    if (!r.ok || !token) throw new Error(j?.error?.message || "Login failed");
    await set({ baseUrl, token });
    $("password").value = "";
    init();
  } catch (e) {
    msg($("setupMsg"), e.message || "Could not connect.", false);
  } finally {
    $("loginBtn").disabled = false;
  }
});

$("saveBtn").addEventListener("click", async () => {
  const s = await get();
  const url = $("url").value.trim();
  const title = $("title").value.trim();
  const note = $("note").value.trim();
  $("saveBtn").disabled = true;
  msg($("saveMsg"), "Saving…", true);
  try {
    const r = await fetch(s.baseUrl + "/api/links", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer " + s.token,
      },
      body: JSON.stringify({
        url,
        title: title || undefined,
        description: note || undefined,
      }),
    });
    const j = await r.json();
    if (r.status === 401) {
      await set({ token: "" });
      throw new Error("Session expired — connect again.");
    }
    if (!r.ok) throw new Error(j?.error?.message || "Save failed");
    msg($("saveMsg"), "Saved to Stash ✓", true);
    setTimeout(() => window.close(), 700);
  } catch (e) {
    msg($("saveMsg"), e.message || "Save failed", false);
    if (e.message?.includes("connect again")) show("setup");
  } finally {
    $("saveBtn").disabled = false;
  }
});

$("logoutBtn").addEventListener("click", async () => {
  await set({ token: "" });
  $("setupMsg").textContent = "";
  show("setup");
});

init();
