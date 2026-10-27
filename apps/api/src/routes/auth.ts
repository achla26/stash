import { Hono } from "hono";
import { AuthController } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth";
import { rateLimit } from "../middleware/rate-limit";

const auth = new Hono();

// Public auth routes — rate-limited to prevent brute force / email bombing
auth.post("/signup", rateLimit({ max: 5 }), AuthController.signup);
auth.post("/login", rateLimit({ max: 10 }), AuthController.login);
auth.post("/logout", rateLimit({ max: 20 }), AuthController.logout);
auth.get("/me", AuthController.me);
auth.post("/refresh", rateLimit({ max: 20 }), AuthController.refresh);
auth.post(
  "/forgot-password",
  rateLimit({ max: 3 }),
  AuthController.forgotPassword
);
auth.post(
  "/reset-password",
  rateLimit({ max: 10 }),
  AuthController.resetPassword
);
auth.post("/google", rateLimit({ max: 10 }), AuthController.google);
auth.post("/change-password", authMiddleware, AuthController.changePassword);

export default auth;