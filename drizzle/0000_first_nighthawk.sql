CREATE TABLE `project_files` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`path` text NOT NULL,
	`size` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`description` text NOT NULL,
	`collection` text NOT NULL,
	`technologies` text NOT NULL,
	`demo_url` text,
	`status` text DEFAULT 'queued' NOT NULL,
	`created_at` text NOT NULL,
	`published_at` text,
	`github_url` text,
	`error` text,
	`file_count` integer DEFAULT 0 NOT NULL
);
