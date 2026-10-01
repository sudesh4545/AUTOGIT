"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const { connection, botEnabled, error, loading, setUploaderOpen } = useStudio();
  const active = navigation.find(item => item.href === pathname) || { label: pathname === "/github" ? "GitHub" : pathname === "/portfolio" ? "Portfolio" : "Overview" };

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return <div className="studio-shell">
    <ParticleField />
    <div className="ambient-grid" aria-hidden="true" />
    {menuOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
    <aside className={`studio-sidebar ${menuOpen ? "sidebar-visible" : ""}`}>
      <a className="wordmark" href="/" aria-label="AutoGit Studio home">
        <span className="wordmark-icon"><Command size={22} strokeWidth={2.2} /></span>
        <span><strong>AUTO<span>GIT</span></strong><small>MISSION CONTROL</small></span>
      </a>
      <div className="sidebar-section-title">WORKSPACE <span>01—06</span></div>
      <nav aria-label="Main navigation" className="sidebar-nav">
        {navigation.map(({ href, label, icon: Icon, index }) =>
          <a key={href} href={href} aria-current={pathname === href ? "page" : undefined} className={`sidebar-link ${pathname === href ? "is-active" : ""}`}>
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
            <small>{index}</small>
          </a>
        )}
      </nav>
      <div className="sidebar-divider" />
      <div className="sidebar-section-title">DESTINATIONS</div>
      <a href="/github" aria-current={pathname === "/github" ? "page" : undefined} className={`destination ${pathname === "/github" ? "is-active" : ""}`}><GitBranch size={17} /><span>GitHub</span><i className={connection.githubConnected ? "live" : ""} /></a>
      <a href="/portfolio" aria-current={pathname === "/portfolio" ? "page" : undefined} className={`destination ${pathname === "/portfolio" ? "is-active" : ""}`}><Radio size={17} /><span>Portfolio</span><i className={connection.storageReady ? "live" : ""} /></a>
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
        <div className="topbar-actions"><span className="topbar-live"><i /> {botEnabled === false ? "BOT PAUSED" : connection.githubConnected ? "SYSTEM ONLINE" : "SETUP REQUIRED"}</span><button className="topbar-add" onClick={() => setUploaderOpen(true)}><Plus size={17}/><span>ADD PROJECT</span></button></div>
      </header>
      <main className="page-main">
        {error && <div className="site-alert" role="alert">{error} <a href={`/signin-with-chatgpt?return_to=${encodeURIComponent(pathname)}`}>Sign in</a></div>}
        {loading && <div className="loading-line" aria-label="Loading studio data" />}
        {children}
      </main>
      <footer className="studio-footer"><span>© 2026 AUTO<span>GIT</span> STUDIO</span><span>BUILT TO SHIP REAL WORK</span><span>PRIVATE WORKSPACE</span></footer>
    </div>
    <UploadDialog />
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
          <small>Maximum 40 files · 10 MB total · no secrets or dependencies</small>
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
