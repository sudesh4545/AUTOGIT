"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, FolderKanban, Plus, Search, UploadCloud } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyProjects, PageHeading, StatusTag } from "../dashboard-parts";
import { publishedProjects, queuedProjects } from "../studio-data";
import { useStudio } from "../studio-context";

type Filter = "all" | "queued" | "published" | "failed";

export default function ProjectsPage() {
  const { projects, setUploaderOpen } = useStudio();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const visible = useMemo(() => projects.filter(project => {
    const matchesFilter = filter === "all" || (filter === "queued" ? ["queued", "uploading", "publishing"].includes(project.status) : project.status === filter);
    const matchesQuery = `${project.title} ${project.description} ${project.collection}`.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  }), [projects, filter, query]);
  return <>
    <PageHeading eyebrow="PROJECT ARCHIVE / 02" title="Every build." accent="One pipeline." description="Your uploaded folders, release states and GitHub destinations, all in one place." action={<button className="red-button" onClick={() => setUploaderOpen(true)}><Plus size={17}/> ADD PROJECT</button>} />
    <div className="project-summary">
      <div><span>TOTAL PROJECTS</span><strong>{String(projects.length).padStart(2,"0")}</strong></div>
      <div><span>IN PIPELINE</span><strong>{String(queuedProjects(projects).length).padStart(2,"0")}</strong></div>
      <div><span>PUBLISHED</span><strong>{String(publishedProjects(projects).length).padStart(2,"0")}</strong></div>
      <div className="project-summary-art" aria-hidden="true"><FolderKanban size={31}/></div>
    </div>
    <section className="glass-panel projects-table-panel">
      <div className="projects-controls">
        <div><span className="eyebrow">PROJECT INVENTORY</span><h2>All projects</h2></div>
        <div className="search-box"><Search size={17}/><input aria-label="Search projects" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search projects..." /></div>
      </div>
      <Tabs value={filter} onValueChange={value => setFilter(value as Filter)} className="project-tabs">
        <TabsList className="project-tab-list">
          <TabsTrigger value="all">All <span>{projects.length}</span></TabsTrigger>
          <TabsTrigger value="queued">Queued <span>{projects.filter(p => ["queued","uploading","publishing"].includes(p.status)).length}</span></TabsTrigger>
          <TabsTrigger value="published">Published <span>{publishedProjects(projects).length}</span></TabsTrigger>
          <TabsTrigger value="failed">Failed <span>{projects.filter(p => p.status === "failed").length}</span></TabsTrigger>
        </TabsList>
      </Tabs>
      {visible.length ? <div className="projects-list">
        <div className="project-list-heading"><span>PROJECT</span><span>COLLECTION</span><span>FILES</span><span>STATUS</span><span>DESTINATION</span></div>
        {visible.map((project, index) => <article className="project-entry" key={project.id}>
          <div className="project-identity"><span className="project-entry-number">{String(index+1).padStart(2,"0")}</span><div><strong>{project.title}</strong><p>{project.description}</p>{project.error && <small className="error-detail">{project.error}</small>}</div></div>
          <span className="project-collection">{project.collection.toUpperCase()} PROJECT</span>
          <span className="project-file-count">{project.fileCount} files</span>
          <StatusTag status={project.status} />
          <div className="project-destination">{project.githubUrl ? <a href={project.githubUrl} target="_blank" rel="noreferrer">GITHUB <ArrowUpRight size={15}/></a> : <span>AWAITING RELEASE</span>}</div>
        </article>)}
      </div> : projects.length === 0 && !query && filter === "all" ? <EmptyProjects/> : <div className="filter-empty">No projects match this view.</div>}
    </section>
    <div className="project-help"><UploadCloud size={18}/><span>Upload the project folder once. The bot publishes in queue order and adds the release to your portfolio.</span></div>
  </>;
}
