import { readFile, readdir, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";

const root = resolve("deep-packet-inspection-studio");
const excludedDirectories = new Set(["build", "node_modules", ".git"]);
const excludedFiles = new Set([".env", "sample.pcap", "filtered.pcap", "report.json", "flows.csv"]);
const files = [];

async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;
    if (entry.isFile() && excludedFiles.has(entry.name)) continue;
    const absolute = resolve(directory, entry.name);
    if (entry.isDirectory()) await collect(absolute);
    else if (entry.isFile()) {
      const bytes = await readFile(absolute);
      files.push({ path: relative(root, absolute).replaceAll("\\", "/"), size: bytes.length, content: bytes.toString("base64") });
    }
  }
}

await collect(root);
files.sort((a, b) => a.path.localeCompare(b.path));
const esc = (value) => `'${String(value).replaceAll("'", "''")}'`;
const id = "small-36-sentinel-dpi-studio";
const latest = new Date("2026-10-07T09:36:00.000Z");
const scheduledAt = new Date(latest.getTime() + 24 * 60 * 60 * 1000).toISOString();
const createdAt = new Date().toISOString();
const sql = [
  `INSERT INTO projects (id,title,slug,description,collection,technologies,demo_url,status,created_at,scheduled_at,published_at,github_url,error,file_count) VALUES (${esc(id)},'SentinelDPI Studio','sentinel-dpi-studio','A privacy-first C++ deep packet inspection studio with explainable filtering, multithreaded flow analysis, TypeScript reporting and AXIOM AI.','small','["C++","TypeScript","Node.js","CMake","HTML","CSS"]',NULL,'queued',${esc(createdAt)},${esc(scheduledAt)},NULL,NULL,NULL,${files.length}) ON CONFLICT(id) DO UPDATE SET title=excluded.title,description=excluded.description,collection='small',technologies=excluded.technologies,status='queued',scheduled_at=excluded.scheduled_at,published_at=NULL,github_url=NULL,demo_url=NULL,error=NULL,file_count=excluded.file_count;`,
  `DELETE FROM project_files WHERE project_id=${esc(id)};`,
];
files.forEach((file, index) => {
  sql.push(`INSERT INTO project_files (id,project_id,path,size,content) VALUES (${esc(`${id}-file-${index + 1}`)},${esc(id)},${esc(file.path)},${file.size},${esc(file.content)});`);
});
sql.push("INSERT INTO bot_control (id,enabled,interval_minutes,updated_at) VALUES ('primary',1,1440,datetime('now')) ON CONFLICT(id) DO UPDATE SET enabled=1,interval_minutes=1440,updated_at=datetime('now');");
await writeFile(resolve(".autogit", "queue-sentinel-dpi.sql"), `${sql.join("\n")}\n`);
console.log(`Prepared ${files.length} files for Small Projects at ${scheduledAt}.`);
