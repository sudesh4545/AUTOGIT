import { env } from "cloudflare:workers";
import { and, desc, eq, isNull, lt, or } from "drizzle-orm";
import { getDb } from "../db";
import { botControl, botRuns, projectFiles, projects } from "../db/schema";

type Project = typeof projects.$inferSelect;
const api = "https://api.github.com";
const headers = () => ({
  Authorization: `Bearer ${env.GITHUB_TOKEN}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "AutoGit-Studio",
  "Content-Type": "application/json",
});
const owner = () => env.GITHUB_OWNER || "sudesh4545";
const portfolioRepo = () => env.PORTFOLIO_REPO || "sudesh-portfolio";
const publishIntervalMs = (configuredMinutes?: number | null) => {
  if (configuredMinutes && Number.isFinite(configuredMinutes) && configuredMinutes > 0) return configuredMinutes * 60 * 1000;
  const minutes = Number(env.PUBLISH_INTERVAL_MINUTES || "2880");
  return Number.isFinite(minutes) && minutes > 0 ? minutes * 60 * 1000 : 48 * 60 * 60 * 1000;
};

async function gh(path: string, init: RequestInit = {}) {
  const response = await fetch(`${api}${path}`, { ...init, headers: { ...headers(), ...init.headers } });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub ${response.status}: ${body.slice(0, 240)}`);
  }
  return response.json() as Promise<any>;
}

function base64(bytes: Uint8Array) {
  let result = "";
  for (let index = 0; index < bytes.length; index += 32768) {
    result += String.fromCharCode(...bytes.slice(index, index + 32768));
  }
  return btoa(result);
}
function fromBase64(value: string) {
  return atob(value.replace(/\s/g, ""));
}
function utf8Base64(value: string) {
  return base64(new TextEncoder().encode(value));
}

async function getContent(repo: string, path: string): Promise<{ text: string; sha: string } | null> {
  const response = await fetch(`${api}/repos/${owner()}/${repo}/contents/${path}`, { headers: headers() });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Cannot read ${path} from ${repo}.`);
  const json = await response.json() as { content?: string; sha: string };
  const text = json.content ? new TextDecoder().decode(Uint8Array.from(fromBase64(json.content), c => c.charCodeAt(0))) : "";
  return { text, sha: json.sha };
}

async function putContent(repo: string, path: string, content: string, message: string) {
  const existing = await getContent(repo, path);
  await gh(`/repos/${owner()}/${repo}/contents/${path.split("/").map(encodeURIComponent).join("/")}`, {
    method: "PUT",
    body: JSON.stringify({ message, content: utf8Base64(content), ...(existing ? { sha: existing.sha } : {}) }),
  });
}

async function ensureRepo(name: string, title: string) {
  const existing = await fetch(`${api}/repos/${owner()}/${name}`, { headers: headers() });
  if (existing.ok) return;
  if (existing.status !== 404) throw new Error("Cannot verify the project repository.");
  await gh("/user/repos", {
    method: "POST",
    body: JSON.stringify({ name, description: `Mini project: ${title}`, private: false, auto_init: true }),
  });
}

async function ensurePages(repo: string) {
  const response = await fetch(`${api}/repos/${owner()}/${repo}/pages`, { method: "POST", headers: headers(), body: JSON.stringify({ source: { branch: "main", path: "/" } }) });
  if (!response.ok && ![409, 422].includes(response.status)) throw new Error(`GitHub Pages setup failed: ${response.status}`);
}

async function publishFiles(project: Project, repo: string) {
  const db = getDb();
  const files = await db.select().from(projectFiles).where(eq(projectFiles.projectId, project.id));
  if (files.length !== project.fileCount || !files.length) throw new Error("Project folder is incomplete.");
  for (const file of files) {
    if (!file.content) throw new Error(`Missing uploaded file: ${file.path}`);
    const content = file.content;
    const current = await getContent(repo, file.path);
    await gh(`/repos/${owner()}/${repo}/contents/${file.path.split("/").map(encodeURIComponent).join("/")}`, {
      method: "PUT",
      body: JSON.stringify({ message: `Add ${project.title}: ${file.path}`, content, ...(current ? { sha: current.sha } : {}) }),
    });
  }
}

async function syncPortfolio(project: Project, githubUrl: string, demoUrl: string) {
  const repo = portfolioRepo();
  const jsonPath = "src/data/autogit-projects.json";
  const sourcePath = "src/data/portfolio.ts";
  const currentJson = await getContent(repo, jsonPath);
  const feed = currentJson ? JSON.parse(currentJson.text) as { small: any[]; mini: any[] } : { small: [], mini: [] };
  const collection = project.collection === "small" ? feed.small : feed.mini;
  if (!collection.some(item => item.id === project.id)) collection.push({
    id: project.id,
    index: String(collection.length + 1).padStart(2, "0"),
    title: project.title,
    description: project.description,
    status: "published",
    technologies: JSON.parse(project.technologies),
    demoUrl,
    githubUrl,
  });
  await putContent(repo, jsonPath, `${JSON.stringify(feed, null, 2)}\n`, `Add ${project.title} to portfolio projects`);
  const source = await getContent(repo, sourcePath);
  if (!source) throw new Error("Portfolio project data source was not found.");
  if (source.text.includes("publishedAutogit")) return;
  const smallLine = "items: comingSoonProjects('small', 'Small Project'),";
  const miniLine = "items: comingSoonProjects('mini', 'Mini Project'),";
  if (!source.text.includes(smallLine) || !source.text.includes(miniLine)) throw new Error("Portfolio project sections changed; review the integration.");
  let updated = source.text.replace("import liveStats from './live-stats.json';", "import liveStats from './live-stats.json';\nimport autogitProjects from './autogit-projects.json';");
  updated = updated.replace("  ProjectCollection,", "  ProjectCollection,\n  ProjectCollectionItem,");
  updated = updated.replace("export const projectCollections: ProjectCollection[] = [", "const publishedAutogit = autogitProjects as { small: ProjectCollectionItem[]; mini: ProjectCollectionItem[] };\n\nexport const projectCollections: ProjectCollection[] = [");
  updated = updated.replace(smallLine, "items: [...publishedAutogit.small, ...comingSoonProjects('small', 'Small Project').slice(publishedAutogit.small.length)],");
  updated = updated.replace(miniLine, "items: [...publishedAutogit.mini, ...comingSoonProjects('mini', 'Mini Project').slice(publishedAutogit.mini.length)],");
  await putContent(repo, sourcePath, updated, "Connect AutoGit mini project feed");
}

export async function getBotState() {
  const db = getDb();
  await db.insert(botControl).values({ id: "primary", updatedAt: new Date().toISOString() }).onConflictDoNothing();
  const [control] = await db.select().from(botControl).where(eq(botControl.id, "primary"));
  const runs = await db.select().from(botRuns).orderBy(desc(botRuns.startedAt)).limit(8);
  return { control, runs };
}

export async function setBotEnabled(enabled: boolean, intervalMinutes?: number) {
  const db = getDb();
  await db.insert(botControl).values({ id: "primary", enabled, updatedAt: new Date().toISOString() }).onConflictDoUpdate({
    target: botControl.id,
    set: { enabled, ...(intervalMinutes ? { intervalMinutes } : {}), updatedAt: new Date().toISOString() },
  });
  return getBotState();
}

async function publishNextProject() {
  if (!env.GITHUB_TOKEN) return { status: "not_configured", message: "GitHub connection is not configured." };
  const db = getDb();
  const [last] = await db.select().from(projects).where(eq(projects.status, "published")).orderBy(desc(projects.publishedAt)).limit(1);
  const [control] = await db.select().from(botControl).where(eq(botControl.id, "primary"));
  if (last?.publishedAt && Date.now() - Date.parse(last.publishedAt) < publishIntervalMs(control?.intervalMinutes)) return { status: "not_due", message: "The next publishing window has not arrived." };
  const [project] = await db.select().from(projects).where(or(eq(projects.status, "queued"), eq(projects.status, "failed"))).orderBy(projects.createdAt).limit(1);
  if (!project) return { status: "empty", message: "No projects are queued." };
  const repo = `mini-${project.slug}-${project.id.slice(0, 6)}`;
  await db.update(projects).set({ status: "publishing", error: null }).where(eq(projects.id, project.id));
  try {
    await ensureRepo(repo, project.title);
    await publishFiles(project, repo);
    const githubUrl = `https://github.com/${owner()}/${repo}`;
    await ensurePages(repo);
    const demoUrl = project.demoUrl || `https://${owner()}.github.io/${repo}/`;
    await syncPortfolio(project, githubUrl, demoUrl);
    await db.update(projects).set({ status: "published", githubUrl, demoUrl, publishedAt: new Date().toISOString() }).where(eq(projects.id, project.id));
    return { status: "published", project: project.title, projectId: project.id, githubUrl, message: `${project.title} published to GitHub and portfolio.` };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Publishing failed.";
    await db.update(projects).set({ status: "failed", error: message }).where(eq(projects.id, project.id));
    return { status: "failed", project: project.title, projectId: project.id, message };
  }
}

export async function runPublisher() {
  const db = getDb();
  const { control } = await getBotState();
  if (!control.enabled) return { status: "paused", message: "Publishing is paused from Bot Control." };
  const now = new Date();
  const [locked] = await db.update(botControl)
    .set({ lockUntil: new Date(now.getTime() + 15 * 60 * 1000).toISOString() })
    .where(and(eq(botControl.id, "primary"), or(isNull(botControl.lockUntil), lt(botControl.lockUntil, now.toISOString()))))
    .returning({ id: botControl.id });
  if (!locked) return { status: "busy", message: "A publishing check is already running." };
  try {
    const result = await publishNextProject();
    const finishedAt = new Date().toISOString();
    if (!['not_due', 'empty'].includes(result.status)) {
      await db.insert(botRuns).values({
        id: crypto.randomUUID(), startedAt: finishedAt, status: result.status,
        message: result.message, projectId: "projectId" in result ? result.projectId : null,
      });
    }
    await db.update(botControl).set({ lastRunAt: finishedAt, lastStatus: result.status, lastMessage: result.message })
      .where(eq(botControl.id, "primary"));
    return result;
  } finally {
    await db.update(botControl).set({ lockUntil: null }).where(eq(botControl.id, "primary"));
  }
}
