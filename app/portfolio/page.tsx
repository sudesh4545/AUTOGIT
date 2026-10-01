"use client";

import Link from "next/link";
import { ArrowUpRight, FolderKanban, Radio, ShieldCheck, Sparkles } from "lucide-react";
import { PageHeading, SectionHeader } from "../dashboard-parts";
import { publishedProjects } from "../studio-data";
import { useStudio } from "../studio-context";

export default function PortfolioPage() {
  const { projects, connection, setUploaderOpen } = useStudio();
  const published = publishedProjects(projects);
  const small = published.filter(project => project.collection === "small");
  const mini = published.filter(project => project.collection === "mini");
  return <>
    <PageHeading eyebrow="DESTINATION / PORTFOLIO" title="Built once." accent="Seen everywhere." description="Published work flows into your portfolio's Small and Mini Projects sections." action={<a className="outline-action" href={`https://github.com/${connection.portfolioTarget}`} target="_blank" rel="noreferrer">OPEN SOURCE <ArrowUpRight size={16}/></a>} />
    <div className="destination-hero portfolio-hero"><div><span className="eyebrow">PORTFOLIO DELIVERY</span><h2>Project showcase</h2><p>{connection.portfolioTarget}</p><span className="destination-hero-status ready"><ShieldCheck size={16}/> DESTINATION SET</span></div><Sparkles className="destination-hero-icon" size={120} strokeWidth={.8}/></div>
    <div className="portfolio-collection-grid"><section className="glass-panel collection-panel"><span className="collection-symbol"><FolderKanban size={27}/></span><span className="eyebrow">COLLECTION 01</span><h2>Small Projects</h2><strong>{small.length.toString().padStart(2,"0")}</strong><p>Published projects in this collection.</p></section><section className="glass-panel collection-panel"><span className="collection-symbol blue"><Radio size={27}/></span><span className="eyebrow">COLLECTION 02</span><h2>Mini Projects</h2><strong>{mini.length.toString().padStart(2,"0")}</strong><p>Published projects in this collection.</p></section></div>
    <section className="glass-panel destination-list-panel"><SectionHeader eyebrow="PORTFOLIO FEED" title="Projects added to the showcase" href="/projects" linkLabel="ALL PROJECTS"/>{published.length ? <div className="destination-release-list">{published.map(project => <div className="destination-release" key={project.id}><span><Sparkles size={20}/></span><div><strong>{project.title}</strong><p>{project.collection === "mini" ? "Mini Projects" : "Small Projects"} · {project.description}</p></div><a href={project.githubUrl || "#"} target="_blank" rel="noreferrer" aria-label={`Open ${project.title} repository`}><ArrowUpRight size={18}/></a></div>)}</div> : <div className="destination-empty"><Sparkles size={28}/><strong>Your showcase starts with a release</strong><p>Once the bot publishes a queued project, it appears here and in your portfolio data.</p><button className="ghost-button" onClick={() => setUploaderOpen(true)}>ADD PROJECT</button></div>}</section>
    <Link className="destination-bottom-link" href="/bot">Manage releases in Bot Control <ArrowUpRight size={16}/></Link>
  </>;
}
