import { Hono } from "hono";
import { MetaService } from "../services/meta.service";
import { ApiResponse } from "../lib/api-response";
import { LinksController } from "../controllers/links.controller";

const linksController = new LinksController();
const router = new Hono();

// Basic CRUD routes (inherited from base controller)
router.get("/", (c) => linksController.getAll(c));
router.get("/paginated", (c) => linksController.getPaginated(c));
router.get("/trash", (c) => linksController.getTrashed(c));
router.get("/count", (c) => linksController.getCount(c));
router.get("/search", (c) => linksController.search(c));
router.get("/:id", (c) => linksController.getById(c));
router.post("/", (c) => linksController.create(c));
router.patch("/:id", (c) => linksController.update(c));
router.delete("/:id", (c) => linksController.softDelete(c));
router.post("/:id/restore", (c) => linksController.restore(c));
router.delete("/:id/permanent", (c) => linksController.permanentDelete(c));

// Bulk operations (from base controller)
router.post("/bulk/soft-delete", (c) => linksController.bulkSoftDelete(c));
router.post("/bulk/permanent-delete", (c) => linksController.bulkPermanentDelete(c));

// URL preview — auto title/icon (ported from May repo)
router.post("/fetch-meta", async (c) => {
  const body = await c.req.json();
  const url = typeof body?.url === "string" ? body.url : "";
  if (!/^https?:\/\/.+/.test(url)) {
    return ApiResponse.success(c, {}, "invalid url");
  }
  const preview = await MetaService.fetchUrlPreview(url);
  return ApiResponse.success(c, preview);
});

// Custom endpoints
router.post("/:id/toggle-pin", (c) => linksController.togglePin(c));
router.post("/:id/move", (c) => linksController.moveLink(c));

export default router;