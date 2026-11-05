import "server-only";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/admin-kit/page-heading";
import { SearchForm } from "@/components/admin-kit/search-form";
import { Button } from "@/components/ui/button";
import { ProductEditView } from "@/features/products/components/product-edit-view";
import { ProductForm } from "@/features/products/components/product-form";
import { ProductListView } from "@/features/products/components/product-list-view";
import {
  PRODUCTS_ADMIN_PATH,
  productDetailOptions,
  productListOptions,
} from "@/features/products/queries";
import { getProduct, listProductsFor } from "@/features/products/service";
import { AppError } from "@/lib/api/errors";
import { getCurrentAdmin } from "@/lib/auth/session";
import { getQueryClient } from "@/lib/query/query-client";
import { listQuerySchema } from "@/lib/schemas/common";

type RawSearchParams = Record<string, string | string[] | undefined>;

const first = (raw: RawSearchParams) =>
  Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );

/** List view: calls service directly on server and hydrates TanStack Query cache. */
export async function ProductListPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const query = listQuerySchema(10).parse(first(await searchParams));
  const params = { q: query.q ?? "", page: query.page };

  const actor = await getCurrentAdmin();
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    ...productListOptions(params),
    queryFn: () =>
      listProductsFor({ audience: "admin", actor }, params),
  });

  return (
    <>
      <PageHeading
        title="Produk"
        description="Kelola daftar produk dan harga yang tampil di website."
        action={
          <Button asChild size="lg" className="h-11 px-4">
            <Link href={`${PRODUCTS_ADMIN_PATH}/new`}>
              <PlusIcon aria-hidden="true" />
              Tambah produk
            </Link>
          </Button>
        }
      />
      <SearchForm
        defaultValue={params.q}
        placeholder="Cari nama atau kategori..."
        clearHref={PRODUCTS_ADMIN_PATH}
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ProductListView params={params} />
      </HydrationBoundary>
    </>
  );
}

/** Create view: no initial data required. */
export function ProductCreatePage() {
  return (
    <>
      <PageHeading title="Tambah produk" />
      <ProductForm />
    </>
  );
}

/** Edit view: prefetches data to prefill form; returns 404 if record is missing. */
export async function ProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actor = await getCurrentAdmin();
  const queryClient = getQueryClient();

  try {
    await queryClient.fetchQuery({
      ...productDetailOptions(id),
      queryFn: () => getProduct({ audience: "admin", actor }, id),
    });
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") notFound();
    throw error;
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductEditView id={id} />
    </HydrationBoundary>
  );
}
