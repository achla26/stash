"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notebookService } from "@/lib/services";
import type {
  CreateNotebookInput,
  UpdateNotebookInput,
} from "@repo/contracts/schemas";

const notebookKeys = {
  all: ["notebooks"] as const,
  detail: (id: string) => ["notebook", id] as const,
};

// ===== Notebooks =====

export function useNotebooks() {
  return useQuery({
    queryKey: notebookKeys.all,
    queryFn: () => notebookService.getNotebooks(),
  });
}

export function useNotebook(id: string) {
  return useQuery({
    queryKey: notebookKeys.detail(id),
    queryFn: () => notebookService.getNotebook(id),
    enabled: !!id,
  });
}

export function useCreateNotebook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateNotebookInput) =>
      notebookService.createNotebook(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notebookKeys.all });
    },
  });
}

export function useUpdateNotebook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateNotebookInput & { id: string }) =>
      notebookService.updateNotebook(id, payload),
    onSuccess: (notebook) => {
      queryClient.invalidateQueries({ queryKey: notebookKeys.all });
      queryClient.invalidateQueries({
        queryKey: notebookKeys.detail(notebook.id),
      });
    },
  });
}

export function useTogglePinNotebook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notebookService.togglePinNotebook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notebookKeys.all });
    },
  });
}

export function useDeleteNotebook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notebookService.deleteNotebook(id),
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: notebookKeys.all });
      queryClient.removeQueries({ queryKey: notebookKeys.detail(id) });
    },
  });
}
