import { Hono } from "hono";
import { AuthController } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth";

const auth = new Hono();

auth.post("/signup", AuthController.signup);
auth.post("/login", AuthController.login);
auth.post("/logout", AuthController.logout);
auth.get("/me", AuthController.me);
auth.post("/refresh", AuthController.refresh);
auth.post("/forgot-password", AuthController.forgotPassword);
auth.post("/reset-password", AuthController.resetPassword);
auth.post("/google", AuthController.google);
auth.post("/change-password", authMiddleware, AuthController.changePassword);

export default auth;