import { env } from "cloudflare:workers";
import { getWorkspaceUser } from "../../../workspace-auth";
import { runPublisher } from "../../../../lib/publisher";

export async function POST(request: Request) {
  const configuredSecret = env.BOT_TRIGGER_SECRET;
  const suppliedSecret = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const isCloudTrigger = Boolean(configuredSecret && suppliedSecret === configuredSecret);
  if (!isCloudTrigger && !await getWorkspaceUser()) return Response.json({ error: "Sign in to run the bot." }, { status: 401 });
  try {
    const result = await runPublisher();
    return Response.json(result, { status: result.status === "failed" ? 500 : 200 });
  } catch {
    return Response.json({ error: "Bot check could not be completed." }, { status: 503 });
  }
}

