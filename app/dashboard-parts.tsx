"use client";

import Link from "next/link";
import { ArrowUpRight, FolderPlus, Radio } from "lucide-react";
import { activityDays } from "./studio-data";
import type { Project } from "./studio-context";
import { useStudio } from "./studio-context";

export function PageHeading({ eyebrow, title, accent, description, action }: {
  eyebrow: string; title: string; accent?: string; description: string; action?: React.ReactNode;
}) {
  return <div className="page-heading">
    <div><div className="eyebrow"><span className="eyebrow-dash" /> {eyebrow}</div><h1>{title} {accent && <em>{accent}</em>}</h1><p>{description}</p></div>
    {action && <div className="page-action">{action}</div>}
  </div>;
}

export function StatusTag({ status }: { status: Project["status"] }) {
  return <span className={`status-tag status-${status}`}><i />{status.toUpperCase()}</span>;
}

export function EmptyProjects({ compact = false }: { compact?: boolean }) {
  const { setUploaderOpen } = useStudio();
  return <div className={`empty-projects ${compact ? "compact" : ""}`}>
    <span className="empty-emblem"><FolderPlus size={24} /></span>
    <strong>Pipeline is clear</strong>
    <p>Upload your first real project to begin the publishing cycle.</p>
    <button className="ghost-button" onClick={() => setUploaderOpen(true)}>ADD PROJECT <ArrowUpRight size={15}/></button>
  </div>;
}

export function ReleaseChart({ projects, large = false }: { projects: Project[]; large?: boolean }) {
  const days = activityDays(projects, large ? 21 : 14);
  const max = Math.max(1, ...days.map(day => day.count));
  return <div className={`release-chart ${large ? "large" : ""}`}>
    <div className="chart-grid" aria-hidden="true"><span/><span/><span/><span/></div>
    <div className="chart-bars" role="img" aria-label={`${days.reduce((total, day) => total + day.count, 0)} projects published over ${days.length} days`}>
      {days.map((day, index) => <div className="chart-column" key={day.key}>
        <span className={day.count ? "bar has-data" : "bar"} style={{ height: day.count ? `${Math.max(15, day.count / max * 100)}%` : "3px" }} title={`${day.key}: ${day.count} published`} />
        {(index === 0 || index === days.length - 1 || index === Math.floor(days.length / 2)) && <small>{new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(day.date)}</small>}
      </div>)}
    </div>
  </div>;
}

export function SectionHeader({ eyebrow, title, href, linkLabel }: { eyebrow: string; title: string; href?: string; linkLabel?: string }) {
  return <div className="section-header"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>{href && <Link href={href}>{linkLabel || "VIEW ALL"} <ArrowUpRight size={16}/></Link>}</div>;
}

export function ConnectionPill({ connected, label }: { connected: boolean; label: string }) {
  return <span className={`connection-pill ${connected ? "connected" : ""}`}><Radio size={14}/>{label}<i/></span>;
}
