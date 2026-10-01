"use client";

import Image from "next/image";
import Link from "next/link";
import { Activity, ArrowUpRight, CalendarClock, Check, Clock3, FolderKanban, GitBranch, Plus, Radio, ShieldCheck, UploadCloud } from "lucide-react";
import { ConnectionPill, EmptyProjects, PageHeading, ReleaseChart, SectionHeader, StatusTag } from "./dashboard-parts";
import { nextRelease, publishedProjects, queuedProjects } from "./studio-data";
import { useStudio } from "./studio-context";

export default function Overview() {
  const { projects, connection, setUploaderOpen } = useStudio();
  const queued = queuedProjects(projects);
  const published = publishedProjects(projects);
  const next = nextRelease(projects);
  return <>
    <PageHeading eyebrow="COMMAND CENTER / 01" title="The world is" accent="your workspace." description="One place to stage, schedule and ship your real projects." action={<button className="red-button" onClick={() => setUploaderOpen(true)}><Plus size={17}/> ADD PROJECT</button>} />
    <div className="metric-grid">
      <div className="metric-card"><div className="metric-top"><span>PROJECTS IN QUEUE</span><FolderKanban size={18}/></div><strong>{String(queued.length).padStart(2,"0")}</strong><small>{queued.length ? "Waiting for release" : "No project uploaded yet"}</small><span className="metric-edge"/></div>
      <div className="metric-card"><div className="metric-top"><span>PUBLISHED PROJECTS</span><GitBranch size={18}/></div><strong>{String(published.length).padStart(2,"0")}</strong><small>Real GitHub releases</small><span className="metric-edge"/></div>
      <div className="metric-card"><div className="metric-top"><span>PUBLISH INTERVAL</span><Clock3 size={18}/></div><strong>48<span className="unit"> HRS</span></strong><small>One project per cycle</small><span className="metric-edge"/></div>
      <div className="metric-card"><div className="metric-top"><span>SYSTEM CHECK</span><Radio size={18}/></div><strong>10:00<span className="unit"> IST</span></strong><small>Every day in the cloud</small><span className="metric-edge"/></div>
    </div>
    <div className="command-grid">
      <div className="command-side">
        <section className="glass-panel health-panel"><SectionHeader eyebrow="01 / SYSTEM" title="System pulse" /><div className="system-state"><span className={`state-orb ${connection.githubConnected ? "state-on" : ""}`}><Radio size={23}/></span><div><strong>{connection.githubConnected ? "Publishing connected" : "Connection required"}</strong><p>{connection.githubConnected ? "GitHub is ready for scheduled releases." : "The GitHub connection needs attention."}</p></div></div><div className="system-list"><div><span><i className={connection.storageReady ? "green" : ""}/> Project storage</span><strong>{connection.storageReady ? "READY" : "CHECKING"}</strong></div><div><span><i className={connection.githubConnected ? "green" : ""}/> GitHub publishing</span><strong>{connection.githubConnected ? "READY" : "PENDING"}</strong></div><div><span><i className="green"/> Portfolio target</span><strong>SET</strong></div></div><Link className="panel-link" href="/settings">OPEN CONNECTIONS <ArrowUpRight size={15}/></Link></section>
        <section className="glass-panel cycle-panel"><SectionHeader eyebrow="02 / RHYTHM" title="Release cadence" /><div className="cycle-visual"><div className="cycle-track"><span>01</span><span>02</span><span>03</span></div><div className="cycle-steps"><span>UPLOAD</span><span>QUEUE</span><span>PUBLISH</span></div></div><p>One real project every two days. The bot checks the queue each morning.</p><Link className="panel-link" href="/schedule">SEE SCHEDULE <ArrowUpRight size={15}/></Link></section>
      </div>
      <section className="globe-panel">
        <div className="globe-panel-head"><span className="eyebrow">GLOBAL DEPLOYMENT / LIVE PIPELINE</span><span className="tiny-cross">✦</span></div>
        <div className="globe-stage"><div className="globe-aura"/><div className="globe-orbit globe-orbit-a"/><div className="globe-orbit globe-orbit-b"/><Image src="/holographic-globe.png" width={1024} height={1024} alt="Red holographic Earth globe" priority className="globe-image"/><span className="globe-coordinate coordinate-one">28.61° N / 77.20° E</span><span className="globe-coordinate coordinate-two">NODE_01 / ONLINE</span></div>
        <div className="globe-bottom"><div><span>YOUR PROJECT NETWORK</span><strong>{projects.length} PROJECTS TRACKED</strong></div><div><span>DELIVERY PATH</span><strong>GITHUB → PORTFOLIO</strong></div></div>
      </section>
      <div className="command-side">
        <section className="glass-panel next-panel"><SectionHeader eyebrow="03 / NEXT RELEASE" title="Deployment window" /><div className="release-timer"><CalendarClock size={24}/><span>{next.label}</span></div><p>{next.detail}</p><div className="release-divider"/><div className="next-project"><span>NEXT IN LINE</span><strong>{queued[0]?.title || "No project queued"}</strong><small>{queued[0] ? `${queued[0].collection.toUpperCase()} PROJECT · ${queued[0].fileCount} FILES` : "Upload a folder to start"}</small></div><Link className="panel-link" href="/schedule">FULL SCHEDULE <ArrowUpRight size={15}/></Link></section>
        <section className="glass-panel destinations-panel"><SectionHeader eyebrow="04 / DESTINATIONS" title="Connected outputs" /><div className="destination-tile"><span className="destination-icon"><GitBranch size={20}/></span><div><strong>GitHub</strong><small>{connection.githubConnected ? "Publishing enabled" : "Connection pending"}</small></div><ConnectionPill connected={connection.githubConnected} label={connection.githubConnected ? "LIVE" : "OFF"} /></div><div className="destination-tile"><span className="destination-icon"><ShieldCheck size={20}/></span><div><strong>Portfolio</strong><small>{connection.portfolioTarget}</small></div><ConnectionPill connected={connection.storageReady} label={connection.storageReady ? "READY" : "WAIT"} /></div></section>
      </div>
    </div>
    <div className="overview-bottom">
      <section className="glass-panel chart-panel"><SectionHeader eyebrow="05 / RELEASE INTELLIGENCE" title="Publishing activity" href="/activity" linkLabel="FULL HISTORY" /><div className="chart-summary"><strong>{published.length}</strong><span>REAL PROJECT RELEASES</span><small>Last 14 days shown below</small></div><ReleaseChart projects={projects}/></section>
      <section className="glass-panel pipeline-panel"><SectionHeader eyebrow="06 / PROJECT PIPELINE" title="Up next" href="/projects" linkLabel="OPEN QUEUE" />{queued.length ? <div className="pipeline-list">{queued.slice(0,3).map((project,index)=><div className="pipeline-item" key={project.id}><span className="pipeline-index">{String(index+1).padStart(2,"0")}</span><div><strong>{project.title}</strong><small>{project.collection.toUpperCase()} PROJECT · {project.fileCount} FILES</small></div><StatusTag status={project.status}/></div>)}</div>:<EmptyProjects compact/>}</section>
    </div>
  </>;
}
