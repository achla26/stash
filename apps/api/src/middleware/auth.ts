import { Context, Next } from "hono";
import { ApiError } from "../lib/api-error";
import { AuthService } from "../services/auth.service";

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw ApiError.unauthorized("Missing or invalid authorization header");
  }

  const token = authHeader.split(" ")[1] ?? "";
  const user = await AuthService.verifyAccessToken(token);

  c.set("user", user);
  await next();
}
