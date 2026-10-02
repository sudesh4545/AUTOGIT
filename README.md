# AutoGit Studio

AutoGit Studio is Sudesh Mehar's private project queue. Upload a small or mini project through the site. A cloud publishing run releases at most one queued project per 48 hours to GitHub and adds its record to the existing portfolio's Small Projects or Mini Projects collection.

## What is implemented

- Responsive private dashboard with Overview, Projects, Schedule, Activity and Settings views.
- Folder upload to R2 (maximum 40 files and 10 MB per project), metadata and status in D1.
- Private publishing endpoint at `POST /api/bot`.
- GitHub repository creation, source file upload and portfolio feed sync.
- Honest release history: runs without a due project make no commit.

The source lives in `AUTOGIT`. The separate `Final Original Latest portfolio` checkout is a read-only reference for this site. The publisher updates the hosted `sudesh-portfolio` repository when a real queued project is released. The reference checkout may then need to pull those commits before local portfolio development.

## Run locally

```powershell
npm.cmd ci
npm.cmd run db:generate
npm.cmd run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_first_nighthawk.sql
npm.cmd run dev
```

Local sign-in is available at `/signin?return_to=/`. Production uses the configured workspace access layer.

## Cloud configuration

The dashboard uses D1 and R2 declared in `.autogit/hosting.json`. Configure the following runtime environment variables in the hosting control plane:

| Key | Purpose |
| --- | --- |
| `GITHUB_TOKEN` | Secret token allowed to create public repositories and edit `sudesh-portfolio`. Prefer a dedicated, narrowly scoped credential. |
| `GITHUB_OWNER` | Optional; defaults to `sudesh4545`. |
| `PORTFOLIO_REPO` | Optional; defaults to `sudesh-portfolio`. |

Do not put tokens in source, uploaded projects, or browser settings.

## Daily cloud run

The scheduled publishing task calls `POST /api/bot` and checks the returned result. It can run daily while the laptop is off. The endpoint publishes one project only when the last successful release was at least 48 hours earlier. With no queued project, it does nothing. Failed releases stay visible and can retry on the next run.

After a real release, the publisher creates a repository named `mini-<project-slug>-<id>`. It writes the uploaded files, then updates `src/data/autogit-projects.json` in `sudesh-portfolio`. On the first release it also connects `src/data/portfolio.ts` to that feed, preserving the existing collections and filling their current placeholder slots with real projects.

The first bot run needs a configured GitHub token and at least one uploaded project. If GitHub or the portfolio structure changes, the project is marked failed with an actionable error instead of being reported as published.
