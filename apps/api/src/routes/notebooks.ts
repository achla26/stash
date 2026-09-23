import { Hono } from "hono";
import { NotebooksController } from "../controllers/notebooks.controller";

const notebooks = new Hono();

// =========================================================================
// ⚠️  Static routes MUST come before dynamic /:id routes
// =========================================================================

// Trash (static) — before /:id or "trash" is captured as id
notebooks.get("/trash", NotebooksController.getTrashed);

// ─── Standalone Page routes (static prefix "pages") ───────────────────────
// Must be before /:id or "pages" is captured as id="pages"
notebooks.get("/pages/:pageId", NotebooksController.getPage);
notebooks.patch("/pages/:pageId", NotebooksController.updatePage);
notebooks.delete("/pages/:pageId", NotebooksController.deletePage);

// =========================================================================
// Notebooks (dynamic /:id — comes AFTER all static prefixes)
// =========================================================================
notebooks.get("/", NotebooksController.getAll);
notebooks.post("/", NotebooksController.create);
notebooks.get("/:id", NotebooksController.getById);
notebooks.patch("/:id", NotebooksController.update);
notebooks.delete("/:id", NotebooksController.softDelete);
notebooks.patch("/:id/restore", NotebooksController.restore);
notebooks.patch("/:id/pin", NotebooksController.togglePin);

// =========================================================================
// Sections (nested under /:id — safe, no conflict)
// =========================================================================
notebooks.get("/:id/sections", NotebooksController.getSections);
notebooks.post("/:id/sections", NotebooksController.createSection);
notebooks.patch("/:id/sections/:sectionId", NotebooksController.updateSection);
notebooks.delete("/:id/sections/:sectionId", NotebooksController.deleteSection);

// =========================================================================
// Pages (nested under /:id/sections/:sectionId — safe, no conflict)
// =========================================================================
notebooks.get("/:id/sections/:sectionId/pages", NotebooksController.getPages);
notebooks.post("/:id/sections/:sectionId/pages", NotebooksController.createPage);

export default notebooks;