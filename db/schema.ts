import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  description: text("description").notNull(),
  collection: text("collection").notNull(),
  technologies: text("technologies").notNull(),
  demoUrl: text("demo_url"),
  status: text("status").notNull().default("queued"),
  createdAt: text("created_at").notNull(),
  publishedAt: text("published_at"),
  githubUrl: text("github_url"),
  error: text("error"),
  fileCount: integer("file_count").notNull().default(0),
});

export const projectFiles = sqliteTable("project_files", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id),
  path: text("path").notNull(),
  size: integer("size").notNull(),
  // Kept in D1 so the hosted bot stays entirely within Cloudflare's free tier.
  // Base64 makes this portable across the Worker and GitHub APIs.
  content: text("content").notNull().default(""),
});

export const botControl = sqliteTable("bot_control", {
  id: text("id").primaryKey(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  intervalMinutes: integer("interval_minutes").notNull().default(2880),
  lockUntil: text("lock_until"),
  lastRunAt: text("last_run_at"),
  lastStatus: text("last_status"),
  lastMessage: text("last_message"),
  updatedAt: text("updated_at").notNull(),
});

export const botRuns = sqliteTable("bot_runs", {
  id: text("id").primaryKey(),
  startedAt: text("started_at").notNull(),
  status: text("status").notNull(),
  message: text("message").notNull(),
  projectId: text("project_id"),
});
