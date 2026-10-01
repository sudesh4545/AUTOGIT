import { desc, eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";
import { getDb } from "../../../db";
import { projectFiles, projects } from "../../../db/schema";

const MAX_FILES = 40;
const MAX_BYTES = 10 * 1024 * 1024;
const excluded = /(^|\/)(?:\.git|node_modules|dist|build|\.next|\.env(?:\..*)?|\.wrangler)(?:\/|$)/i;

export async function GET() {
  if (!await getChatGPTUser()) return Response.json({ error: "Sign in to manage projects." }, { status: 401 });
  try {
    const db = getDb();
    const rows = await db.select().from(projects).orderBy(desc(projects.createdAt)).limit(100);
    return Response.json({ projects: rows });
  } catch {
    return Response.json({ error: "Project storage is unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!await getChatGPTUser()) return Response.json({ error: "Sign in to manage projects." }, { status: 401 });
  if (!env.BUCKET) return Response.json({ error: "Project storage is unavailable." }, { status: 503 });
  try {
    const form = await request.formData();
    const title = String(form.get("title") || "").trim().slice(0, 80);
    const description = String(form.get("description") || "").trim().slice(0, 500);
    const collection = String(form.get("collection") || "");
    const technologies = String(form.get("technologies") || "").split(",").map(x => x.trim()).filter(Boolean).slice(0, 8);
    const demoUrl = String(form.get("demoUrl") || "").trim();
    const files = form.getAll("files").filter((x): x is File => x instanceof File);
    const providedPaths = JSON.parse(String(form.get("paths") || "[]")) as string[];
    if (!title || !description || !["small", "mini"].includes(collection)) return Response.json({ error: "Add a title, description and collection." }, { status: 400 });
    if (demoUrl && !/^https:\/\/[^\s]+$/i.test(demoUrl)) return Response.json({ error: "Demo link must be an HTTPS URL." }, { status: 400 });
    if (files.length < 1 || files.length > MAX_FILES) return Response.json({ error: "Choose a folder with 1–40 files." }, { status: 400 });
    let total = 0;
    const paths = new Set<string>();
    const entries = files.map((file, index) => {
      const path = String(providedPaths[index] || file.name).replaceAll("\\", "/").replace(/^[^/]+\//, "");
      if (!path || path.startsWith("/") || path.split("/").some(p => p === ".." || p === ".") || excluded.test(path) || paths.has(path)) throw new Error("Folder has duplicate, unsafe or generated files.");
      paths.add(path);
      total += file.size;
      return { file, path };
    });
    if (total > MAX_BYTES) return Response.json({ error: "Project folder must be under 10 MB." }, { status: 400 });
    const id = crypto.randomUUID();
    const slug = title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "mini-project";
    const db = getDb();
    const now = new Date().toISOString();
    await db.insert(projects).values({ id, title, slug, description, collection, technologies: JSON.stringify(technologies), demoUrl: demoUrl || null, status: "uploading", createdAt: now, fileCount: entries.length });
    try {
      for (const {file,path} of entries) await env.BUCKET.put(`projects/${id}/${path}`, await file.arrayBuffer());
      await db.insert(projectFiles).values(entries.map(({file,path}) => ({ id: crypto.randomUUID(), projectId:id, path, size:file.size })));
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
