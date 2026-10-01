"use client";

import { ArrowUpRight, CalendarClock, Check, Clock3, GitBranch, Plus, Radio } from "lucide-react";
import { PageHeading, StatusTag } from "../dashboard-parts";
import { nextRelease, publishedProjects, queuedProjects } from "../studio-data";
import { useStudio } from "../studio-context";

function nextCheck(after: number) {
  const indiaOffset = 5.5 * 60 * 60 * 1000;
  const localDay = Math.floor((after + indiaOffset) / 86400000);
  let candidate = localDay * 86400000 + 10 * 60 * 60 * 1000 - indiaOffset;
  if (candidate <= after) candidate += 86400000;
  return candidate;
}

export default function SchedulePage() {
  const { projects, botEnabled, setUploaderOpen } = useStudio();
  const queued = queuedProjects(projects);
  const published = publishedProjects(projects);
  const next = nextRelease(projects);
  const last = published[0]?.publishedAt ? Date.parse(published[0].publishedAt) : 0;
  const firstSlot = nextCheck(Math.max(Date.now(), last ? last + 48 * 60 * 60 * 1000 - 60 * 1000 : 0));
  const slots = queued.map((project, index) => ({ project, at: new Date(firstSlot + index * 48 * 60 * 60 * 1000) }));
  return <>
    <PageHeading eyebrow="AUTOMATION TIMELINE / 03" title="On schedule." accent="Even offline." description="The cloud checks every day and publishes at most one real project every 48 hours." action={<button className="red-button" onClick={() => setUploaderOpen(true)}><Plus size={17}/> QUEUE PROJECT</button>} />
    <div className="schedule-top-grid">
      <section className="glass-panel schedule-hero"><div className="schedule-hero-head"><span className="eyebrow">NEXT DEPLOYMENT WINDOW</span><CalendarClock size={22}/></div><span className="schedule-big">{botEnabled === false ? "PUBLISHING PAUSED" : next.label}</span><p>{botEnabled === false ? "Resume publishing from Bot Control to release queued projects." : next.detail}</p><div className="schedule-sweep" aria-hidden="true"><span/><span/><span/><span/><span/><span/><span/></div><div className="schedule-hero-bottom"><span><i/> {botEnabled === false ? "PUBLISHING PAUSED" : "AUTOMATION ACTIVE"}</span><span>ASIA / KOLKATA</span></div></section>
      <section className="glass-panel rules-panel"><span className="eyebrow">PUBLISHING RULES</span><h2>Simple, reliable rhythm.</h2><div className="rule-row"><span><Radio size={19}/></span><div><strong>Daily cloud check</strong><p>At 10:00 AM India time, even when your laptop is off.</p></div></div><div className="rule-row"><span><Clock3 size={19}/></span><div><strong>48-hour release gap</strong><p>At most one queued project is published each cycle.</p></div></div><div className="rule-row"><span><GitBranch size={19}/></span><div><strong>Two destinations</strong><p>GitHub repository and portfolio collection update together.</p></div></div></section>
    </div>
    <section className="glass-panel timeline-panel"><div className="section-header"><div><span className="eyebrow">UPCOMING / PIPELINE</span><h2>Release timeline</h2></div><span className="timeline-count">{queued.length} IN QUEUE</span></div>{slots.length ? <div className="timeline-list">{slots.map(({project,at},index) => <div className="timeline-entry" key={project.id}><span className="timeline-node"><span/></span><span className="timeline-index">{String(index+1).padStart(2,"0")}</span><div><strong>{project.title}</strong><small>{project.collection.toUpperCase()} PROJECT · {project.fileCount} FILES</small></div><time dateTime={at.toISOString()}>EST. {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}).format(at)}</time><StatusTag status={project.status}/></div>)}</div> : <div className="schedule-empty"><Check size={26}/><strong>No upcoming releases</strong><p>Upload a project to populate the timeline.</p><button className="ghost-button" onClick={() => setUploaderOpen(true)}>ADD PROJECT <ArrowUpRight size={15}/></button></div>}</section>
    <p className="schedule-note">Estimated dates can shift after a failed release or a delayed cloud check. The 48-hour gap is enforced from the last successful publication.</p>
  </>;
}
