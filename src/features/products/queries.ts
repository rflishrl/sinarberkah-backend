import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import type { ProductDto } from "@/features/products/schemas";
import { api, toQueryString } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

export const PRODUCTS_ADMIN_API = "/api/admin/products";
export const PRODUCTS_ADMIN_PATH = "/admin/products";

export interface ProductListParams {
  q: string;
  page: number;
}

export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (params: ProductListParams) =>
    [...productKeys.lists(), params] as const,
  detail: (id: string) => [...productKeys.all, "detail", id] as const,
};

const STALE_TIME = 30_000;

/** Dipakai bersama server (prefetch, queryFn diganti service) dan client. */
export function productListOptions(params: ProductListParams) {
  return queryOptions({
    queryKey: productKeys.list(params),
    queryFn: ({ signal }) =>
      api.get<Paginated<ProductDto>>(
        `${PRODUCTS_ADMIN_API}${toQueryString({ q: params.q, page: params.page })}`,
        signal,
      ),
    staleTime: STALE_TIME,
    placeholderData: keepPreviousData,
  });
}

export function productDetailOptions(id: string) {
  return queryOptions({
    queryKey: productKeys.detail(id),
    queryFn: ({ signal }) =>
      api.get<ProductDto>(`${PRODUCTS_ADMIN_API}/${id}`, signal),
    staleTime: STALE_TIME,
  });
}
