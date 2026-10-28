import { ok, route } from "@/lib/http";

export const GET = route(async () => ok({ status: "ok" }));
