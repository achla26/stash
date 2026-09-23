"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  padService
} from "@/lib/services";
import type { CreatePadInput, UpdatePadInput } from "@repo/contracts/schemas";

const padKeys = {
  all: ["pads"] as const,
  detail: (slug: string) => ["pad", slug] as const,
  userPads: ["pads", "me"] as const,
};

export function usePad(slug: string) {
  return useQuery({
    queryKey: padKeys.detail(slug),
    queryFn: () => padService.getPad(slug),
    enabled: !!slug,
    retry: false,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

export function useUserPads() {
  return useQuery({
    queryKey: padKeys.userPads,
    queryFn: padService.getUserPads,
  });
}

export function useCreatePad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePadInput) => padService.createPad(payload),
    onSuccess: (pad) => {
      if (pad?.slug) {
        queryClient.invalidateQueries({
          queryKey: padKeys.detail(pad.slug),
        });
        queryClient.invalidateQueries({ queryKey: padKeys.userPads });
      }
    },
  });
}

interface UpdatePadVariables extends UpdatePadInput {
  slug: string;
}

export function useUpdatePad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, ...payload }: UpdatePadVariables) =>
      padService.updatePad(slug, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: padKeys.detail(variables.slug),
      });
    },
  });
}

export function useVerifyPadPassword() {
  return useMutation({
    mutationFn: ({
      slug,
      password,
    }: {
      slug: string;
      password: string;
    }) => padService.verifyPassword(slug, password),
  });
}

export function useDeletePad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slug: string) => padService.deletePad(slug),
    onSuccess: (_data, slug) => {
      queryClient.removeQueries({ queryKey: padKeys.detail(slug) });
      queryClient.invalidateQueries({ queryKey: padKeys.userPads });
    },
  });
}