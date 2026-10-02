"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, Plus, Save } from "lucide-react";
import { PageHeading, StatusTag } from "../dashboard-parts";
import { useStudio, workspaceHeaders } from "../studio-context";

function inputValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function displayTime(value: string | null) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(value));
}

export default function SchedulePage() {
  const { projects, botEnabled, botIntervalMinutes, setUploaderOpen, refresh } = useStudio();
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");
  const timing = botIntervalMinutes === 1 ? "1 minute" : botIntervalMinutes === 1440 ? "24 hours" : "2 days";
  const ordered = useMemo(() => [...projects].sort((a, b) => Date.parse(a.scheduledAt || a.publishedAt || a.createdAt) - Date.parse(b.scheduledAt || b.publishedAt || b.createdAt)), [projects]);
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(start);
  gridStart.setDate(1 - start.getDay());
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const dayProjects = projects.filter(project => {
      const value = project.scheduledAt || project.publishedAt;
      if (!value) return false;
      const scheduled = new Date(value);
      return scheduled.getFullYear() === date.getFullYear() && scheduled.getMonth() === date.getMonth() && scheduled.getDate() === date.getDate();
    });
    return { date, projects: dayProjects };
  });

  async function save(projectId: string, fallback: string | null) {
    const value = edits[projectId] ?? inputValue(fallback);
    if (!value) { setMessage("Choose a date and time first."); return; }
    setSaving(projectId); setMessage("");
    try {
      const response = await fetch("/api/projects", { method: "PATCH", headers: workspaceHeaders({ "Content-Type": "application/json" }), body: JSON.stringify({ projectId, scheduledAt: new Date(value).toISOString() }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Schedule update failed.");
      await refresh();
      setMessage("Project schedule saved. The bot will publish it at this time.");
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Schedule update failed."); }
    finally { setSaving(""); }
  }

  return <>
    <PageHeading eyebrow="SCHEDULE / 03" title="Plan every" accent="project release." description="Choose the exact date and time for each project. The cloud bot checks every minute and publishes automatically." action={<button className="red-button" onClick={() => setUploaderOpen(true)}><Plus size={17}/> ADD PROJECT</button>} />
    <div className="schedule-summary-simple"><div><span>BOT STATUS</span><strong>{botEnabled === false ? "PAUSED" : "RUNNING"}</strong></div><div><span>AUTO-SPACING</span><strong>{timing.toUpperCase()}</strong></div><div><span>PROJECTS</span><strong>{projects.length}</strong></div><div><span>TIMEZONE</span><strong>INDIA · IST</strong></div></div>
    <section className="glass-panel calendar-panel">
      <div className="calendar-head"><div><span className="eyebrow">RELEASE CALENDAR</span><h2>{new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(month)}</h2></div><div><button aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft size={18}/></button><button onClick={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>TODAY</button><button aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={18}/></button></div></div>
      <div className="calendar-weekdays">{["SUN","MON","TUE","WED","THU","FRI","SAT"].map(day => <span key={day}>{day}</span>)}</div>
      <div className="calendar-grid">{days.map(({date,projects:dayProjects}) => <div className={`calendar-day ${date.getMonth() !== month.getMonth() ? "muted" : ""}`} key={date.toISOString()}><span>{date.getDate()}</span>{dayProjects.slice(0,2).map(project => <small key={project.id}>{project.title}</small>)}{dayProjects.length > 2 && <small>+{dayProjects.length - 2} more</small>}</div>)}</div>
    </section>
    <section className="glass-panel easy-schedule-list">
      <div className="section-header"><div><span className="eyebrow">ALL PROJECTS</span><h2>Set date and time</h2></div><span className="timeline-count">{projects.length} TOTAL</span></div>
      {ordered.length ? ordered.map((project, index) => <div className="easy-schedule-row" key={project.id}><span className="schedule-number">{String(index + 1).padStart(2, "0")}</span><div className="schedule-project-name"><strong>{project.title}</strong><small>{project.status === "published" ? `Published ${displayTime(project.publishedAt)}` : `Currently ${displayTime(project.scheduledAt)}`}</small></div><label><span>Release date & time</span><input type="datetime-local" value={edits[project.id] ?? inputValue(project.scheduledAt)} disabled={project.status === "published" || project.status === "publishing"} onChange={event => setEdits(current => ({ ...current, [project.id]: event.target.value }))}/></label><button className="outline-action" disabled={project.status === "published" || project.status === "publishing" || saving === project.id} onClick={() => void save(project.id, project.scheduledAt)}><Save size={16}/>{saving === project.id ? "SAVING" : "SAVE TIME"}</button><StatusTag status={project.status}/></div>) : <div className="schedule-empty"><CalendarDays size={30}/><strong>No projects uploaded</strong><p>Add your project folders. Every project will appear here with an automatic date that you can change.</p><button className="red-button" onClick={() => setUploaderOpen(true)}><Plus size={16}/> ADD FIRST PROJECT</button></div>}
      {message && <div className="bot-feedback success" role="status">{message}</div>}
    </section>
    <div className="schedule-help"><Check size={18}/><div><strong>How it works</strong><p>Upload → choose date and time → save. The hosted bot checks every minute and publishes to GitHub and Portfolio when that time arrives.</p></div><Clock3 size={20}/></div>
  </>;
}
