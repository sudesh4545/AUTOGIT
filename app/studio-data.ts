import type { Project } from "./studio-context";

export function queuedProjects(projects: Project[]) {
  return projects.filter(project => ["queued", "publishing", "failed"].includes(project.status));
}

export function publishedProjects(projects: Project[]) {
  return projects.filter(project => project.status === "published").sort((a, b) =>
    Date.parse(b.publishedAt || "") - Date.parse(a.publishedAt || "")
  );
}

export function nextRelease(projects: Project[]) {
  const queued = queuedProjects(projects);
  if (!queued.length) return { label: "AWAITING PROJECT", detail: "Add a project to start the queue.", due: null as Date | null };
  const latest = publishedProjects(projects)[0];
  if (!latest?.publishedAt) return { label: "READY FOR NEXT CHECK", detail: "The first release is eligible at the next daily check.", due: null };
  const due = new Date(Date.parse(latest.publishedAt) + 48 * 60 * 60 * 1000);
  if (due.getTime() <= Date.now()) return { label: "READY FOR NEXT CHECK", detail: "A project is ready for the next daily check.", due };
  return {
    label: new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(due),
    detail: "Two days after the previous release.",
    due,
  };
}

export function activityDays(projects: Project[], count = 14) {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const days = Array.from({ length: count }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() - (count - 1 - index));
    return { date, key: date.toISOString().slice(0, 10), count: 0 };
  });
  for (const project of publishedProjects(projects)) {
    const key = project.publishedAt?.slice(0, 10);
    const day = days.find(item => item.key === key);
    if (day) day.count++;
  }
  return days;
}
