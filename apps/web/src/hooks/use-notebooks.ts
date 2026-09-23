"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notebookService } from "@/lib/services";
import type {
  CreateNotebookInput,
  UpdateNotebookInput,
  CreateSectionInput,
  UpdateSectionInput,
  CreatePageInput,
  UpdatePageInput,
} from "@repo/contracts/schemas";

const notebookKeys = {
  all: ["notebooks"] as const,
  detail: (id: string) => ["notebook", id] as const,
  sections: (notebookId: string) =>
    ["notebook", notebookId, "sections"] as const,
  pages: (notebookId: string, sectionId: string) =>
    ["notebook", notebookId, "section", sectionId, "pages"] as const,
  page: (pageId: string) => ["page", pageId] as const,
};

// ===== Notebooks =====

export function useNotebooks() {
  return useQuery({
    queryKey: notebookKeys.all,
    queryFn: notebookService.getNotebooks,
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
    mutationFn: ({
      id,
      ...payload
    }: UpdateNotebookInput & { id: string }) =>
      notebookService.updateNotebook(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: notebookKeys.all });
      queryClient.invalidateQueries({
        queryKey: notebookKeys.detail(variables.id),
      });
    },
  });
}

export function useDeleteNotebook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notebookService.deleteNotebook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notebookKeys.all });
    },
  });
}

// ===== Sections =====

export function useSections(notebookId: string) {
  return useQuery({
    queryKey: notebookKeys.sections(notebookId),
    queryFn: () => notebookService.getSections(notebookId),
    enabled: !!notebookId,
  });
}

export function useCreateSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      notebookId,
      ...payload
    }: CreateSectionInput & { notebookId: string }) =>
      notebookService.createSection(notebookId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: notebookKeys.sections(variables.notebookId),
      });
      queryClient.invalidateQueries({ queryKey: notebookKeys.all });
    },
  });
}

export function useUpdateSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      notebookId,
      sectionId,
      ...payload
    }: UpdateSectionInput & {
      notebookId: string;
      sectionId: string;
    }) => notebookService.updateSection(notebookId, sectionId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: notebookKeys.sections(variables.notebookId),
      });
    },
  });
}

export function useDeleteSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      notebookId,
      sectionId,
    }: {
      notebookId: string;
      sectionId: string;
    }) => notebookService.deleteSection(notebookId, sectionId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: notebookKeys.sections(variables.notebookId),
      });
      queryClient.invalidateQueries({ queryKey: notebookKeys.all });
    },
  });
}

// ===== Pages =====

export function usePages(notebookId: string, sectionId: string) {
  return useQuery({
    queryKey: notebookKeys.pages(notebookId, sectionId),
    queryFn: () => notebookService.getPages(notebookId, sectionId),
    enabled: !!notebookId && !!sectionId,
  });
}

export function usePage(pageId: string) {
  return useQuery({
    queryKey: notebookKeys.page(pageId),
    queryFn: () => notebookService.getPage(pageId),
    enabled: !!pageId,
  });
}

export function useCreatePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      notebookId,
      sectionId,
      ...payload
    }: CreatePageInput & {
      notebookId: string;
      sectionId: string;
    }) => notebookService.createPage(notebookId, sectionId, payload),
    onSuccess: () => {
      // Invalidate everything notebook related
      queryClient.invalidateQueries({ queryKey: ["notebook"] });
      queryClient.invalidateQueries({ queryKey: notebookKeys.all });
    },
  });
}

export function useUpdatePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      pageId,
      ...payload
    }: UpdatePageInput & { pageId: string }) =>
      notebookService.updatePage(pageId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: notebookKeys.page(variables.pageId),
      });
      // Also invalidate pages list so title updates show
      queryClient.invalidateQueries({ queryKey: ["notebook"] });
    },
  });
}

export function useDeletePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pageId: string) => notebookService.deletePage(pageId),
    onSuccess: () => {
      // Invalidate everything notebook related
      queryClient.invalidateQueries({ queryKey: ["notebook"] });
      queryClient.invalidateQueries({ queryKey: notebookKeys.all });
    },
  });
}