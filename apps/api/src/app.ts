import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authMiddleware } from "./middleware/auth";
import { errorHandler } from "./middleware/error-handler";
import auth from "./routes/auth";
import notes from "./routes/notes";
import links from "./routes/links"; 
import folders from "./routes/folders"; 
import notebooks from "./routes/notebooks"; 
import pads, { protectedPadRoutes } from "./routes/pads";
import { PadController } from "./controllers/pad.controller";
import { NotesController } from "./controllers/notes.controller";
import { UploadsController } from "./controllers/uploads.controller";
import dashboard from "./routes/dashboard";
import exportRouter from "./routes/export";

const app = new Hono();
const api = new Hono();

// Global middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: (origin, c) => {
      if (!origin) return origin; // non-browser / same-origin
      const host = c.req.header("host") ?? "";
      if (origin === `http://${host}` || origin === `https://${host}`) {
        return origin;
      }
      const allowed = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        ...(process.env.CORS_ORIGIN ?? "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
      ];
      if (allowed.includes(origin) || origin.endsWith(".vercel.app")) {
        return origin;
      }
      return null;
    },
    credentials: true,
  })
);

// Global error handler
app.onError(errorHandler);

// Health check
app.get("/health", (c) => {
  return c.json({
    success: true,
    data: {
      status: "ok",
      app: "Stash API",
      timestamp: new Date().toISOString(),
    },
  });
});

// Public auth routes (no middleware)
app.route("/api/auth", auth);

// Protected /api/pads/me — MUST be before public /api/pads/:slug
const padsMe = new Hono();
padsMe.use("*", authMiddleware);
padsMe.route("/", protectedPadRoutes);
 
app.on("DELETE", "/api/pads/me/:slug", (c) => PadController.delete(c));

app.route("/api/pads/me", padsMe);

app.route("/api/pads", pads);

api.get("/notes/public/:slug", NotesController.getByPublicSlug);
api.get("/uploads/:id", UploadsController.get);

// Protected routes
api.use("*", authMiddleware);
api.post("/uploads", UploadsController.create);
api.route("/notes", notes);
api.route("/links", links);
api.route("/folders", folders);
api.route("/notebooks", notebooks);
api.route("/dashboard", dashboard);
api.route("/export", exportRouter);


// Mount protected group
app.route("/api", api);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: `Route ${c.req.method} ${c.req.path} not found`,
      },
    },
    404
  );
});

export default app;
