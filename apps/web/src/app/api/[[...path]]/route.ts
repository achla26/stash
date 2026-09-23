import app from "@repo/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Same Hono app, serverless ke andar — Vercel pe yahi API hai
const handler = (req: Request) => app.fetch(req);

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as OPTIONS,
  handler as HEAD,
};
