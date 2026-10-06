import { desc, eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getWorkspaceUser } from "../../workspace-auth";
import { getDb } from "../../../db";
import { botControl, projectFiles, projects } from "../../../db/schema";

const MAX_FILES = 40;
// D1 stores the queued source files directly. Keep a practical free-tier cap.
const MAX_BYTES = 5 * 1024 * 1024;
const excluded = /(^|\/)(?:\.git|node_modules|dist|build|\.next|\.env(?:\..*)?|\.wrangler)(?:\/|$)/i;

export async function GET() {
  if (!await getWorkspaceUser()) return Response.json({ error: "Sign in to manage projects." }, { status: 401 });
  try {
    const db = getDb();
    const rows = await db.select().from(projects).orderBy(desc(projects.createdAt)).limit(100);
    return Response.json({ projects: rows });
  } catch {
    return Response.json({ error: "Project storage is unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!await getWorkspaceUser()) return Response.json({ error: "Sign in to manage projects." }, { status: 401 });
  try {
    if (Number(request.headers.get("content-length") || 0) > 8 * 1024 * 1024) return Response.json({ error: "Project folder must be under 5 MB." }, { status: 413 });
    const payload = await request.json() as { title?: string; description?: string; collection?: string; technologies?: string; demoUrl?: string; files?: { path: string; content: string; size: number }[] };
    const title = String(payload.title || "").trim().slice(0, 80);
    const description = String(payload.description || "").trim().slice(0, 500);
    const collection = String(payload.collection || "");
    const technologies = String(payload.technologies || "").split(",").map(x => x.trim()).filter(Boolean).slice(0, 8);
    const demoUrl = String(payload.demoUrl || "").trim();
    const files = Array.isArray(payload.files) ? payload.files : [];
    if (!title || !description || !["small", "mini"].includes(collection)) return Response.json({ error: "Add a title, description and collection." }, { status: 400 });
    if (demoUrl && !/^https:\/\/[^\s]+$/i.test(demoUrl)) return Response.json({ error: "Demo link must be an HTTPS URL." }, { status: 400 });
    if (files.length < 1 || files.length > MAX_FILES) return Response.json({ error: "Choose a folder with 1–40 files." }, { status: 400 });
    let total = 0;
    const paths = new Set<string>();
    const entries = files.map((file) => {
      const path = String(file.path || "").replaceAll("\\", "/").replace(/^[^/]+\//, "");
      if (!path || path.startsWith("/") || path.split("/").some(p => p === ".." || p === ".") || excluded.test(path) || paths.has(path)) throw new Error("Folder has duplicate, unsafe or generated files.");
      if (!Number.isInteger(file.size) || file.size < 0 || typeof file.content !== "string") throw new Error("Invalid project file.");
      paths.add(path);
      total += file.size;
      const bytes = Uint8Array.from(atob(file.content), character => character.charCodeAt(0));
      if (bytes.length !== file.size) throw new Error(`Invalid file size: ${path}`);
      return { file, path, bytes };
    });
    if (total > MAX_BYTES) return Response.json({ error: "Project folder must be under 5 MB." }, { status: 400 });
    const id = crypto.randomUUID();
    const slug = title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "project";
    const db = getDb();
    const now = new Date().toISOString();
    const [control] = await db.select().from(botControl).where(eq(botControl.id, "primary"));
    const [lastScheduled] = await db.select({ scheduledAt: projects.scheduledAt }).from(projects).orderBy(desc(projects.scheduledAt)).limit(1);
    const intervalMinutes = control?.intervalMinutes || 1440;
    const lastTime = lastScheduled?.scheduledAt ? Date.parse(lastScheduled.scheduledAt) : Date.now();
    const scheduledAt = new Date(Math.max(Date.now(), lastTime) + intervalMinutes * 60 * 1000).toISOString();
    await db.insert(projects).values({ id, title, slug, description, collection, technologies: JSON.stringify(technologies), demoUrl: demoUrl || null, status: "uploading", createdAt: now, scheduledAt, fileCount: entries.length });
    try {
      await db.insert(projectFiles).values(entries.map(({file,path}) => ({
        id: crypto.randomUUID(), projectId:id, path, size:file.size, content:file.content,
      })));
      await db.update(projects).set({ status:"queued" }).where(eq(projects.id,id));
    } catch {
      await db.update(projects).set({ status:"failed", error:"Upload did not complete. Please remove this entry and upload again." }).where(eq(projects.id,id));
      throw new Error("Upload did not complete.");
    }
    const [project] = await db.select().from(projects).where(eq(projects.id,id));
    return Response.json({ project }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not upload project." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  if (!await getWorkspaceUser()) return Response.json({ error: "Sign in to schedule projects." }, { status: 401 });
  const payload = await request.json().catch(() => null) as { projectId?: unknown; scheduledAt?: unknown } | null;
  const projectId = String(payload?.projectId || "");
  const scheduledAt = String(payload?.scheduledAt || "");
  const time = Date.parse(scheduledAt);
  if (!projectId || !Number.isFinite(time)) return Response.json({ error: "Choose a valid project date and time." }, { status: 400 });
  try {
    const db = getDb();
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (!project) return Response.json({ error: "Project was not found." }, { status: 404 });
    if (project.status === "published" || project.status === "publishing") return Response.json({ error: "Published projects cannot be rescheduled." }, { status: 400 });
    await db.update(projects).set({ scheduledAt: new Date(time).toISOString(), status: "queued", error: null }).where(eq(projects.id, projectId));
    const [updated] = await db.select().from(projects).where(eq(projects.id, projectId));
    return Response.json({ project: updated });
  } catch { return Response.json({ error: "Could not update the project schedule." }, { status: 503 }); }
}

