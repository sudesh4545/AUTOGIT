import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const configPath = resolve("dist", "server", "wrangler.json");
const databaseId = process.env.AUTOGIT_D1_ID;

if (!databaseId) {
  throw new Error("AUTOGIT_D1_ID is required. Create the D1 database before preparing deployment.");
}

const config = JSON.parse(await readFile(configPath, "utf8"));
const database = config.d1_databases?.find((entry) => entry.binding === "DB");
if (!database) throw new Error("The generated Worker config has no DB binding.");

database.database_id = databaseId;
database.database_name = "autogit-d1";
// Queued source files are stored in D1, so R2 is not required (or billed).
config.r2_buckets = [];
// Check every minute; the D1 interval setting decides when a project is eligible.
config.triggers = { crons: ["* * * * *"] };
config.vars = {
  ...(config.vars || {}),
  GITHUB_OWNER: "sudesh4545",
  PORTFOLIO_REPO: "sudesh-portfolio",
  PUBLISH_INTERVAL_MINUTES: "2880",
};

await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
console.log(`Prepared Cloudflare deployment with D1 database ${databaseId}.`);
