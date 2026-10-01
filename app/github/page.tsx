"use client";

import Link from "next/link";
import { ArrowUpRight, GitBranch, LockKeyhole, Radio, UploadCloud } from "lucide-react";
import { PageHeading, SectionHeader } from "../dashboard-parts";
import { publishedProjects, queuedProjects } from "../studio-data";
import { useStudio } from "../studio-context";

export default function GitHubPage() {
  const { projects, connection, setUploaderOpen } = useStudio();
  const published = publishedProjects(projects);
  const queued = queuedProjects(projects);
  return <>
    <PageHeading eyebrow="DESTINATION / GITHUB" title="Code goes live." accent="On your terms." description="Each eligible project gets its own real GitHub repository." action={<a className="outline-action" href="https://github.com/sudesh4545" target="_blank" rel="noreferrer">OPEN GITHUB <ArrowUpRight size={16}/></a>} />
    <div className="destination-hero github-hero"><div><span className="eyebrow">GITHUB PUBLISHING</span><h2>sudesh4545</h2><p>{connection.githubConnected ? "Connection ready for scheduled releases." : "GitHub connection needs attention before releases can run."}</p><span className={`destination-hero-status ${connection.githubConnected ? "ready" : ""}`}><Radio size={15}/>{connection.githubConnected ? "CONNECTED" : "NOT CONNECTED"}</span></div><GitBranch className="destination-hero-icon" size={120} strokeWidth={.8}/></div>
    <div className="destination-stat-grid"><div className="glass-panel destination-stat"><GitBranch size={23}/><strong>{published.length}</strong><span>PUBLISHED REPOSITORIES</span></div><div className="glass-panel destination-stat"><UploadCloud size={23}/><strong>{queued.length}</strong><span>PROJECTS WAITING</span></div><div className="glass-panel destination-stat"><LockKeyhole size={23}/><strong>48h</strong><span>MINIMUM RELEASE GAP</span></div></div>
    <section className="glass-panel destination-list-panel"><SectionHeader eyebrow="REPOSITORY HISTORY" title="Published on GitHub" href="/projects" linkLabel="ALL PROJECTS"/>{published.length ? <div className="destination-release-list">{published.map(project => <div className="destination-release" key={project.id}><span><GitBranch size={20}/></span><div><strong>{project.title}</strong><p>{project.description}</p></div><a href={project.githubUrl || "#"} target="_blank" rel="noreferrer" aria-label={`Open ${project.title} on GitHub`}><ArrowUpRight size={18}/></a></div>)}</div> : <div className="destination-empty"><GitBranch size={28}/><strong>No repositories published yet</strong><p>Upload a real project, then let the bot release it when eligible.</p><button className="ghost-button" onClick={() => setUploaderOpen(true)}>ADD PROJECT</button></div>}</section>
    <Link className="destination-bottom-link" href="/bot">Manage publishing in Bot Control <ArrowUpRight size={16}/></Link>
  </>;
}
