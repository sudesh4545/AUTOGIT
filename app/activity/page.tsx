"use client";

import { Activity, ArrowUpRight, CalendarDays, GitBranch, Radio } from "lucide-react";
import { PageHeading, ReleaseChart, SectionHeader } from "../dashboard-parts";
import { activityDays, publishedProjects } from "../studio-data";
import { useStudio } from "../studio-context";

export default function ActivityPage() {
  const { projects } = useStudio();
  const published = publishedProjects(projects);
  const days = activityDays(projects, 21);
  const activeDays = days.filter(day => day.count > 0).length;
  return <>
    <PageHeading eyebrow="RELEASE INTELLIGENCE / 04" title="Real work." accent="Real activity." description="Every event here represents an actual project release. Empty days stay empty." />
    <div className="activity-metrics"><div className="metric-card"><span>PROJECTS RELEASED</span><strong>{String(published.length).padStart(2,"0")}</strong><GitBranch size={20}/></div><div className="metric-card"><span>ACTIVE DAYS / 21</span><strong>{String(activeDays).padStart(2,"0")}</strong><Activity size={20}/></div><div className="metric-card"><span>LAST RELEASE</span><strong className="date-metric">{published[0]?.publishedAt ? new Intl.DateTimeFormat("en-IN",{day:"2-digit",month:"short",timeZone:"Asia/Kolkata"}).format(new Date(published[0].publishedAt)) : "—"}</strong><CalendarDays size={20}/></div></div>
    <section className="glass-panel activity-main"><SectionHeader eyebrow="21-DAY SIGNAL" title="Publication history" /><div className="activity-chart-summary"><span><i/> ACTUAL PROJECT RELEASES</span><strong>{days.reduce((sum, day) => sum + day.count, 0)} TOTAL</strong></div><ReleaseChart projects={projects} large/></section>
    <section className="glass-panel event-panel"><SectionHeader eyebrow="EVENT STREAM" title="Release log" /><div className="event-list">{published.length ? published.map(project => <article className="event-row" key={project.id}><span className="event-symbol"><GitBranch size={18}/></span><div><strong>{project.title} published</strong><p>Added to GitHub and the {project.collection === "mini" ? "Mini" : "Small"} Projects portfolio collection.</p></div><time>{project.publishedAt && new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(project.publishedAt))}</time>{project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noreferrer" aria-label={`Open ${project.title} on GitHub`}><ArrowUpRight size={17}/></a>}</article>) : <div className="activity-empty"><Radio size={26}/><strong>No releases recorded yet</strong><p>The first published project will appear here with its actual date and GitHub link.</p></div>}</div></section>
  </>;
}
