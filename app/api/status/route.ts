import { env } from "cloudflare:workers";
import { getWorkspaceUser } from "../../workspace-auth";

export async function GET() {
  if (!await getWorkspaceUser()) return Response.json({ error: "Sign in to view connection status." }, { status: 401 });
  return Response.json({
    githubConnected: Boolean(env.GITHUB_TOKEN),
    storageReady: Boolean(env.DB && env.BUCKET),
    portfolioTarget: `${env.GITHUB_OWNER || "sudesh4545"}/${env.PORTFOLIO_REPO || "sudesh-portfolio"}`,
  });
}

