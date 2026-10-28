import type { Metadata } from "next";
import { MdAdd } from "react-icons/md";

import {
  NoticeBanner,
  PageHeading,
  Pagination,
  SearchForm,
} from "@/components/admin/list-parts";
import { ProductList } from "@/components/admin/lists";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { listProducts, parseListParams } from "@/lib/queries";

export const metadata: Metadata = { title: "Produk" };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseListParams(await searchParams);
  const { items, total, totalPages } = await listProducts(params);

  return (
    <>
      <PageHeading
        title="Produk"
        description="Kelola daftar produk dan harga yang tampil di website."
        action={
          <ButtonLink href="/admin/products/new">
            <MdAdd size={20} aria-hidden="true" />
            Tambah produk
          </ButtonLink>
        }
      />
      <NoticeBanner notice={params.notice} />
      <SearchForm
        defaultValue={params.q}
        placeholder="Cari nama atau kategori..."
      />

      {items.length === 0 ? (
        <EmptyState
          title={params.q ? "Tidak ada hasil" : "Belum ada produk"}
          description={
            params.q
              ? "Coba kata kunci lain."
              : "Tambahkan produk pertama agar tampil di website."
          }
          action={
            params.q ? undefined : (
              <ButtonLink href="/admin/products/new">Tambah produk</ButtonLink>
            )
          }
        />
      ) : (
        <>
          <ProductList items={items} />
          <Pagination
            page={params.page}
            totalPages={totalPages}
            total={total}
            basePath="/admin/products"
            q={params.q}
          />
        </>
      )}
    </>
  );
}
