"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { linkService } from "@/lib/services";
import type { CreateLinkInput, UpdateLinkInput } from "@repo/contracts/schemas";

const linkKeys = {
  all: ["links"] as const,
  detail: (id: string) => ["link", id] as const,
  trash: ["links", "trash"] as const,
};

export function useLinks() {
  return useQuery({
    queryKey: linkKeys.all,
    queryFn: linkService.getLinks,
  });
}

export function useLink(id: string) {
  return useQuery({
    queryKey: linkKeys.detail(id),
    queryFn: () => linkService.getLinkById(id),
    enabled: !!id,
  });
}

export function useCreateLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateLinkInput) =>
      linkService.createLink(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: linkKeys.all });
    },
  });
}

export function useUpdateLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: UpdateLinkInput & { id: string }) =>
      linkService.updateLink(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: linkKeys.all });
      queryClient.invalidateQueries({
        queryKey: linkKeys.detail(variables.id),
      });
    },
  });
}

export function useDeleteLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => linkService.deleteLink(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: linkKeys.all });
    },
  });
}

export function useTogglePinLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => linkService.togglePin(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: linkKeys.all });
      queryClient.invalidateQueries({ queryKey: linkKeys.detail(id) });
    },
  });
}

export function useMoveLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      folderId,
    }: {
      id: string;
      folderId: string | null;
    }) => linkService.moveLink(id, folderId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: linkKeys.all });
      queryClient.invalidateQueries({
        queryKey: linkKeys.detail(variables.id),
      });
    },
  });
}