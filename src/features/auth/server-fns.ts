import { createServerFn } from "@tanstack/react-start";

import type { AuthenticatedActor } from "@/lib/auth/actor";
import { getCurrentAdmin } from "@/lib/auth/session";

export const getAdminServerFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<AuthenticatedActor | null> => {
    return getCurrentAdmin();
  },
);
