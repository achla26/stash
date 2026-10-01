"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { wordsService } from "@/lib/services";
import type { CreateWordInput, UpdateWordInput } from "@repo/contracts/schemas";

const wordKeys = {
  all: ["words"] as const,
};

export function useWords() {
  return useQuery({
    queryKey: wordKeys.all,
    queryFn: () => wordsService.getWords(),
  });
}

export function useCreateWord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWordInput) => wordsService.createWord(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wordKeys.all });
    },
  });
}

export function useUpdateWord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateWordInput & { id: string }) =>
      wordsService.updateWord(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wordKeys.all });
    },
  });
}

export function useToggleMastered() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => wordsService.toggleMastered(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wordKeys.all });
    },
  });
}

export function useDeleteWord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => wordsService.deleteWord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wordKeys.all });
    },
  });
}
