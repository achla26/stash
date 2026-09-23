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
import pages from "./routes/pages";
import dashboard from "./routes/dashboard";
import exportRouter from "./routes/export";

const app = new Hono();
const api = new Hono();

// Global middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000"],
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
app.route("/api/pads/me", padsMe);

app.route("/api/pads", pads);
// Protected routes
api.use("*", authMiddleware);
api.route("/notes", notes);
api.route("/links", links);
api.route("/folders", folders);
api.route("/notebooks", notebooks);
api.route("/pages", pages);
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
