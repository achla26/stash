import { Context } from "hono";
import { ContentfulStatusCode } from "hono/utils/http-status";

export interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export class ApiResponse {
  static success<T>(
    c: Context,
    data: T,
    message?: string,
    meta?: SuccessResponse<T>["meta"]
  ) {
    const response: SuccessResponse<T> = {
      success: true,
      data,
      ...(message && { message }),
      ...(meta && { meta }),
    };
    return c.json(response, 200 as ContentfulStatusCode);
  }

  static created<T>(
    c: Context,
    data: T,
    message = "Resource created successfully"
  ) {
    const response: SuccessResponse<T> = {
      success: true,
      data,
      message,
    };
    return c.json(response, 201 as ContentfulStatusCode);
  }

  static error(
    c: Context,
    statusCode: ContentfulStatusCode,
    message: string,
    code: string = "UNKNOWN_ERROR",
    details?: unknown
  ) {
    const response: ErrorResponse = {
      success: false,
      error: {
        code,
        message,
        ...(details !== undefined && { details }),
      },
    };
    return c.json(response, statusCode);
  }

  static noContent(c: Context) {
    return c.body(null, 204);
  }
}