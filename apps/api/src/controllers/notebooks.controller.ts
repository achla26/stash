import { Context } from "hono";
import { NotebooksService } from "@/services/notebook.service";
import { SectionsService } from "../services/sections.service";
import { PagesService } from "../services/pages.service";
import { ApiResponse } from "../lib/api-response";
import { ApiError } from "../lib/api-error";
import {
  createNotebookSchema,
  updateNotebookSchema,
  createSectionSchema,
  updateSectionSchema,
  createPageSchema,
  updatePageSchema,
} from "@repo/contracts/schemas";

const notebooksService = new NotebooksService();
const sectionsService = new SectionsService();
const pagesService = new PagesService();

export class NotebooksController {
  // ===== NOTEBOOKS =====

  static async getAll(c: Context) {
    const userId = c.get("user").id as string;
    const notebooks = await notebooksService.getAllWithCounts(userId);
    return ApiResponse.success(c, notebooks);
  }
  static async getById(c: Context) {
    const userId = c.get("user").id as string;
    const id = c.req.param("id") as string;
    const notebook = await notebooksService.getWithSections(id, userId); // ← changed
    return ApiResponse.success(c, notebook);
  }


  static async create(c: Context) {
    const userId = c.get("user").id as string;
    const body = await c.req.json();

    const parsed = createNotebookSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.badRequest("Validation failed", parsed.error.flatten());
    }

    const notebook = await notebooksService.create(userId, parsed.data);
    return ApiResponse.created(c, notebook, "Notebook created successfully");
  }

  static async update(c: Context) {
    const userId = c.get("user").id as string;
    const id = c.req.param("id") as string;
    const body = await c.req.json();

    const parsed = updateNotebookSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.badRequest("Validation failed", parsed.error.flatten());
    }

    const notebook = await notebooksService.update(id, userId, parsed.data);
    return ApiResponse.success(c, notebook, "Notebook updated successfully");
  }

  static async softDelete(c: Context) {
    const userId = c.get("user").id as string;
    const id = c.req.param("id") as string;
    await notebooksService.softDelete(id, userId);
    return ApiResponse.success(c, null, "Notebook moved to trash");
  }

  static async restore(c: Context) {
    const userId = c.get("user").id as string;
    const id = c.req.param("id") as string;
    const notebook = await notebooksService.restore(id, userId);
    return ApiResponse.success(c, notebook, "Notebook restored");
  }

  static async togglePin(c: Context) {
    const userId = c.get("user").id as string;
    const id = c.req.param("id") as string;
    const notebook = await notebooksService.togglePin(id, userId);
    const message = notebook.isPinned ? "Notebook pinned" : "Notebook unpinned";
    return ApiResponse.success(c, notebook, message);
  }

  static async getTrashed(c: Context) {
    const userId = c.get("user").id as string;
    const notebooks = await notebooksService.getTrashed(userId);
    return ApiResponse.success(c, notebooks);
  }

  // ===== SECTIONS =====

  static async getSections(c: Context) {
    const userId = c.get("user").id as string;
    const notebookId = c.req.param("id") as string;
    const sections = await sectionsService.getByNotebook(notebookId, userId);
    return ApiResponse.success(c, sections);
  }

  static async createSection(c: Context) {
    const userId = c.get("user").id as string;
    const notebookId = c.req.param("id") as string;
    const body = await c.req.json();

    const parsed = createSectionSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.badRequest("Validation failed", parsed.error.flatten());
    }

    await notebooksService.getById(notebookId, userId);

    const section = await sectionsService.createInNotebook(
      notebookId,
      userId,
      parsed.data
    );
    return ApiResponse.created(c, section, "Section created successfully");
  }

  static async updateSection(c: Context) {
    const userId = c.get("user").id as string;
    const sectionId = c.req.param("sectionId") as string;
    const body = await c.req.json();

    const parsed = updateSectionSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.badRequest("Validation failed", parsed.error.flatten());
    }

    const section = await sectionsService.update(sectionId, userId, parsed.data);
    return ApiResponse.success(c, section, "Section updated successfully");
  }

  static async deleteSection(c: Context) {
    const userId = c.get("user").id as string;
    const sectionId = c.req.param("sectionId") as string;
    await sectionsService.softDelete(sectionId, userId);
    return ApiResponse.success(c, null, "Section deleted");
  }

  // ===== PAGES =====

  static async getPages(c: Context) {
    const userId = c.get("user").id as string;
    const sectionId = c.req.param("sectionId") as string;
    const pages = await pagesService.getBySection(sectionId, userId);
    return ApiResponse.success(c, pages);
  }

  static async getPage(c: Context) {
    const userId = c.get("user").id as string;
    const pageId = c.req.param("pageId") as string;
    const page = await pagesService.getById(pageId, userId);
    return ApiResponse.success(c, page);
  }

  static async createPage(c: Context) {
    const userId = c.get("user").id as string;
    const notebookId = c.req.param("id") as string;
    const sectionId = c.req.param("sectionId") as string;
    const body = await c.req.json();

    const parsed = createPageSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.badRequest("Validation failed", parsed.error.flatten());
    }

    await sectionsService.getById(sectionId, userId);

    const page = await pagesService.createInSection(
      sectionId,
      notebookId,
      userId,
      parsed.data
    );
    return ApiResponse.created(c, page, "Page created successfully");
  }

  static async updatePage(c: Context) {
    const userId = c.get("user").id as string;
    const pageId = c.req.param("pageId") as string;
    const body = await c.req.json();

    const parsed = updatePageSchema.safeParse(body);
    if (!parsed.success) {
      throw ApiError.badRequest("Validation failed", parsed.error.flatten());
    }

    const page = await pagesService.update(pageId, userId, parsed.data);
    return ApiResponse.success(c, page, "Page updated successfully");
  }

  static async deletePage(c: Context) {
    const userId = c.get("user").id as string;
    const pageId = c.req.param("pageId") as string;
    await pagesService.softDelete(pageId, userId);
    return ApiResponse.success(c, null, "Page deleted");
  }
}