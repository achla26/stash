import { serve } from "@hono/node-server";
import app from "./app";

serve(
  {
    fetch: app.fetch,
    port: 4000,
  },
  (info) => {
    console.log(`Stash API running on http://localhost:${info.port}`);
  }
);

export default app;
