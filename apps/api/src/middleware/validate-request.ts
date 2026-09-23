import { ApiError } from "@/lib/api-error";
import { Context } from "hono";
import { ZodSchema } from "@repo/contracts/schemas";

export async function validateRequest<T>(c: Context, schema: ZodSchema<T>): Promise<T> {
    const body = await c.req.json();
    const parsed = schema.safeParse(body);
    
    if (!parsed.success) {
        throw ApiError.badRequest("Validation failed", parsed.error.flatten());
    }
    
    return parsed.data;
}