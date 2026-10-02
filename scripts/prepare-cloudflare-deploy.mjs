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
config.r2_buckets = [{ binding: "BUCKET", bucket_name: "autogit-r2" }];
config.triggers = { crons: ["30 4 * * *"] };
config.vars = {
  ...(config.vars || {}),
  GITHUB_OWNER: "sudesh4545",
  PORTFOLIO_REPO: "sudesh-portfolio",
  PUBLISH_INTERVAL_MINUTES: "2880",
};

await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
console.log(`Prepared Cloudflare deployment with D1 database ${databaseId}.`);
