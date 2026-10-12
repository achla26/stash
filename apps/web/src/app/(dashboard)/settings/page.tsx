"use client";

import { useEffect, useState } from "react";
import {
  Download,
  Moon,
  Sun,
  Monitor,
  KeyRound,
  Sparkles,
  Crown,
} from "lucide-react";
import { exportService } from "@/lib/services";
import { useTheme } from "@/components/providers/theme-provider";
import { apiClient } from "@/lib/api-client";
import {
  getAIConfig,
  saveAIConfig,
  clearAIConfig,
  testAIKey,
  type AIProvider,
} from "@/lib/ai";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [aiCfg, setAiCfg] = useState(() => getAIConfig());
  const [aiProvider, setAiProvider] = useState<AIProvider>(
    aiCfg?.provider ?? "groq"
  );
  const [aiKey, setAiKey] = useState(aiCfg?.key ?? "");
  const [aiMsg, setAiMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [aiBusy, setAiBusy] = useState<"" | "test">("");

  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [expBusy, setExpBusy] = useState(false);
  const [expMsg, setExpMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("access_token");
        const r = await fetch("/api/auth/me", {
          headers: { authorization: `Bearer ${token}` },
        });
        const j = (await r.json()) as { data?: { plan?: string } };
        if (j.data?.plan === "pro") setPlan("pro");
      } catch {
        /* keep free */
      }
    })();
  }, []);

  async function doExport(format: "json" | "markdown") {
    setExpBusy(true);
    setExpMsg("");
    try {
      const token = localStorage.getItem("access_token");
      const r = await fetch(`/api/export?format=${format}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        setExpMsg(j?.error?.message ?? "Export failed");
        return;
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = format === "json" ? "stash-export.json" : "stash-export.md";
      a.click();
      URL.revokeObjectURL(url);
      setExpMsg("Download started.");
    } catch {
      setExpMsg("Export failed — try again.");
    } finally {
      setExpBusy(false);
    }
  }

  function aiSave() {
    if (!aiKey.trim()) return;
    saveAIConfig({ provider: aiProvider, key: aiKey.trim() });
    setAiCfg(getAIConfig());
    setAiMsg({ ok: true, text: "Key saved on this device." });
  }

  async function aiTest() {
    if (!aiKey.trim()) return;
    setAiBusy("test");
    setAiMsg(null);
    const r = await testAIKey(aiProvider, aiKey.trim());
    setAiBusy("");
    setAiMsg(
      r.ok
        ? { ok: true, text: "Key works!" }
        : { ok: false, text: r.error || "Key failed." }
    );
  }

  function aiRemove() {
    clearAIConfig();
    setAiCfg(null);
    setAiKey("");
    setAiMsg({ ok: true, text: "Key removed." });
  }

  async function downloadBackup() {
    setBusy(true);
    setMsg("");
    try {
      const data = await exportService.getAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stash-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMsg("Backup downloaded.");
    } catch {
      setMsg("Export failed — try again.");
    }
    setBusy(false);
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (pw.next !== pw.confirm) {
      setPwMsg({ ok: false, text: "New passwords do not match." });
      return;
    }
    if (pw.next.length < 6) {
      setPwMsg({ ok: false, text: "Password must be at least 6 characters." });
      return;
    }
    setPwBusy(true);
    try {
      await apiClient.post("/api/auth/change-password", {
        currentPassword: pw.current,
        newPassword: pw.next,
      });
      setPw({ current: "", next: "", confirm: "" });
      setPwMsg({ ok: true, text: "Password changed successfully." });
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { error?: { message?: string } } } };
      setPwMsg({
        ok: false,
        text:
          e2?.response?.data?.error?.message ??
          "Could not change password — try again.",
      });
    }
    setPwBusy(false);
  }

  const themeOptions = [
    { id: "light" as const, label: "Light", icon: Sun },
    { id: "dark" as const, label: "Dark", icon: Moon },
    { id: "system" as const, label: "System", icon: Monitor },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Account and data controls.
        </p>
      </div>

      {/* Appearance */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-medium text-foreground">Appearance</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a light, dark or system theme.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {themeOptions.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTheme(id)}
              className="flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors"
              style={
                theme === id
                  ? {
                      borderColor: "var(--primary)",
                      color: "var(--primary)",
                      backgroundColor: "color-mix(in srgb, var(--primary) 8%, transparent)",
                    }
                  : {
                      borderColor: "var(--border)",
                      color: "var(--muted-foreground)",
                    }
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Change password */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 text-sm font-medium text-foreground">
          <KeyRound className="h-4 w-4" /> Change password
        </h2>
        <form onSubmit={changePassword} className="mt-4 space-y-3">
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="Current password"
            value={pw.current}
            onChange={(e) => setPw({ ...pw, current: e.target.value })}
            className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-input-foreground outline-none focus:border-primary"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="password"
              required
              autoComplete="new-password"
              placeholder="New password"
              value={pw.next}
              onChange={(e) => setPw({ ...pw, next: e.target.value })}
              className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-input-foreground outline-none focus:border-primary"
            />
            <input
              type="password"
              required
              autoComplete="new-password"
              placeholder="Confirm new password"
              value={pw.confirm}
              onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
              className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-input-foreground outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={pwBusy}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {pwBusy ? "Saving..." : "Change password"}
          </button>
          {pwMsg && (
            <p
              className="text-xs"
              style={{ color: pwMsg.ok ? "var(--success)" : "var(--destructive)" }}
            >
              {pwMsg.text}
            </p>
          )}
        </form>
      </div>

      {/* Plan & export */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Crown className="h-4 w-4 text-primary" /> Plan & Export
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Current plan:{" "}
          <span className="font-semibold capitalize text-foreground">{plan}</span>{" "}
          — Free includes 10 AI chats/day and 50 items total. Pro (₹399 / $9
          one-time) unlocks unlimited items, 200 AI chats/day and full export.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => doExport("json")}
            disabled={plan !== "pro" || expBusy}
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
          >
            Export JSON
          </button>
          <button
            onClick={() => doExport("markdown")}
            disabled={plan !== "pro" || expBusy}
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
          >
            Export Markdown
          </button>
          {plan !== "pro" && (
            <span className="rounded-xl bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              Upgrade to Pro — coming soon
            </span>
          )}
        </div>
        {expMsg && (
          <p className="mt-2 text-xs text-muted-foreground">{expMsg}</p>
        )}
      </div>

      {/* AI assistant */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Sparkles className="h-4 w-4 text-primary" /> AI Assistant
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your own free Groq or Gemini API key to enable AI Chat. The key
          is stored only in this browser — never sent to our server.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <select
            value={aiProvider}
            onChange={(e) => setAiProvider(e.target.value as AIProvider)}
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none"
          >
            <option value="groq">Groq (fast)</option>
            <option value="gemini">Gemini (generous free)</option>
          </select>
          <input
            type="password"
            value={aiKey}
            onChange={(e) => setAiKey(e.target.value)}
            placeholder={aiProvider === "groq" ? "gsk_…" : "AIza…"}
            className="h-10 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={aiSave}
            disabled={!aiKey.trim()}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
          >
            Save key
          </button>
          <button
            onClick={aiTest}
            disabled={!aiKey.trim() || aiBusy === "test"}
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
          >
            {aiBusy === "test" ? "Testing…" : "Test key"}
          </button>
          {aiCfg && (
            <button
              onClick={aiRemove}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
            >
              Remove
            </button>
          )}
        </div>
        {aiCfg && !aiMsg && (
          <p className="mt-2 text-xs text-muted-foreground">
            Active: {aiCfg.provider} key saved on this device.
          </p>
        )}
        {aiMsg && (
          <p
            className="mt-2 text-xs"
            style={{ color: aiMsg.ok ? "var(--success)" : "var(--destructive)" }}
          >
            {aiMsg.text}
          </p>
        )}
      </div>

      {/* Data backup */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-medium text-foreground">Data backup</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Download all your links, notes, notebooks, folders and pads as a
          JSON file.
        </p>
        <button
          onClick={downloadBackup}
          disabled={busy}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {busy ? "Exporting..." : "Export JSON"}
        </button>
        {msg && <p className="mt-2 text-xs text-muted-foreground">{msg}</p>}
      </div>
    </div>
  );
}
