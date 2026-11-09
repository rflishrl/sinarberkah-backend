import { createServerFn } from "@tanstack/react-start";

import type { GalleryKind } from "@/features/gallery/config";
import { findGalleryItem } from "@/features/gallery/repository";
import type { GalleryItemDto } from "@/features/gallery/schemas";
import { assertAdmin } from "@/lib/auth/authorize";
import { getCurrentAdmin } from "@/lib/auth/session";

export const getGalleryItemByIdServerFn = createServerFn({ method: "GET" })
  .validator((params: { id: string; kind: GalleryKind }) => params)
  .handler(async ({ data: { id, kind } }): Promise<GalleryItemDto | null> => {
    const actor = await getCurrentAdmin();
    assertAdmin(actor);
    return findGalleryItem(kind, id);
  });
