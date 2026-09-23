"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { folderService } from "@/lib/services";
import type {
  CreateFolderInput,
  UpdateFolderInput,
} from "@repo/contracts/schemas";

const folderKeys = {
  all: ["folders"] as const,
  byType: (type: string) => ["folders", "type", type] as const,
  detail: (id: string) => ["folder", id] as const,
  trash: ["folders", "trash"] as const,
};

export function useFolders() {
  return useQuery({
    queryKey: folderKeys.all,
    queryFn: folderService.getFolders,
  });
}

export function useTypeFolders(type: string) {
  return useQuery({
    queryKey: folderKeys.byType(type),
    queryFn: () => folderService.getFolderByType(type),
    enabled: !!type,
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateFolderInput) =>
      folderService.createFolder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderKeys.all });
    },
  });
}

export function useUpdateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: UpdateFolderInput & { id: string }) =>
      folderService.updateFolder(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderKeys.all });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => folderService.deleteFolder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderKeys.all });
    },
  });
}

export function useRestoreFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => folderService.restoreFolder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderKeys.all });
      queryClient.invalidateQueries({ queryKey: folderKeys.trash });
    },
  });
}

export function useTogglePinFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => folderService.togglePin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderKeys.all });
    },
  });
}