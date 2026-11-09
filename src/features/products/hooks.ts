import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";

import {
  PRODUCTS_ADMIN_API,
  PRODUCTS_ADMIN_PATH,
  type ProductListParams,
  productDetailOptions,
  productKeys,
  productListOptions,
} from "@/features/products/queries";
import type {
  ProductDto,
  ProductFormValues,
} from "@/features/products/schemas";
import { type ApiClientError, api } from "@/lib/api/client";

export function useProductList(params: ProductListParams) {
  return useQuery(productListOptions(params));
}

export function useProduct(id: string) {
  return useQuery(productDetailOptions(id));
}

export function useSaveProduct(id?: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation<ProductDto, ApiClientError, ProductFormValues>({
    mutationFn: (values) =>
      id
        ? api.patch<ProductDto>(`${PRODUCTS_ADMIN_API}/${id}`, values)
        : api.post<ProductDto>(PRODUCTS_ADMIN_API, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: productKeys.all });
      toast.success(
        id ? "Perubahan berhasil disimpan." : "Berhasil ditambahkan.",
      );
      router.navigate({ to: PRODUCTS_ADMIN_PATH });
    },
  });
}

/** Tanpa optimistic update: penghapusan permanen, jadi tunggu jawaban server. */
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation<{ _id: string }, ApiClientError, string>({
    mutationFn: (id) =>
      api.delete<{ _id: string }>(`${PRODUCTS_ADMIN_API}/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: productKeys.all });
      toast.success("Berhasil dihapus.");
    },
  });
}
