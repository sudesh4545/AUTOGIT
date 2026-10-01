"use client";

import { useEffect, useState } from "react";
import { Activity, ArrowUpRight, CalendarDays, Check, Clock3, Code2, FolderKanban, GitBranch, LayoutDashboard, Menu, Plus, Radio, Settings2, Sparkles, UploadCloud, X } from "lucide-react";

type View = "Overview" | "Projects" | "Schedule" | "Activity" | "Settings";
type Project = { id: string; title: string; description: string; collection: string; status: string; createdAt: string; publishedAt: string | null; githubUrl: string | null; error: string | null; fileCount: number };
const nav = [
  { label: "Overview" as View, icon: LayoutDashboard },
  { label: "Projects" as View, icon: FolderKanban },
  { label: "Schedule" as View, icon: CalendarDays },
  { label: "Activity" as View, icon: Activity },
  { label: "Settings" as View, icon: Settings2 },
];

export default function Studio() {
  const [view, setView] = useState<View>("Overview");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadError, setLoadError] = useState("");
  const [githubConnected, setGithubConnected] = useState(false);
  const [portfolioTarget, setPortfolioTarget] = useState("sudesh4545/sudesh-portfolio");
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [collection, setCollection] = useState<"small" | "mini">("mini");
  const [technologies, setTechnologies] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const queued = projects.filter(project => ["queued", "failed", "publishing"].includes(project.status));
  const published = projects.filter(project => project.status === "published");
  useEffect(() => {
    fetch("/api/projects").then(async response => {
      const data = await response.json() as { error?: string; projects: Project[] };
      if (!response.ok) throw new Error(data.error || "Could not load projects.");
      setProjects(data.projects);
    }).catch(error => setLoadError(error.message));
    fetch("/api/status").then(response => response.json() as Promise<{ githubConnected?: boolean; portfolioTarget?: string }>).then(data => { setGithubConnected(Boolean(data.githubConnected)); if(data.portfolioTarget) setPortfolioTarget(data.portfolioTarget); }).catch(() => {});
  }, []);
  async function uploadProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploadError("");
    setUploading(true);
    try {
      const total = files.reduce((sum, file) => sum + file.size, 0);
      if (files.length > 40 || total > 10 * 1024 * 1024) throw new Error("Choose at most 40 files under 10 MB total.");
      const encodedFiles = await Promise.all(files.map(async file => {
        const bytes = new Uint8Array(await file.arrayBuffer());
        let binary = "";
        for (let index = 0; index < bytes.length; index += 32768) binary += String.fromCharCode(...bytes.slice(index,index+32768));
        return { path: file.webkitRelativePath || file.name, size: file.size, content: btoa(binary) };
      }));
      const response = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, description, collection, technologies, demoUrl, files: encodedFiles }) });
      const data = await response.json() as { error?: string; project: Project };
      if (!response.ok) throw new Error(data.error || "Upload failed.");
      setProjects(current => [data.project, ...current]);
      setUploadOpen(false);
      setTitle(""); setDescription(""); setTechnologies(""); setDemoUrl(""); setFiles([]);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }
  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
      <div className="brand"><span className="brand-mark"><Code2 size={22}/></span><span><strong>autogit<span>.</span></strong><small>PROJECT STUDIO</small></span></div>
      <p className="side-label">WORKSPACE</p>
      <nav aria-label="Workspace navigation">{nav.map(({label,icon:Icon})=><button key={label} className={`nav-link ${view===label?"active":""}`} onClick={()=>{setView(label);setMenuOpen(false)}}><Icon size={18}/>{label}</button>)}</nav>
      <div className="sidebar-spacer"/>
      <div className="side-note"><Sparkles size={19}/><span><strong>Your publishing space</strong><small>Build, queue and ship from one place.</small></span></div>
      <div className="profile"><span className="avatar">SM</span><span><strong>Sudesh Mehar</strong><small>Workspace owner</small></span></div>
    </aside>
    <main className="main">
      <header className="topbar"><button className="mobile-menu" aria-label="Open menu" onClick={()=>setMenuOpen(!menuOpen)}><Menu size={22}/></button><span>Workspace <b>/</b> <strong>{view}</strong></span><small>AUTOMATED PROJECT PUBLISHING</small><span className="avatar top-avatar">SM</span></header>
      <div className="content">
        <div className="page-head"><div><span className="eyebrow">— &nbsp; COMMAND CENTER &nbsp; / 01</span><h1>{view==="Overview"?<>Your ideas, <em>in motion.</em></>:view}</h1><p>Manage your mini projects, publishing queue and portfolio updates in one studio.</p></div><button className="primary-button" onClick={()=>setUploadOpen(true)}><Plus size={18}/> Add project</button></div>
        {loadError && <div className="notice" role="status">{loadError} <a href="/signin-with-chatgpt?return_to=/">Sign in</a></div>}
        <div className="hero-grid">
          <section className="feature-card"><div className="feature-top"><span className="pill"><span/> PUBLISHING ENGINE</span><small>01 / 02</small></div><div className="orbit" aria-hidden="true"><div className="orbit-ring one"/><div className="orbit-ring two"/><div className="orbit-core"><GitBranch size={44}/></div></div><div className="feature-copy"><span className="eyebrow">AUTOMATION STUDIO</span><h2>From folder to<br/><em>the world.</em></h2><p>Upload a project once. The bot will deliver it to GitHub and your portfolio on your schedule.</p><button onClick={()=>setUploadOpen(true)} className="text-button">Queue your first project <ArrowUpRight size={16}/></button></div></section>
          <section className="status-card"><div className="panel-label"><span className="eyebrow">SYSTEM STATUS</span><Radio size={19}/></div><div className="status-art"><div><UploadCloud size={29}/></div></div><h3>{!githubConnected ? "GitHub connection pending" : queued.length ? "Publishing queue active" : "Ready for your first project"}</h3><p>{!githubConnected ? "Connect a publishing credential before the bot can push your projects." : queued.length ? `${queued.length} project${queued.length===1?"":"s"} waiting for the next publishing window.` : "Add a mini project to begin building your publishing queue."}</p><div className="status-bottom"><span><i/> {queued.length ? `${queued.length} in queue` : "Queue empty"}</span><button aria-label="Add project" onClick={()=>setUploadOpen(true)}><ArrowUpRight size={18}/></button></div></section>
        </div>
        <div className="stats"><div className="stat"><span className="stat-icon purple"><FolderKanban size={20}/></span><div><small>Queued projects</small><strong>{String(queued.length).padStart(2,"0")}</strong></div><span>Awaiting release</span></div><div className="stat"><span className="stat-icon teal"><Clock3 size={20}/></span><div><small>Publish cadence</small><strong>2 days</strong></div><span>One project per cycle</span></div><div className="stat"><span className="stat-icon pink"><GitBranch size={20}/></span><div><small>Published by bot</small><strong>{String(published.length).padStart(2,"0")}</strong></div><span>In your portfolio</span></div></div>
        <div className="bottom-grid"><section className="panel"><div className="panel-heading"><div><span className="eyebrow">PROJECT PIPELINE</span><h2>{view==="Projects"?"All projects":"Up next"}</h2></div><button onClick={()=>setView("Projects")}>View all <ArrowUpRight size={16}/></button></div>{projects.length ? <div className="project-list">{(view==="Projects"?projects:projects.slice(0,3)).map(project=><div className="project-row" key={project.id}><span className="project-glyph"><Code2 size={18}/></span><span><strong>{project.title}</strong><small>{project.collection==="mini"?"Mini":"Small"} project · {project.fileCount} files</small></span><span className={`project-status ${project.status}`}>{project.status}</span>{project.githubUrl&&<a href={project.githubUrl} target="_blank" rel="noreferrer" aria-label={`Open ${project.title} on GitHub`}><ArrowUpRight size={16}/></a>}{project.error&&<small className="project-error">{project.error}</small>}</div>)}</div> : <div className="empty"><div className="empty-icon"><FolderKanban size={29}/></div><h3>Nothing in the queue yet</h3><p>Your projects will appear here after you add them.</p><button className="outline-button" onClick={()=>setUploadOpen(true)}><Plus size={16}/> Add your first project</button></div>}</section><section className="panel"><div className="panel-heading"><div><span className="eyebrow">THE PUBLISHING RHYTHM</span><h2>How it flows</h2></div><span className="schedule-pill">EVERY 2 DAYS</span></div><div className="steps"><div><b>01</b><span><strong>Upload</strong><small>Add a mini project and its details.</small></span><UploadCloud size={18}/></div><div><b>02</b><span><strong>Queue</strong><small>Choose Small or Mini collection.</small></span><Clock3 size={18}/></div><div><b>03</b><span><strong>Publish</strong><small>Sync to GitHub and your portfolio.</small></span><Check size={18}/></div></div><p className="footnote"><CalendarDays size={16}/> The cloud bot can run while your laptop is off.</p></section></div>
        {view==="Schedule"&&<section className="detail-panel"><span className="eyebrow">PUBLISHING CALENDAR</span><h2>Every two days, one real project.</h2><p>{published.length && published[0].publishedAt ? `Last published ${new Date(published[0].publishedAt).toLocaleDateString()}. The next project becomes due 48 hours after that release.` : "The first queued project becomes eligible when the cloud bot runs. Later releases are spaced at least 48 hours apart."}</p><div className="detail-metrics"><span><Clock3 size={18}/> Daily cloud check</span><span><FolderKanban size={18}/> {queued.length} waiting</span><span><GitBranch size={18}/> {published.length} published</span></div></section>}
        {view==="Activity"&&<section className="detail-panel"><span className="eyebrow">REAL RELEASE HISTORY</span><h2>What has shipped</h2>{published.length?published.map(project=><div className="history-row" key={project.id}><span>{project.title}</span><small>{project.publishedAt&&new Date(project.publishedAt).toLocaleDateString()}</small><a href={project.githubUrl||"#"} target="_blank" rel="noreferrer">Open repository <ArrowUpRight size={15}/></a></div>):<p>Published projects and their GitHub links will appear here. The bot records actual releases only.</p>}</section>}
        {view==="Settings"&&<section className="detail-panel"><span className="eyebrow">CONNECTIONS</span><h2>Publishing destinations</h2><div className="setting-row"><span><GitBranch size={18}/> GitHub publishing</span><strong>{githubConnected?"Connected":"Setup needed"}</strong></div><div className="setting-row"><span><FolderKanban size={18}/> Portfolio repository</span><strong>{portfolioTarget}</strong></div><div className="setting-row"><span><CalendarDays size={18}/> Project cadence</span><strong>Every 2 days</strong></div><p>GitHub connection is configured securely on the hosted server. Repository access is never stored in your browser.</p></section>}
        <footer>AUTOGIT STUDIO · MADE FOR BUILDERS <span>SUDE SHIP SYSTEM / 2026</span></footer>
      </div>
    </main>
    {uploadOpen&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setUploadOpen(false)}}><form className="modal" role="dialog" aria-modal="true" aria-label="Add a project" onSubmit={uploadProject}><button type="button" className="close" aria-label="Close" onClick={()=>setUploadOpen(false)}><X size={20}/></button><span className="modal-icon"><UploadCloud size={26}/></span><span className="eyebrow">NEW PROJECT</span><h2>Put your next build in motion.</h2><p>Add a project folder and details to the publishing queue.</p><label>Project title<input required maxLength={80} value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Weather Widget"/></label><label>What it does<textarea required maxLength={500} value={description} onChange={e=>setDescription(e.target.value)} placeholder="A short, honest project description"/></label><label>Collection<select value={collection} onChange={e=>setCollection(e.target.value as "small"|"mini")}><option value="mini">Mini Projects</option><option value="small">Small Projects</option></select></label><label>Technologies<input value={technologies} onChange={e=>setTechnologies(e.target.value)} placeholder="React, TypeScript, CSS"/></label><label>Live demo URL <span>(optional)</span><input type="url" value={demoUrl} onChange={e=>setDemoUrl(e.target.value)} placeholder="https://..."/></label><label className="folder-input"><UploadCloud size={25}/><strong>{files.length ? `${files.length} files selected` : "Choose project folder"}</strong><small>Maximum 40 files and 10 MB. Exclude secrets and dependencies.</small><input type="file" multiple {...{webkitdirectory:""}} onChange={e=>setFiles(Array.from(e.target.files||[]).filter(file=>!/(^|\/)(node_modules|\.git|dist|build|\.next|\.env(?:\..*)?)(\/|$)/i.test(file.webkitRelativePath)))} /></label>{uploadError&&<p className="form-error" role="alert">{uploadError}</p>}<button className="primary-button submit-button" disabled={uploading||!files.length}>{uploading?"Uploading...":"Add to queue"}</button></form></div>}
  </div>;
}
