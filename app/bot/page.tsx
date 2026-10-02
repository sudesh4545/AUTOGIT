"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowUpRight, Bot, CalendarClock, Clock3, GitBranch, Pause, Play, RefreshCw, ShieldCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { PageHeading, SectionHeader } from "../dashboard-parts";
import { nextRelease, queuedProjects } from "../studio-data";
import { useStudio } from "../studio-context";
import { workspaceHeaders } from "../studio-context";

type BotState = {
  control: { enabled: boolean; lastRunAt: string | null; lastStatus: string | null; lastMessage: string | null };
  runs: { id: string; startedAt: string; status: string; message: string }[];
};

function indianTime(value: string | null) {
  return value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(value)) : "No check yet";
}

export default function BotPage() {
  const { projects, connection, refresh, accessKey } = useStudio();
  const [state, setState] = useState<BotState | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const queued = queuedProjects(projects);
  const next = nextRelease(projects);

  const load = useCallback(async () => {
    const response = await fetch("/api/bot", { cache: "no-store", headers: workspaceHeaders() });
    const data = await response.json() as BotState & { error?: string };
    if (!response.ok) throw new Error(data.error || "Bot status is unavailable.");
    setState(data);
    setError("");
  }, []);

  useEffect(() => { void load().catch(cause => setError(cause instanceof Error ? cause.message : "Could not load bot status.")); }, [load, accessKey]);

  async function setEnabled(enabled: boolean) {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/bot", { method: "PATCH", headers: workspaceHeaders({ "Content-Type": "application/json" }), body: JSON.stringify({ enabled }) });
      const data = await response.json() as BotState & { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not change bot state.");
      setState(data);
      await refresh();
      setMessage(enabled ? "Bot started. The hosted scheduler will automatically detect queued projects." : "Bot stopped. Queued projects stay safely stored until you start it again.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not change bot state."); }
    finally { setBusy(false); }
  }

  async function runNow() {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/bot/run", { method: "POST", headers: workspaceHeaders() });
      const data = await response.json() as { status?: string; message?: string; error?: string };
      if (!response.ok) throw new Error(data.error || data.message || "Bot check failed.");
      setMessage(data.message || `Check finished: ${data.status || "complete"}.`);
      await Promise.all([load(), refresh()]);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Bot check failed."); void load(); }
    finally { setBusy(false); }
  }

  return <>
    <PageHeading eyebrow="AUTOMATION / 05" title="Bot control." accent="Your call." description="Manage real project releases from this dashboard, even while your laptop is off." action={<button className="outline-action" disabled={busy} onClick={() => void load().catch(cause => setError(String(cause)))}><RefreshCw size={16}/> REFRESH</button>} />
    <div className="bot-hero">
      <div className="bot-hero-copy"><span className="eyebrow">CLOUD PUBLISHER</span><div className="bot-state-heading"><span className={`bot-beacon ${state?.control.enabled ? "active" : ""}`}><Bot size={34}/></span><div><h2>{!state ? "Checking bot…" : state.control.enabled ? "Bot is running" : "Bot is stopped"}</h2><p>{state?.control.enabled ? "Uploaded project folders are detected automatically and released when eligible." : "Automatic publishing is stopped. Your uploaded files and queue remain safely stored."}</p></div></div><div className="bot-hero-meta"><span><ShieldCheck size={16}/> Hosted with the AutoGit website</span><span><Clock3 size={16}/> Daily cloud check · 10:00 AM IST</span></div></div>
      <div className="bot-orbit" aria-hidden="true"><span className="bot-orbit-core"><Bot size={46}/></span><i/><i/><i/></div>
    </div>
    <div className="bot-control-grid">
      <section className="glass-panel bot-control-panel"><SectionHeader eyebrow="01 / CONTROLS" title="Start or stop the bot"/><div className="bot-switch-row"><div><strong>Automatic project publishing</strong><p>Upload folders from Projects. The website bot detects the queue itself; no external hosting panel is needed.</p></div><Switch aria-label="Automatic project publishing" checked={state?.control.enabled ?? false} disabled={!state || busy} onCheckedChange={value => void setEnabled(value)}/></div><button className="red-button bot-run-button" disabled={!state || busy} onClick={() => void setEnabled(!state!.control.enabled)}>{busy ? <RefreshCw size={17} className="spin"/> : state?.control.enabled ? <Pause size={17}/> : <Play size={17}/>} {state?.control.enabled ? "STOP BOT" : "START BOT"}</button><button className="outline-action bot-run-button" disabled={!state?.control.enabled || busy || !connection.githubConnected} onClick={() => void runNow()}><Play size={17}/> RUN ONE ELIGIBLE RELEASE NOW</button><p className="bot-control-note">The website checks the queue automatically every day. A manual check still respects the configured release interval.</p>{message && <div className="bot-feedback success" role="status">{message}</div>}{error && <div className="bot-feedback error" role="alert">{error}</div>}</section>
      <section className="glass-panel bot-control-panel"><SectionHeader eyebrow="02 / NEXT CYCLE" title="Release readiness"/><div className="bot-readiness"><CalendarClock size={30}/><strong>{next.label}</strong><p>{next.detail}</p></div><div className="bot-data-row"><span>Waiting in queue</span><strong>{queued.length}</strong></div><div className="bot-data-row"><span>Last cloud or manual check</span><strong>{indianTime(state?.control.lastRunAt || null)}</strong></div><Link className="panel-link" href="/schedule">VIEW FULL SCHEDULE <ArrowUpRight size={16}/></Link></section>
    </div>
    <section className="glass-panel bot-history"><SectionHeader eyebrow="03 / BOT LOG" title="Recent checks" href="/activity" linkLabel="PROJECT ACTIVITY"/>{state?.runs.length ? <div className="bot-run-list">{state.runs.map(run => <div className="bot-run" key={run.id}><span className={`bot-run-icon ${run.status}`}><Activity size={17}/></span><div><strong>{run.status.replaceAll("_", " ").toUpperCase()}</strong><p>{run.message}</p></div><time dateTime={run.startedAt}>{indianTime(run.startedAt)}</time></div>)}</div> : <div className="bot-history-empty"><GitBranch size={27}/><strong>No check recorded yet</strong><p>The first scheduled or manual check will appear here.</p></div>}</section>
  </>;
}
