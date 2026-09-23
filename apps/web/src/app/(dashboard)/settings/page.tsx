"use client";

import { useState } from "react";
import { Download, Moon, Sun, Monitor, KeyRound } from "lucide-react";
import { exportService } from "@/lib/services";
import { useTheme } from "@/components/providers/theme-provider";
import { apiClient } from "@/lib/api-client";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

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
