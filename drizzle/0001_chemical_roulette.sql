CREATE TABLE `bot_control` (
	`id` text PRIMARY KEY NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`lock_until` text,
	`last_run_at` text,
	`last_status` text,
	`last_message` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bot_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`started_at` text NOT NULL,
	`status` text NOT NULL,
	`message` text NOT NULL,
	`project_id` text
);
