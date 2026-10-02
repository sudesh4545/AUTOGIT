import { runPublisher } from "../../../lib/publisher";
import { getBotState, setBotEnabled } from "../../../lib/publisher";
import { getWorkspaceUser } from "../../workspace-auth";

export async function GET() {
  if (!await getWorkspaceUser()) return Response.json({ error: "Sign in to manage the bot." }, { status: 401 });
  try { return Response.json(await getBotState()); }
  catch { return Response.json({ error: "Bot status is unavailable." }, { status: 503 }); }
}

export async function PATCH(request: Request) {
  if (!await getWorkspaceUser()) return Response.json({ error: "Sign in to manage the bot." }, { status: 401 });
  const body = await request.json().catch(() => null) as { enabled?: unknown; intervalMinutes?: unknown } | null;
  if (typeof body?.enabled !== "boolean") return Response.json({ error: "Choose an enabled state." }, { status: 400 });
  const intervalMinutes = Number(body.intervalMinutes);
  if (body.intervalMinutes !== undefined && ![1, 1440, 2880].includes(intervalMinutes)) return Response.json({ error: "Choose 1 minute, 1 day or 2 days." }, { status: 400 });
  try { return Response.json(await setBotEnabled(body.enabled, body.intervalMinutes === undefined ? undefined : intervalMinutes)); }
  catch { return Response.json({ error: "Could not update bot state." }, { status: 503 }); }
}

// The Site must stay owner-private. The Sites dispatcher authenticates cloud
// service requests before they reach this route.
export async function POST() {
  const result = await runPublisher();
  return Response.json(result, { status: result.status === "failed" ? 500 : 200 });
}

