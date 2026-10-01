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
});
