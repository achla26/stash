"use client";

import { useEffect, useMemo, useState } from "react";
import { Link2 } from "lucide-react";

import {
  useCreateLink,
  useDeleteLink,
  useLinks,
  useTogglePinLink,
  useMoveLink,
} from "@/hooks/use-links";
import { toast } from "sonner";
import { CreateLinkDialog } from "@/components/links/create-link-dialog";
import { EditLinkDialog } from "@/components/links/edit-link-dialog";
import { CollectionBar } from "@/components/links/collection-bar";
import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LinksPageSkeleton } from "@/components/shared/skeletons/page-skeleton";
import { LinkCard } from "./link-card";
import type { Link } from "@repo/contracts/types";

export function LinksContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [activeCollection, setActiveCollection] = useState<
    string | undefined
  >(undefined);

  const {
    data: links = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useLinks();

  const createLinkMutation = useCreateLink();
  const deleteLinkMutation = useDeleteLink();

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
  const togglePinMutation = useTogglePinLink();
  const moveMutation = useMoveLink();

  const filteredLinks = useMemo(() => {
    return links.filter((link) => {
      const matchesSearch =
        (link.title ?? "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (link.description ?? "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        link.url.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCollection = activeCollection
        ? link.folderId === activeCollection
        : true;

      return matchesSearch && matchesCollection;
    });
  }, [links, searchQuery, activeCollection]);

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
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Links"
        actionLabel="Save Link"
        onAction={() => setIsCreateOpen(true)}
      />

      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search links..."
      />

      <CollectionBar
        activeCollection={activeCollection}
        onSelect={setActiveCollection}
      />

      {filteredLinks.length === 0 ? (
        <EmptyState
          icon={Link2}
          title="No links saved yet"
          description="Save your first link to get started."
          actionLabel="Save Link"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredLinks.map((link) => (
            <LinkCard
              key={link.id}
              link={link}
              onDelete={() => deleteLinkMutation.mutate(link.id)}
              isDeleting={deleteLinkMutation.isPending}
              onPin={() => togglePinMutation.mutate(link.id)}
              isPinning={togglePinMutation.isPending}
              onEdit={() => setEditingLink(link)}
              onMoveToFolder={(folderId) =>
                moveMutation.mutate({ id: link.id, folderId })
              }
            />
          ))}
        </div>
      )}

      <CreateLinkDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <EditLinkDialog
        link={editingLink}
        isOpen={!!editingLink}
        onClose={() => setEditingLink(null)}
      />
    </div>
  );
}