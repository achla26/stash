export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public details?: unknown;

  constructor(
    statusCode: number,
    message: string,
    code: string = "UNKNOWN_ERROR",
    details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  // Common errors as static methods
  static badRequest(message = "Bad request", details?: unknown) {
    return new ApiError(400, message, "BAD_REQUEST", details);
  }

  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message, "UNAUTHORIZED");
  }

  static forbidden(message = "Forbidden") {
    return new ApiError(403, message, "FORBIDDEN");
  }

  static notFound(message = "Resource not found", details?: unknown) {
    return new ApiError(404, message, "NOT_FOUND", details);
  }

  static conflict(message = "Resource already exists", details?: unknown) {
    return new ApiError(409, message, "CONFLICT", details);
  }

  static internal(message = "Internal server error") {
    return new ApiError(500, message, "INTERNAL_ERROR");
  }

  static fromSupabaseError(error: { message: string; code?: string; details?: unknown; hint?: string }) {
    const message = error.message || "Database error";

    if (error.code === "23505") {
      return ApiError.conflict("Resource already exists", { details: error.details });
    }
    if (error.code === "PGRST116") {
      return ApiError.notFound("Resource not found", { details: error.details });
    }

    return new ApiError(500, message, error.code || "DATABASE_ERROR", { details: error.details, hint: error.hint });
  }
}