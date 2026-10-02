"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity, ArrowUpRight, Bot, CalendarDays, ChevronRight, Command,
  FolderKanban, GitBranch, LayoutDashboard, Menu, Plus, Radio,
  Settings2, ShieldCheck, UploadCloud,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ParticleField } from "./particle-field";
import { StudioProvider, useStudio } from "./studio-context";

const navigation = [
  { href: "/", label: "Overview", icon: LayoutDashboard, index: "01" },
  { href: "/projects", label: "Projects", icon: FolderKanban, index: "02" },
  { href: "/schedule", label: "Schedule", icon: CalendarDays, index: "03" },
  { href: "/activity", label: "Activity", icon: Activity, index: "04" },
  { href: "/bot", label: "Bot Control", icon: Bot, index: "05" },
  { href: "/settings", label: "Settings", icon: Settings2, index: "06" },
];

function ShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [, startTransition] = useTransition();
  const { connection, botEnabled, error, loading, setUploaderOpen, accessKey, setAccessKey, refresh } = useStudio();
  const [accessOpen, setAccessOpen] = useState(false);
  const [accessInput, setAccessInput] = useState(accessKey);
  const active = navigation.find(item => item.href === pathname) || { label: pathname === "/github" ? "GitHub" : pathname === "/portfolio" ? "Portfolio" : "Overview" };

  useEffect(() => { setMenuOpen(false); setNavigating(false); }, [pathname]);
  const navigate = (href: string, event?: React.MouseEvent<HTMLAnchorElement>) => {
    if (event && (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
    event?.preventDefault();
    if (href !== pathname) setNavigating(true);
    if (menuOpen) setMenuOpen(false);
    if (href !== pathname) startTransition(() => router.push(href));
  };
  const warmRoute = (href: string) => { if (href !== pathname) void router.prefetch(href); };

  return <div className="studio-shell">
    <ParticleField />
    <div className="ambient-grid" aria-hidden="true" />
    {menuOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
    <aside className={`studio-sidebar ${menuOpen ? "sidebar-visible" : ""}`}>
      <Link className="wordmark" href="/" aria-label="AutoGit Studio home">
        <span className="wordmark-icon"><Command size={22} strokeWidth={2.2} /></span>
        <span><strong>AUTO<span>GIT</span></strong><small>MISSION CONTROL</small></span>
      </Link>
      <div className="sidebar-section-title">WORKSPACE <span>01—06</span></div>
      <nav aria-label="Main navigation" className="sidebar-nav">
        {navigation.map(({ href, label, icon: Icon, index }) =>
          <a key={href} href={href} onMouseEnter={() => warmRoute(href)} onTouchStart={() => warmRoute(href)} onClick={(event) => navigate(href, event)} aria-current={pathname === href ? "page" : undefined} className={`sidebar-link ${pathname === href ? "is-active" : ""}`}>
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
            <small>{index}</small>
          </a>
        )}
      </nav>
      <div className="sidebar-divider" />
      <div className="sidebar-section-title">DESTINATIONS</div>
      <a href="/github" onMouseEnter={() => warmRoute("/github")} onTouchStart={() => warmRoute("/github")} onClick={(event) => navigate("/github", event)} aria-current={pathname === "/github" ? "page" : undefined} className={`destination ${pathname === "/github" ? "is-active" : ""}`}><GitBranch size={17} /><span>GitHub</span><i className={connection.githubConnected ? "live" : ""} /></a>
      <a href="/portfolio" onMouseEnter={() => warmRoute("/portfolio")} onTouchStart={() => warmRoute("/portfolio")} onClick={(event) => navigate("/portfolio", event)} aria-current={pathname === "/portfolio" ? "page" : undefined} className={`destination ${pathname === "/portfolio" ? "is-active" : ""}`}><Radio size={17} /><span>Portfolio</span><i className={connection.storageReady ? "live" : ""} /></a>
      <div className="sidebar-bottom">
        <div className="sidebar-system">
          <span className="system-halo"><ShieldCheck size={22} /></span>
          <strong>Cloud publishing</strong>
          <p>Cloud checks continue even when your laptop is off.</p>
          <span className="system-caption"><i /> {botEnabled === false ? "PUBLISHING PAUSED" : "DAILY CHECK · 10:00 IST"}</span>
        </div>
        <div className="owner-row"><span className="owner-avatar">SM</span><span><strong>Sudesh Mehar</strong><small>Workspace owner</small></span><ChevronRight size={15} /></div>
      </div>
    </aside>
    <div className="studio-main">
      <header className="studio-topbar">
        <button className="menu-trigger" aria-label="Open navigation" onClick={() => setMenuOpen(true)}><Menu size={21} /></button>
        <span className="breadcrumbs">AUTOGIT <ChevronRight size={13} /> <strong>{active.label.toUpperCase()}</strong></span>
        <span className="topbar-center">PROJECT AUTOMATION SYSTEM</span>
        <div className="topbar-actions"><span className="topbar-live"><i /> {botEnabled === false ? "BOT PAUSED" : connection.githubConnected ? "SYSTEM ONLINE" : "SETUP REQUIRED"}</span>{!accessKey && <button className="outline-action unlock-action" onClick={() => setAccessOpen(true)}><ShieldCheck size={16}/><span>UNLOCK CONTROLS</span></button>}<button className="topbar-add" onClick={() => setUploaderOpen(true)}><Plus size={17}/><span>ADD PROJECT</span></button></div>
      </header>
      <main className="page-main">
        {error && <div className="site-alert" role="alert">{error} <button className="site-alert-action" onClick={() => setAccessOpen(true)}>UNLOCK</button></div>}
        {(loading || navigating) && <div className="loading-line navigation-line" aria-label={navigating ? "Opening page" : "Loading studio data"} />}
        {children}
      </main>
      <footer className="studio-footer"><span>© 2026 AUTO<span>GIT</span> STUDIO</span><span>BUILT TO SHIP REAL WORK</span><span>PRIVATE WORKSPACE</span></footer>
    </div>
    <UploadDialog />
    <Dialog open={accessOpen} onOpenChange={setAccessOpen}>
      <DialogContent className="upload-dialog access-dialog">
        <DialogHeader><span className="eyebrow">PRIVATE / WORKSPACE</span><DialogTitle className="dialog-heading">Unlock controls</DialogTitle><DialogDescription>Enter your AutoGit access key. It stays only in this browser session.</DialogDescription></DialogHeader>
        <form className="upload-form" onSubmit={event => { event.preventDefault(); setAccessKey(accessInput); setAccessOpen(false); void refresh(); }}>
          <label>Workspace access key<input autoFocus required type="password" value={accessInput} onChange={event => setAccessInput(event.target.value)} placeholder="Enter access key" /></label>
          <button className="red-button full-width">UNLOCK WORKSPACE <ArrowUpRight size={16}/></button>
        </form>
      </DialogContent>
    </Dialog>
  </div>;
}

function UploadDialog() {
  const { uploaderOpen, setUploaderOpen, upload } = useStudio();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [collection, setCollection] = useState<"small" | "mini">("mini");
  const [technologies, setTechnologies] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      await upload({ title, description, collection, technologies, demoUrl, files });
      setTitle(""); setDescription(""); setTechnologies(""); setDemoUrl(""); setFiles([]);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Upload failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return <Dialog open={uploaderOpen} onOpenChange={setUploaderOpen}>
    <DialogContent className="upload-dialog">
      <DialogHeader>
        <span className="eyebrow">NEW / PROJECT</span>
        <DialogTitle className="dialog-heading">Add to the pipeline</DialogTitle>
        <DialogDescription>Upload the real project folder. The bot will publish it in queue order.</DialogDescription>
      </DialogHeader>
      <form className="upload-form" onSubmit={submit}>
        <label>Project name<input required maxLength={80} value={title} onChange={event => setTitle(event.target.value)} placeholder="e.g. Weather Widget" /></label>
        <label>Description<textarea required maxLength={500} value={description} onChange={event => setDescription(event.target.value)} placeholder="What does this project do?" /></label>
        <div className="form-grid">
          <label>Collection<select value={collection} onChange={event => setCollection(event.target.value as "small" | "mini")}><option value="mini">Mini Projects</option><option value="small">Small Projects</option></select></label>
          <label>Technologies<input value={technologies} onChange={event => setTechnologies(event.target.value)} placeholder="React, CSS" /></label>
        </div>
        <label>Live demo URL <span>(optional)</span><input type="url" value={demoUrl} onChange={event => setDemoUrl(event.target.value)} placeholder="https://..." /></label>
        <label className="drop-zone">
          <UploadCloud size={25} />
          <strong>{files.length ? `${files.length} files selected` : "Choose a project folder"}</strong>
          <small>Maximum 40 files · 5 MB total · no secrets or dependencies</small>
          <input type="file" multiple {...{ webkitdirectory: "" }} onChange={event => setFiles(Array.from(event.target.files || []).filter(file => !/(^|\/)(node_modules|\.git|dist|build|\.next|\.env(?:\..*)?)(\/|$)/i.test(file.webkitRelativePath)))} />
        </label>
        {message && <p className="form-error" role="alert">{message}</p>}
        <button className="red-button full-width" disabled={submitting || !files.length}>{submitting ? "UPLOADING..." : <>ADD TO QUEUE <ArrowUpRight size={16}/></>}</button>
      </form>
    </DialogContent>
  </Dialog>;
}

export function StudioShell({ children }: { children: React.ReactNode }) {
  return <StudioProvider><ShellContent>{children}</ShellContent></StudioProvider>;
}
