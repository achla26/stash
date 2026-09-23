"use client";

import { useState, useEffect } from "react";
import {
  X,
  Globe,
  Lock,
  KeyRound,
  Clock,
  Trash2,
  Copy,
  Check,
  Pencil,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PadVisibility, Pad } from "@repo/contracts/types";

interface PadSettingsProps {
  pad: Pad | null;
  onSave: (settings: {
    visibility: PadVisibility;
    password: string | null;
    expiresAt: string | null;
    allowEdit: boolean;
  }) => void;
  onDelete: () => void;
  isSaving: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const VISIBILITY_OPTIONS: {
  value: PadVisibility;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    value: "public",
    label: "Public",
    description: "Anyone with the link can view (read-only by default)",
    icon: Globe,
  },
  {
    value: "password",
    label: "Password Protected",
    description: "Requires password to view",
    icon: KeyRound,
  },
  {
    value: "private",
    label: "Private",
    description: "Only you can view and edit",
    icon: Lock,
  },
];

export function PadSettings({
  isOpen,
  onClose,
  pad,
  onSave,
  onDelete,
  isSaving,
}: PadSettingsProps) {
  const [visibility, setVisibility] = useState<PadVisibility>("public");
  const [password, setPassword] = useState("");
  const [enableExpiry, setEnableExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState("");
  const [allowEdit, setAllowEdit] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!pad) return;
    setVisibility(pad.visibility);
    setEnableExpiry(!!pad.expiresAt);
    setExpiryDate(
      pad.expiresAt
        ? new Date(pad.expiresAt).toISOString().slice(0, 16)
        : ""
    );
    setAllowEdit(pad.allowEdit || false);
    setPassword("");
    setConfirmingDelete(false);
  }, [pad]);

  // Early return BEFORE any pad access
  if (!isOpen || !pad) return null;

  const isAnonymousPad = !pad.userId;
  const hasExistingPassword = pad.visibility === "password";

  const getVisibilityOptions = () => {
    if (isAnonymousPad) {
      return VISIBILITY_OPTIONS.filter((opt) => opt.value !== "private");
    }
    return VISIBILITY_OPTIONS;
  };

  const handleSave = () => {
    // Validate password
    if (visibility === "password" && password && password.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }

    // New password protected but no existing password and no new password
    if (
      visibility === "password" &&
      !hasExistingPassword &&
      !password.trim()
    ) {
      toast.error("Please set a password");
      return;
    }

    // Resolve password
    let resolvedPassword: string | null = null;

    if (visibility === "password") {
      if (password.trim()) {
        resolvedPassword = password.trim(); // New password
      } else {
        resolvedPassword = null; // Keep existing (don't send)
      }
    } else {
      resolvedPassword = null; // Remove password
    }

    onSave({
      visibility,
      password: resolvedPassword,
      expiresAt:
        enableExpiry && expiryDate
          ? new Date(expiryDate).toISOString()
          : null,
      allowEdit: visibility === "private" ? false : allowEdit,
    });
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/pad/${pad.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-sm flex-col border-l border-border bg-card shadow-xl sm:w-80">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">Pad Settings</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6 overflow-y-auto p-5 app-scrollbar">
          <PadInfoCard pad={pad} />

          {/* Visibility */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Visibility
            </Label>
            <div className="space-y-2">
              {getVisibilityOptions().map((option) => {
                const Icon = option.icon;
                const isActive = visibility === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setVisibility(option.value);
                      if (option.value === "private") setAllowEdit(false);
                    }}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40 hover:bg-accent"
                    )}
                  >
                    <Icon
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <div>
                      <p
                        className={cn(
                          "text-sm font-medium",
                          isActive ? "text-primary" : "text-foreground"
                        )}
                      >
                        {option.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Allow Edit */}
          {(visibility === "public" || visibility === "password") && (
            <div className="space-y-3 rounded-lg border border-border bg-accent/30 p-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2 text-xs font-medium text-foreground">
                    <Pencil className="h-3.5 w-3.5" />
                    Allow Editing
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {visibility === "public"
                      ? "Anyone with the link can edit"
                      : "Anyone with the password can edit"}
                  </p>
                </div>
                <ToggleSwitch
                  enabled={allowEdit}
                  onToggle={() => setAllowEdit(!allowEdit)}
                />
              </div>
              {allowEdit && (
                <div className="rounded-md bg-primary/5 p-2 text-xs text-primary">
                  <Eye className="mr-1 inline h-3 w-3" />
                  Warning: Anyone who can view can also edit
                </div>
              )}
            </div>
          )}

          {/* Password */}
          {visibility === "password" && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                {hasExistingPassword ? "Change Password" : "Set Password"}
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    hasExistingPassword
                      ? "Enter new password..."
                      : "Enter password..."
                  }
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {showPassword ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                </button>
              </div>
              {password && password.length < 4 && (
                <p className="text-xs text-destructive">
                  Password must be at least 4 characters
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {hasExistingPassword
                  ? "Leave empty to keep the current password"
                  : "Set a password to protect this pad"}
              </p>
            </div>
          )}

          {/* Expiry */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Auto-expire
              </Label>
              <ToggleSwitch
                enabled={enableExpiry}
                onToggle={() => setEnableExpiry(!enableExpiry)}
              />
            </div>
            {enableExpiry && (
              <input
                type="datetime-local"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring [color-scheme:light] dark:[color-scheme:dark]"
              />
            )}
          </div>

          {/* Share */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Share
            </Label>
            <button
              onClick={handleCopyLink}
              className="group w-full rounded-lg border border-border p-3 text-left transition-all hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <p className="text-xs text-muted-foreground">Pad link</p>
              <p className="mt-0.5 truncate font-mono text-sm text-primary">
                {typeof window !== "undefined" && window.location.origin}
                /pad/{pad.slug}
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground group-hover:text-foreground">
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-success" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Click to copy
                  </>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="space-y-3 border-t border-border p-5">
          {!confirmingDelete ? (
            <>
              <p className="text-center text-xs text-muted-foreground">
                Deleting this pad is permanent and cannot be undone
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmingDelete(true)}
                  className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={
                    isSaving ||
                    (visibility === "password" &&
                      password.length > 0 &&
                      password.length < 4)
                  }
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary-hover"
                  size="sm"
                >
                  {isSaving ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-center text-xs text-muted-foreground">
                Delete this pad? This can&apos;t be undone.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmingDelete(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setConfirmingDelete(false);
                    onDelete();
                  }}
                  className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function PadInfoCard({ pad }: { pad: Pad }) {
  return (
    <div className="space-y-2 rounded-lg border border-border bg-accent/50 p-4">
      <div>
        <p className="text-xs text-muted-foreground">Pad URL</p>
        <p className="mt-0.5 font-mono text-sm font-medium text-foreground">
          /pad/{pad.slug}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Created</p>
          <p className="mt-0.5 text-sm font-medium text-foreground">
            {new Date(pad.createdAt).toLocaleDateString()}
          </p>
        </div>
        {pad.expiresAt && (
          <div>
            <p className="text-xs text-muted-foreground">Expires</p>
            <p className="mt-0.5 text-sm font-medium text-warning">
              {new Date(pad.expiresAt).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
      {pad.userId && (
        <div className="mt-2 rounded-md bg-primary/5 px-2 py-1 text-xs text-primary">
          ✓ You are the owner of this pad
        </div>
      )}
    </div>
  );
}

function ToggleSwitch({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      role="switch"
      aria-checked={enabled}
      className={cn(
        "relative h-6 w-11 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
        enabled ? "bg-primary" : "bg-accent"
      )}
    >
      <div
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
          enabled ? "translate-x-[22px]" : "translate-x-[2px]"
        )}
      />
    </button>
  );
}