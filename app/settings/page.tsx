"use client";

import { ArrowUpRight, Check, Clock3, Database, GitBranch, LockKeyhole, Radio, RefreshCw, ShieldCheck } from "lucide-react";
import { PageHeading, SectionHeader } from "../dashboard-parts";
import { useStudio } from "../studio-context";

export default function SettingsPage() {
  const { connection, botEnabled, botIntervalMinutes, refresh } = useStudio();
  const timing = botIntervalMinutes === 1 ? "1 MINUTE" : botIntervalMinutes === 1440 ? "24 HOURS" : "2 DAYS";
  return <>
    <PageHeading eyebrow="SYSTEM CONFIGURATION / 06" title="Connected." accent="Controlled." description="Review the publishing connections, storage and schedule powering this studio." action={<button className="outline-action" onClick={() => void refresh()}><RefreshCw size={16}/> REFRESH STATUS</button>} />
    <div className="settings-grid">
      <section className="glass-panel settings-section"><SectionHeader eyebrow="01 / DESTINATIONS" title="Publishing targets" /><div className="settings-item"><span className="settings-icon"><GitBranch size={21}/></span><div><strong>GitHub publishing</strong><p>New public repository for each real project.</p></div><span className={`settings-state ${connection.githubConnected ? "good" : ""}`}><i/>{connection.githubConnected ? "CONNECTED" : "SETUP NEEDED"}</span></div><div className="settings-item"><span className="settings-icon"><ShieldCheck size={21}/></span><div><strong>Portfolio repository</strong><p>{connection.portfolioTarget}</p></div><span className="settings-state good"><i/> TARGET SET</span></div><a className="settings-external" href={`https://github.com/${connection.portfolioTarget}`} target="_blank" rel="noreferrer">OPEN PORTFOLIO REPOSITORY <ArrowUpRight size={15}/></a></section>
      <section className="glass-panel settings-section"><SectionHeader eyebrow="02 / AUTOMATION" title="Publishing rules" /><div className="settings-item"><span className="settings-icon"><Radio size={21}/></span><div><strong>Cloud check</strong><p>Every minute, Asia/Kolkata.</p></div><span className={`settings-state ${botEnabled === false ? "" : "good"}`}><i/> {botEnabled === false ? "PAUSED" : "ENABLED"}</span></div><div className="settings-item"><span className="settings-icon"><Clock3 size={21}/></span><div><strong>Release spacing</strong><p>Configured from Bot Control.</p></div><strong className="settings-value">{timing}</strong></div><div className="settings-item"><span className="settings-icon"><Check size={21}/></span><div><strong>Release policy</strong><p>Only actual queued projects are published.</p></div><strong className="settings-value">REAL WORK</strong></div></section>
      <section className="glass-panel settings-section"><SectionHeader eyebrow="03 / STORAGE" title="Project data" /><div className="settings-item"><span className="settings-icon"><Database size={21}/></span><div><strong>Project storage</strong><p>Uploaded folder files and queue records.</p></div><span className={`settings-state ${connection.storageReady ? "good" : ""}`}><i/>{connection.storageReady ? "READY" : "UNAVAILABLE"}</span></div><div className="settings-item"><span className="settings-icon"><LockKeyhole size={21}/></span><div><strong>Private workspace</strong><p>Project management requires your signed-in access.</p></div><strong className="settings-value">PROTECTED</strong></div></section>
      <section className="glass-panel settings-aside"><div className="settings-emblem"><LockKeyhole size={35}/></div><span className="eyebrow">SECURE BY DESIGN</span><h2>Your code stays under your control.</h2><p>GitHub credentials are held on the hosted server. Project files are stored privately until their scheduled publication.</p><div className="settings-aside-line"/><span>UPLOAD → QUEUE → RELEASE</span></section>
    </div>
  </>;
}
