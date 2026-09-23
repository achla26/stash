"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notesService } from "@/lib/services";
import type { CreateNoteInput, UpdateNoteInput } from "@repo/contracts/schemas";

const noteKeys = {
  all: ["notes"] as const,
  detail: (id: string) => ["note", id] as const,
  trash: ["notes", "trash"] as const,
};

export function useNotes() {
  return useQuery({
    queryKey: noteKeys.all,
    queryFn: notesService.getNotes,
  });
}

export function useNote(id: string) {
  return useQuery({
    queryKey: noteKeys.detail(id),
    queryFn: () => notesService.getNoteById(id),
    enabled: !!id,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload?: CreateNoteInput) =>
      notesService.createNote(payload!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.all });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: UpdateNoteInput & { id: string }) =>
      notesService.updateNote(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.all });
      queryClient.invalidateQueries({
        queryKey: noteKeys.detail(variables.id),
      });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notesService.deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.all });
    },
  });
}

export function useRestoreNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notesService.restoreNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.all });
      queryClient.invalidateQueries({ queryKey: noteKeys.trash });
    },
  });
}

export function usePermanentDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notesService.permanentDeleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.trash });
    },
  });
}

export function useTogglePinNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notesService.togglePin(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.all });
      queryClient.invalidateQueries({ queryKey: noteKeys.detail(id) });
    },
  });
}