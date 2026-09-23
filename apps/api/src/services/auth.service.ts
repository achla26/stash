import { hash, compare } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { db, schema, rowify } from "../lib/db";
import { ApiError } from "../lib/api-error";
import type { LoginInput, SignupInput } from "@repo/contracts/schemas";
import type { User, Session, AuthResponse } from "@repo/contracts/types";
import type { UserRow } from "../types/auth.types";

const ACCESS_TTL = "1h";
const REFRESH_TTL = "30d";

function secret(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function accessSecret() {
  const s = process.env.ACCESS_TOKEN_SECRET;
  if (!s) throw ApiError.internal("ACCESS_TOKEN_SECRET is not set");
  return s;
}

function refreshSecret() {
  const s = process.env.REFRESH_TOKEN_SECRET ?? process.env.ACCESS_TOKEN_SECRET;
  if (!s) throw ApiError.internal("REFRESH_TOKEN_SECRET is not set");
  return s;
}

export class AuthService {
  // DB row (snake_case) → Contract type (camelCase)
  private static toUser(row: UserRow): User {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      avatar: row.avatar,
      plan: row.plan,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private static toSession(tokens: {
    accessToken: string;
    refreshToken: string;
  }): Session {
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: Math.floor(Date.now() / 1000) + 60 * 60,
      tokenType: "Bearer",
    };
  }

  private static async signTokens(userId: string, email: string) {
    const accessToken = await new SignJWT({ email, type: "access" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(userId)
      .setIssuedAt()
      .setExpirationTime(ACCESS_TTL)
      .sign(secret(accessSecret()));

    const refreshToken = await new SignJWT({ type: "refresh" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(userId)
      .setIssuedAt()
      .setExpirationTime(REFRESH_TTL)
      .sign(secret(refreshSecret()));

    return { accessToken, refreshToken };
  }

  static async verifyAccessToken(token: string): Promise<{ id: string; email: string }> {
    try {
      const { payload } = await jwtVerify(token, secret(accessSecret()));
      if (payload.type !== "access" || !payload.sub) {
        throw new Error("bad token type");
      }
      return { id: payload.sub, email: (payload.email as string) ?? "" };
    } catch {
      throw ApiError.unauthorized("Invalid or expired token");
    }
  }

  // Get user profile from users table
  private static async getUserProfile(userId: string): Promise<UserRow> {
    const rows = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    if (!rows.length) {
      throw ApiError.notFound("User profile not found");
    }
    return rowify(schema.users, rows[0]) as unknown as UserRow;
  }

  static async signup(dto: SignupInput): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();

    const existing = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (existing.length) {
      throw ApiError.conflict("User with this email already exists");
    }

    const passwordHash = await hash(dto.password, 10);

    const rows = await db
      .insert(schema.users)
      .values({
        email,
        name: dto.name.trim(),
        passwordHash,
      })
      .returning();

    const profile = rowify(schema.users, rows[0]) as unknown as UserRow;
    const tokens = await this.signTokens(profile.id, profile.email);

    return {
      user: this.toUser(profile),
      session: this.toSession(tokens),
    };
  }

  static async login(dto: LoginInput): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();

    const rows = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    const profile = rowify(schema.users, rows[0]) as unknown as UserRow | undefined;

    if (!profile || !(await compare(dto.password, profile.password_hash))) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    const tokens = await this.signTokens(profile.id, profile.email);

    return {
      user: this.toUser(profile),
      session: this.toSession(tokens),
    };
  }

  static async logout(_token: string): Promise<void> {
    // Stateless JWT — client token discard karta hai
  }

  static async getCurrentUser(token: string): Promise<User> {
    const { id } = await this.verifyAccessToken(token);
    const profile = await this.getUserProfile(id);
    return this.toUser(profile);
  }

  static async refreshToken(refreshToken: string): Promise<AuthResponse> {
    let userId: string;
    try {
      const { payload } = await jwtVerify(
        refreshToken,
        secret(refreshSecret())
      );
      if (payload.type !== "refresh" || !payload.sub) {
        throw new Error("bad token type");
      }
      userId = payload.sub;
    } catch {
      throw ApiError.unauthorized("Invalid refresh token");
    }

    const profile = await this.getUserProfile(userId);
    const tokens = await this.signTokens(profile.id, profile.email);

    return {
      user: this.toUser(profile),
      session: this.toSession(tokens),
    };
  }

  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId));
    if (!user) {
      throw ApiError.unauthorized("Invalid or expired token");
    }
    const ok = await compare(currentPassword, user.passwordHash);
    if (!ok) {
      throw ApiError.unauthorized("Current password is incorrect");
    }
    if (newPassword.length < 6) {
      throw ApiError.badRequest("New password must be at least 6 characters");
    }
    const passwordHash = await hash(newPassword, 10);
    await db
      .update(schema.users)
      .set({ passwordHash })
      .where(eq(schema.users.id, userId));
  }
}
