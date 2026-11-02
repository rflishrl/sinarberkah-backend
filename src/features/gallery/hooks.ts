"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { GALLERY_CONFIG, type GalleryKind } from "@/features/gallery/config";
import {
  galleryDetailOptions,
  galleryKeys,
  galleryListOptions,
  type GalleryListParams,
} from "@/features/gallery/queries";
import type {
  GalleryFormValues,
  GalleryItemDto,
} from "@/features/gallery/schemas";
import { api, type ApiClientError } from "@/lib/api/client";

export function useGalleryList(kind: GalleryKind, params: GalleryListParams) {
  return useQuery(galleryListOptions(kind, params));
}

export function useGalleryItem(kind: GalleryKind, id: string) {
  return useQuery(galleryDetailOptions(kind, id));
}

/** Tambah atau ubah. Setelah berhasil: cache galeri dibuang, kembali ke daftar, toast. */
export function useSaveGalleryItem(kind: GalleryKind, id?: string) {
  const config = GALLERY_CONFIG[kind];
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation<GalleryItemDto, ApiClientError, GalleryFormValues>({
    mutationFn: (values) =>
      id
        ? api.patch<GalleryItemDto>(`${config.adminApi}/${id}`, values)
        : api.post<GalleryItemDto>(config.adminApi, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: galleryKeys.all(kind) });
      toast.success(
        id ? "Perubahan berhasil disimpan." : "Berhasil ditambahkan.",
      );
      router.push(config.adminPath);
    },
  });
}

/** Hapus. Daftar dimuat ulang dari server; tanpa optimistic update karena tindakannya permanen. */
export function useDeleteGalleryItem(kind: GalleryKind) {
  const config = GALLERY_CONFIG[kind];
  const queryClient = useQueryClient();

  return useMutation<{ _id: string }, ApiClientError, string>({
    mutationFn: (itemId) =>
      api.delete<{ _id: string }>(`${config.adminApi}/${itemId}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: galleryKeys.all(kind) });
      toast.success("Berhasil dihapus.");
    },
  });
}
