import { createServerFn } from "@tanstack/react-start";

import {
  type DashboardCounts,
  getDashboardCounts,
} from "@/features/dashboard/service";
import { getCurrentAdmin } from "@/lib/auth/session";

export interface DashboardData {
  counts: DashboardCounts;
  blobReady: boolean;
}

export const getDashboardServerFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<DashboardData> => {
    const actor = await getCurrentAdmin();
    const counts = await getDashboardCounts(actor);
    const blobReady = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
    return { counts, blobReady };
  },
);
