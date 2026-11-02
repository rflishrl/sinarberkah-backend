import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { GALLERY_CONFIG, type GalleryKind } from "@/features/gallery/config";
import type { GalleryItemDto } from "@/features/gallery/schemas";
import { api, toQueryString } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

export interface GalleryListParams {
  q: string;
  page: number;
}

/** Query key factory: semua key galeri satu jenis berawalan ["gallery", kind]. */
export const galleryKeys = {
  all: (kind: GalleryKind) => ["gallery", kind] as const,
  lists: (kind: GalleryKind) => [...galleryKeys.all(kind), "list"] as const,
  list: (kind: GalleryKind, params: GalleryListParams) =>
    [...galleryKeys.lists(kind), params] as const,
  detail: (kind: GalleryKind, id: string) =>
    [...galleryKeys.all(kind), "detail", id] as const,
};

/** Data admin jarang berubah dari tempat lain, jadi 30 detik dianggap masih segar. */
const STALE_TIME = 30_000;

/**
 * Dipakai bersama server dan client. Di server, `queryFn` diganti pemanggilan service
 * langsung saat prefetch; key dan staleTime tetap dari sini supaya hidrasi cocok.
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
    // Saat pindah halaman/pencarian, data lama tetap tampil sampai data baru datang.
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
