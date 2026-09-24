import { Hono } from "hono";
import { PadController } from "../controllers/pad.controller";

// ============================================
// PUBLIC ROUTES (No authentication needed)
// ============================================
const router = new Hono();

router.post("/", PadController.create);
router.get("/:slug", PadController.getBySlug);
router.post("/:slug/verify", PadController.verifyPassword);
router.patch("/:slug", PadController.update);
// delete — controller/service  owner check (login or owner-token)
router.delete("/:slug", PadController.delete);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================
export const protectedPadRoutes = new Hono();

protectedPadRoutes.get("/", PadController.getUserPads);
protectedPadRoutes.delete("/:slug", PadController.delete);

export default router;