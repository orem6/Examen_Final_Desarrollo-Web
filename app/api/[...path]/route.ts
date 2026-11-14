import { env } from "cloudflare:workers";
import { handleApi } from "@/lib/api";
export const dynamic = "force-dynamic";
function route(request: Request) {
  return handleApi(
    request,
    env as unknown as {
      FIREBASE_PROJECT_ID?: string;
      FIREBASE_API_KEY?: string;
    },
  );
}
export const GET = route;
export const POST = route;
export const PATCH = route;
