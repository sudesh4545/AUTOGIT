import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const sourceOrigin = process.env.PAGES_SOURCE_URL || "http://127.0.0.1:11345";
const output = resolve("pages-static");
const routes = ["", "projects", "schedule", "activity", "bot", "settings", "github", "portfolio"];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(resolve("dist", "client"), output, { recursive: true });
await writeFile(resolve(output, ".nojekyll"), "");

for (const route of routes) {
  const response = await fetch(`${sourceOrigin}/${route}`);
  if (!response.ok) throw new Error(`Could not render /${route}: ${response.status}`);
  let html = await response.text();
  html = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<link\b[^>]*rel=["']modulepreload["'][^>]*\/?\s*>/gi, "")
    .replace(/(href|src|data-rsc-css-href)="\//g, '$1="/AUTOGIT/');
  for (const name of routes.filter(Boolean)) {
    html = html.replaceAll(`href="/AUTOGIT/${name}"`, `href="/AUTOGIT/${name}/"`);
  }
  const directory = route ? resolve(output, route) : output;
  await mkdir(directory, { recursive: true });
  await writeFile(resolve(directory, "index.html"), html);
}

const headersPath = resolve(output, "_headers");
try {
  const headers = await readFile(headersPath, "utf8");
  await writeFile(headersPath, headers);
} catch {}

console.log(`GitHub Pages export created at ${output}`);
