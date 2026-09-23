import { Context } from "hono";
import { ApiError } from "../lib/api-error";
import { ApiResponse } from "../lib/api-response";

export async function errorHandler(err: Error, c: Context) {
  console.error(`[Error] ${err.message}`, {
    stack: err.stack,
    path: c.req.path,
    method: c.req.method,
  });

  if (err instanceof ApiError) {
    return ApiResponse.error(
      c,
      err.statusCode as any,
      err.message,
      err.code,
      err.details
    );
  }

  // Handle JSON parse errors
  if (err instanceof SyntaxError) {
    return ApiResponse.error(c, 400, "Invalid JSON body", "INVALID_JSON");
  }

  // DB waking up (Supabase free tier idle) — friendly + client retry karega
  if (/CONNECT_TIMEOUT|CONNECTION_REFUSED|ETIMEDOUT|EHOSTUNREACH/.test(
    `${(err as { code?: string }).code ?? ""} ${err.message}`
  )) {
    return ApiResponse.error(
      c,
      503,
      "Database is waking up — please try again",
      "DB_WAKING"
    );
  }

  // Unknown errors
  return ApiResponse.error(c, 500, "Internal server error", "INTERNAL_ERROR");
}