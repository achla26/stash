import type { HttpClient, ApiSuccessResponse } from "./http-client";
import type {
  CreateNotebookInput,
  UpdateNotebookInput,
  CreateSectionInput,
  UpdateSectionInput,
  CreatePageInput,
  UpdatePageInput,
} from "@repo/contracts/schemas";
import type {
  NotebookWithCounts,
  NotebookWithSections,
  Notebook,
  SectionWithPages,
  Section,
  Page,
} from "@repo/contracts/types";

// ─── helper ──────────────────────────────────────────────────────────────────
// Unwraps { data: T } response so every method stays clean
function unwrap<T>(res: unknown): T {
  return (res as ApiSuccessResponse<T>).data;
}

function unwrapList<T>(res: unknown): T[] {
  return (res as ApiSuccessResponse<T[]>).data ?? [];
}

// ─── factory ─────────────────────────────────────────────────────────────────
export function createNotebookService(client: HttpClient) {
  return {


    /** Returns all notebooks with section/page counts */
    async getNotebooks(): Promise<NotebookWithCounts[]> {
      const res = await client.get<ApiSuccessResponse<NotebookWithCounts[]>>(
        "/api/notebooks"
      );
      return unwrapList<NotebookWithCounts>(res);
    },

    /**
     * Returns a single notebook WITH its sections and each section's pages.
     * The detail screen iterates `notebook.sections[].pages` so we need the
     * richer type here.
     */
    async getNotebook(id: string): Promise<NotebookWithSections> {
      const res = await client.get<ApiSuccessResponse<NotebookWithSections>>(
        `/api/notebooks/${id}`
      );
      return unwrap<NotebookWithSections>(res);
    },

    async createNotebook(payload: CreateNotebookInput): Promise<Notebook> {
      const res = await client.post<ApiSuccessResponse<Notebook>>(
        "/api/notebooks",
        payload
      );
      return unwrap<Notebook>(res);
    },

    async updateNotebook(
      id: string,
      payload: UpdateNotebookInput
    ): Promise<Notebook> {
      const res = await client.patch<ApiSuccessResponse<Notebook>>(
        `/api/notebooks/${id}`,
        payload
      );
      return unwrap<Notebook>(res);
    },

    /** Soft-deletes the notebook and returns its id for cache removal */
    async deleteNotebook(id: string): Promise<string> {
      await client.delete(`/api/notebooks/${id}`);
      return id;
    },

    // =========================================================================
    // Sections
    // =========================================================================

    /** Returns sections with their nested pages array */
    async getSections(notebookId: string): Promise<SectionWithPages[]> {
      const res = await client.get<ApiSuccessResponse<SectionWithPages[]>>(
        `/api/notebooks/${notebookId}/sections`
      );
      return unwrapList<SectionWithPages>(res);
    },

    async createSection(
      notebookId: string,
      payload: CreateSectionInput
    ): Promise<Section> {
      const res = await client.post<ApiSuccessResponse<Section>>(
        `/api/notebooks/${notebookId}/sections`,
        payload
      );
      return unwrap<Section>(res);
    },

    async updateSection(
      notebookId: string,
      sectionId: string,
      payload: UpdateSectionInput
    ): Promise<Section> {
      const res = await client.patch<ApiSuccessResponse<Section>>(
        `/api/notebooks/${notebookId}/sections/${sectionId}`,
        payload
      );
      return unwrap<Section>(res);
    },

    /** Soft-deletes the section and returns its id for cache removal */
    async deleteSection(
      notebookId: string,
      sectionId: string
    ): Promise<string> {
      await client.delete(
        `/api/notebooks/${notebookId}/sections/${sectionId}`
      );
      return sectionId;
    },

    // =========================================================================
    // Pages
    // =========================================================================

    async getPages(notebookId: string, sectionId: string): Promise<Page[]> {
      const res = await client.get<ApiSuccessResponse<Page[]>>(
        `/api/notebooks/${notebookId}/sections/${sectionId}/pages`
      );
      return unwrapList<Page>(res);
    },

    /**
     * Standalone page lookup — uses /api/pages/:id, NOT the nested notebook
     * path, to avoid knowing notebookId / sectionId at call-site.
     */
    async getPage(pageId: string): Promise<Page> {
      const res = await client.get<ApiSuccessResponse<Page>>(
        `/api/pages/${pageId}`          // ← fixed: was /api/notebooks/pages/:id
      );
      return unwrap<Page>(res);
    },

    async createPage(
      notebookId: string,
      sectionId: string,
      payload: CreatePageInput
    ): Promise<Page> {
      const res = await client.post<ApiSuccessResponse<Page>>(
        `/api/notebooks/${notebookId}/sections/${sectionId}/pages`,
        payload
      );
      return unwrap<Page>(res);
    },

    async updatePage(pageId: string, payload: UpdatePageInput): Promise<Page> {
      const res = await client.patch<ApiSuccessResponse<Page>>(
        `/api/pages/${pageId}`,         // ← fixed: was /api/notebooks/pages/:id
        payload
      );
      return unwrap<Page>(res);
    },

    /** Soft-deletes the page and returns its id for cache removal */
    async deletePage(pageId: string): Promise<string> {
      await client.delete(`/api/pages/${pageId}`); // ← fixed: was /api/notebooks/pages/:id
      return pageId;
    },
  };
}

export type NotebookService = ReturnType<typeof createNotebookService>;