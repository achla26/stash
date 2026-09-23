"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Copy,
  Check,
  Loader2,
  Lock,
  ArrowLeft,
  Share2,
  Settings,
  AlertTriangle,
  Pencil,
  Eye,
  Infinity as InfinityIcon,
} from "lucide-react";

import {
  useCreatePad,
  usePad,
  useUpdatePad,
  useVerifyPadPassword,
  useDeletePad,
} from "@/hooks/use-pads";
import { useDebounce } from "@/hooks/use-debounce";
import { PadSettings } from "./pad-settings";
import { PadPrivateState } from "./pad-private-state";
import { Button } from "@/components/ui/button";
import type { PadVisibility, Pad } from "@repo/contracts/types";
import { toast } from "sonner";

type SaveStatus = "saved" | "unsaved" | "saving";

function getCurrentUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    return JSON.parse(userStr)?.id ?? null;
  } catch {
    return null;
  }
}

export function PadEditor() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const {
    data: padResponse,
    isLoading,
    refetch,
    error: padError,
    isError: isPadError,
  } = usePad(slug);

  const createPadMutation = useCreatePad();
  const updatePadMutation = useUpdatePad();
  const verifyPasswordMutation = useVerifyPadPassword();
  const deletePadMutation = useDeletePad();

  const [content, setContent] = useState("");
  const [password, setPassword] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [copied, setCopied] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [unlockedPad, setUnlockedPad] = useState<Pad | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  const isFirstLoad = useRef(true);
  const isNewPad = useRef(false);

  const currentUserId = getCurrentUserId();
  const padData = unlockedPad ?? padResponse?.data ?? null;
  const isOwner = !!(currentUserId && padData?.userId === currentUserId);

  useEffect(() => {
    if (isOwner) {
      setCanEdit(true);
      return;
    }
    if (unlockedPad) {
      setCanEdit(unlockedPad.allowEdit ?? false);
      return;
    }
    if (padResponse?.canEdit !== undefined) {
      setCanEdit(padResponse.canEdit);
      return;
    }
    setCanEdit(false);
  }, [isOwner, padResponse, unlockedPad]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const verified = sessionStorage.getItem(`pad_verified_${slug}`);
    const savedPassword = sessionStorage.getItem(`pad_password_${slug}`);

    if (verified === "true" && savedPassword) {
      verifyPasswordMutation.mutate(
        { slug, password: savedPassword },
        {
          onSuccess: (response) => {
            setUnlocked(true);
            setUnlockedPad(response.pad);
            setCanEdit(response.canEdit ?? false);
            setContent(response.pad.content ?? "");
            isFirstLoad.current = false;
          },
          onError: () => {
            sessionStorage.removeItem(`pad_verified_${slug}`);
            sessionStorage.removeItem(`pad_password_${slug}`);
            setUnlocked(false);
          },
        }
      );
    }
  }, [slug]);

  useEffect(() => {
    if (!padResponse) return;

    if (!padResponse.exists) {
      if (isNewPad.current) return;
      isNewPad.current = true;

      createPadMutation.mutate(
        { allowEdit: false, slug },
        {
          onSuccess: async () => {
            isFirstLoad.current = true;
            isNewPad.current = false;
            await refetch();
          },
          onError: () => {
            isNewPad.current = false;
          },
        }
      );
      return;
    }

    if (padResponse.isPasswordProtected && !unlocked && !isOwner) {
      setCanEdit(false);
      return;
    }

    if (padResponse.data && isFirstLoad.current) {
      setContent(padResponse.data.content ?? "");
      isFirstLoad.current = false;
    }
  }, [padResponse, unlocked, isOwner]);

  useEffect(() => {
    if (unlockedPad && isFirstLoad.current) {
      setContent(unlockedPad.content ?? "");
      isFirstLoad.current = false;
    }
  }, [unlockedPad]);

  const debouncedContent = useDebounce(content, 800);

  useEffect(() => {
    if (isFirstLoad.current || isNewPad.current || !slug) return;
    if (!canEdit) {
      setSaveStatus("saved");
      return;
    }

    setSaveStatus("saving");

    const savedPassword = sessionStorage.getItem(`pad_password_${slug}`);

    updatePadMutation.mutate(
      {
        slug,
        content: debouncedContent,
        ...(savedPassword ? { password: savedPassword } : {}),
      },
      {
        onSuccess: () => setSaveStatus("saved"),
        onError: () => setSaveStatus("unsaved"),
      }
    );
  }, [debouncedContent]);

  const handleContentChange = (value: string) => {
    if (!canEdit) {
      toast.error("You don't have permission to edit this pad");
      return;
    }
    setContent(value);
    if (!isFirstLoad.current) setSaveStatus("unsaved");
  };

  const handleVerifyPassword = () => {
    verifyPasswordMutation.mutate(
      { slug, password },
      {
        onSuccess: (response) => {
          setUnlocked(true);
          setUnlockedPad(response.pad);
          setCanEdit(response.canEdit ?? false);
          setContent(response.pad.content ?? "");

          sessionStorage.setItem(`pad_verified_${slug}`, "true");
          sessionStorage.setItem(`pad_password_${slug}`, password);

          toast.success("Pad unlocked!");
        },
        onError: () => {
          toast.error("Wrong password");
        },
      }
    );
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/pad/${slug}`
    );
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSettings = (settings: {
    visibility: PadVisibility;
    password: string | null;
    expiresAt: string | null;
    allowEdit: boolean;
  }) => {
    const payload: {
      slug: string;
      visibility: PadVisibility;
      allowEdit: boolean;
      password?: string | null;
      expiresAt?: string | null;
    } = {
      slug,
      visibility: settings.visibility,
      allowEdit: settings.allowEdit,
      expiresAt: settings.expiresAt ?? null,
    };

    if (settings.visibility === "password") {
      if (settings.password) {
        payload.password = settings.password;
      }
    } else {
      payload.password = null;
    }

    updatePadMutation.mutate(payload, {
      onSuccess: () => {
        setSettingsOpen(false);
        refetch();
        toast.success("Settings saved!");
      },
      onError: () => {
        toast.error("Failed to save settings");
      },
    });
  };

    const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handleDeletePad = () => {
    deletePadMutation.mutate(slug, {
      onSuccess: () => {
        toast.success("Pad deleted successfully");
        router.push("/pad");
      },
      onError: () => {
        toast.error("Failed to delete pad");
      },
    });
  };

  // ===== RENDER STATES =====

  if (isLoading || createPadMutation.isPending) {
    return <PadLoadingState />;
  }

  if (isPadError) {
    const apiError = padError as { error?: { code?: string; message?: string } };
    const code = apiError?.error?.code;
    const message = apiError?.error?.message;

    if (code === "PAD_EXPIRED") {
      return <PadExpiredState onBack={() => router.push("/pad")} />;
    }

    return (
      <PadPrivateState
        message={message ?? "Unable to load this pad"}
        onBack={() => router.push("/pad")}
      />
    );
  }

  if (padResponse?.error === "Pad has expired") {
    return <PadExpiredState onBack={() => router.push("/pad")} />;
  }

  if (
    padResponse &&
    !padResponse.exists &&
    !createPadMutation.isPending
  ) {
    return <PadNotFoundState onBack={() => router.push("/pad")} />;
  }

  if (
    padResponse?.exists &&
    padResponse?.isPasswordProtected &&
    !unlocked &&
    !isOwner
  ) {
    return (
      <PadPasswordScreen
        password={password}
        onPasswordChange={setPassword}
        onVerify={handleVerifyPassword}
        isPending={verifyPasswordMutation.isPending}
        hasError={verifyPasswordMutation.isError}
      />
    );
  }

  if (padData && !canEdit) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <PadTopBar
          slug={slug}
          saveStatus={saveStatus}
          isOwner={isOwner}
          canEdit={false}
          copied={copied}
          onBack={() => router.push("/pad")}
          onCopyLink={handleCopyLink}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <div className="border-b border-border bg-muted/50 px-4 py-2 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Eye className="h-3 w-3" />
            <span>Read-only mode — You cannot edit this pad</span>
          </div>
        </div>

        <div className="flex-1 p-6">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
            {content || "Empty pad"}
          </pre>
        </div>

        {isOwner && (
          <PadSettings
            isOpen={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            pad={padData}
            onSave={handleSaveSettings}
            onDelete={handleDeletePad}
            isSaving={updatePadMutation.isPending}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PadTopBar
        slug={slug}
        saveStatus={saveStatus}
        isOwner={isOwner}
        canEdit={true}
        copied={copied}
        onBack={() => router.push("/pad")}
        onCopyLink={handleCopyLink}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {!isOwner && padData?.allowEdit && (
        <div className="border-b border-primary/20 bg-primary/5 px-4 py-2 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-primary">
            <Pencil className="h-3 w-3" />
            <span>
              Collaborative mode — Anyone with this link can edit
            </span>
          </div>
        </div>
      )}

      <textarea
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        placeholder="Start typing..."
        className="flex-1 resize-none bg-transparent p-6 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
        autoFocus
        disabled={!canEdit}
      />

      <PadSettings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        pad={padData}
        onSave={handleSaveSettings}
        onDelete={handleDeletePad}
        isSaving={updatePadMutation.isPending}
      />
    </div>
  );
}

/* ===== Sub Components ===== */

function PadLoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading pad...</p>
      </div>
    </div>
  );
}

function PadNotFoundState({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="text-xl font-bold text-foreground">Pad not found</h2>
      <p className="text-sm text-muted-foreground">
        This pad doesn&apos;t exist or has been deleted.
      </p>
      <Button onClick={onBack} variant="outline">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Pads
      </Button>
    </div>
  );
}

function PadExpiredState({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-warning/10">
        <AlertTriangle className="h-8 w-8 text-warning" />
      </div>
      <h2 className="text-xl font-bold text-foreground">
        This pad has expired
      </h2>
      <p className="text-sm text-muted-foreground">
        This pad is no longer available.
      </p>
      <Button onClick={onBack} variant="outline">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Pads
      </Button>
    </div>
  );
}

function PadPasswordScreen({
  password,
  onPasswordChange,
  onVerify,
  isPending,
  hasError,
}: {
  password: string;
  onPasswordChange: (val: string) => void;
  onVerify: () => void;
  isPending: boolean;
  hasError: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-border bg-card p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Lock className="h-7 w-7 text-primary" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground">
            Password Protected
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the password to view this pad.
          </p>
        </div>

        <input
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onVerify()}
          placeholder="Enter password"
          className="w-full rounded-xl border border-border bg-transparent px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
        />

        {hasError && (
          <p className="text-sm text-destructive">Wrong password</p>
        )}

        <Button
          onClick={onVerify}
          disabled={isPending || !password}
          className="w-full bg-primary text-primary-foreground hover:bg-primary-hover"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Lock className="mr-2 h-4 w-4" />
          )}
          {isPending ? "Verifying..." : "Unlock"}
        </Button>
      </div>
    </div>
  );
}

function PadTopBar({
  slug,
  saveStatus,
  isOwner,
  canEdit,
  copied,
  onBack,
  onCopyLink,
  onOpenSettings,
}: {
  slug: string;
  saveStatus: SaveStatus;
  isOwner: boolean;
  canEdit: boolean;
  copied: boolean;
  onBack: () => void;
  onCopyLink: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
      <div className="flex items-center gap-3">
        <a href="/" className="flex h-7 w-7 items-center justify-center rounded-md bg-primary" aria-label="Home">
          <InfinityIcon className="h-4 w-4 text-white" />
        </a>
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="font-mono text-sm text-muted-foreground">
          /pad/{slug}
        </span>
        {canEdit && <SaveStatusIndicator status={saveStatus} />}
        {!canEdit && !isOwner && (
          <div className="flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5">
            <Eye className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Read-only
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCopyLink}
          className="gap-2"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-success" />
              Copied!
            </>
          ) : (
            <>
              <Share2 className="h-4 w-4" />
              Share
            </>
          )}
        </Button>
        {isOwner && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSettings}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        )}
      </div>
    </div>
  );
}

function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  return (
    <div className="flex items-center gap-1.5">
      {status === "saving" && (
        <>
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Saving</span>
        </>
      )}
      {status === "saved" && (
        <>
          <Check className="h-3 w-3 text-success" />
          <span className="text-xs text-success">Saved</span>
        </>
      )}
      {status === "unsaved" && (
        <>
          <div className="h-2 w-2 rounded-full bg-warning" />
          <span className="text-xs text-warning">Unsaved</span>
        </>
      )}
    </div>
  );
}