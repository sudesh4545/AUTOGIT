import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  if (!env.DB) {
    throw new Error(
      "D1 binding `DB` is unavailable. Set the `d1` field in .autogit/hosting.json to `DB` or provide the binding through the hosting environment before using the database."
    );
  }

  return drizzle(env.DB, { schema });
}
