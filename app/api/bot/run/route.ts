import { getChatGPTUser } from "../../../chatgpt-auth";
import { runPublisher } from "../../../../lib/publisher";

export async function POST() {
  if (!await getChatGPTUser()) return Response.json({ error: "Sign in to run the bot." }, { status: 401 });
  try {
    const result = await runPublisher();
    return Response.json(result, { status: result.status === "failed" ? 500 : 200 });
  } catch {
    return Response.json({ error: "Bot check could not be completed." }, { status: 503 });
  }
}
