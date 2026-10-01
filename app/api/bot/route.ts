import { runPublisher } from "../../../lib/publisher";

// The Site must stay owner-private. The Sites dispatcher authenticates cloud
// service requests before they reach this route.
export async function POST() {
  const result = await runPublisher();
  return Response.json(result, { status: result.status === "failed" ? 500 : 200 });
}
