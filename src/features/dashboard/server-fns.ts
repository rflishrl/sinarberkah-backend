import { createServerFn } from "@tanstack/react-start";

import {
  type DashboardCounts,
  getDashboardCounts,
} from "@/features/dashboard/service";
import { getCurrentAdmin } from "@/lib/auth/session";

export interface DashboardData {
  counts: DashboardCounts;
  storageReady: boolean;
}

export const getDashboardServerFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<DashboardData> => {
    const actor = await getCurrentAdmin();
    const counts = await getDashboardCounts(actor);
    const storageReady = Boolean(
      process.env.R2_ACCESS_KEY_ID &&
        process.env.R2_SECRET_ACCESS_KEY &&
        process.env.R2_ENDPOINT &&
        process.env.R2_BUCKET_NAME &&
        process.env.R2_PUBLIC_DOMAIN,
    );
    return { counts, storageReady };
  },
);
