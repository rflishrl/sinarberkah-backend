import { createServerFn } from "@tanstack/react-start";

import {
  type DashboardCounts,
  getDashboardCounts,
} from "@/features/dashboard/service";
import { getRevalidateStatus } from "@/features/revalidate/service";
import type { RevalidateStatus } from "@/features/revalidate/types";
import { getCurrentAdmin } from "@/lib/auth/session";

export interface DashboardData {
  counts: DashboardCounts;
  revalidateStatus: RevalidateStatus;
  blobReady: boolean;
}

export const getDashboardServerFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<DashboardData> => {
    const actor = await getCurrentAdmin();
    const counts = await getDashboardCounts(actor);
    const revalidateStatus = getRevalidateStatus(actor);
    const blobReady = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
    return { counts, revalidateStatus, blobReady };
  },
);
