import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { GALLERY_CONFIG, type GalleryKind } from "@/features/gallery/config";
import type { GalleryItemDto } from "@/features/gallery/schemas";
import { api, toQueryString } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

export interface GalleryListParams {
  q: string;
  page: number;
}

/** Query key factory: prefixes gallery queries with ["gallery", kind]. */
export const galleryKeys = {
  all: (kind: GalleryKind) => ["gallery", kind] as const,
  lists: (kind: GalleryKind) => [...galleryKeys.all(kind), "list"] as const,
  list: (kind: GalleryKind, params: GalleryListParams) =>
    [...galleryKeys.lists(kind), params] as const,
  detail: (kind: GalleryKind, id: string) =>
    [...galleryKeys.all(kind), "detail", id] as const,
};

/** Admin data uses 30-second stale time for responsive cache revalidation. */
const STALE_TIME = 30_000;

/**
 * Shared query configuration across server prefetching and client hydration.
 */
export function galleryListOptions(
  kind: GalleryKind,
  params: GalleryListParams,
) {
  return queryOptions({
    queryKey: galleryKeys.list(kind, params),
    queryFn: ({ signal }) =>
      api.get<Paginated<GalleryItemDto>>(
        `${GALLERY_CONFIG[kind].adminApi}${toQueryString({ q: params.q, page: params.page })}`,
        signal,
      ),
    staleTime: STALE_TIME,
    // Keeps previous data while paginating or searching to prevent layout flicker.
    placeholderData: keepPreviousData,
  });
}

export function galleryDetailOptions(kind: GalleryKind, id: string) {
  return queryOptions({
    queryKey: galleryKeys.detail(kind, id),
    queryFn: ({ signal }) =>
      api.get<GalleryItemDto>(`${GALLERY_CONFIG[kind].adminApi}/${id}`, signal),
    staleTime: STALE_TIME,
  });
}
