"use client";

import { useEffect, useState } from "react";

import {
  useCreateLink,
  useLinks
} from "@/hooks/use-links";
import { toast } from "sonner";
import { CreateLinkDialog } from "@/components/links/create-link-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { LinksPageSkeleton } from "@/components/shared/skeletons/page-skeleton";
import { LinksDashboard } from "./links-dashboard";

export function LinksContent() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const {
    isLoading,
    isError,
    error,
    refetch,
  } = useLinks();

  const createLinkMutation = useCreateLink();

  // Share Target: login ke baad pending shared link save karo
  useEffect(() => {
    const pending = localStorage.getItem("stash_pending_share");
    if (!pending) return;
    localStorage.removeItem("stash_pending_share");
    try {
      const { url, title } = JSON.parse(pending) as { url?: string; title?: string };
      if (url) {
        createLinkMutation.mutate(
          { url, title: title || undefined, description: undefined },
          { onSuccess: () => toast.success("Shared link saved!") }
        );
      }
    } catch {
      // ignore malformed pending share
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) return <LinksPageSkeleton />;

  if (isError) {
    return (
      <div className="mx-auto max-w-6xl">
        <ErrorState
          message={(error as Error)?.message ?? "Failed to load links"}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-6xl space-y-6 my-4">
        <PageHeader
          title="Links"
          actionLabel="Save Link"
          onAction={() => setIsCreateOpen(true)}
        />

        <CreateLinkDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
        />
      </div>
      <LinksDashboard />
    </>
  );
}