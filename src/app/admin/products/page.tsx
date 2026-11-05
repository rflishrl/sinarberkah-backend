import type { Metadata } from "next";

import { ProductListPage } from "@/features/products/components/product-pages";

export const metadata: Metadata = { title: "Produk" };

export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <ProductListPage searchParams={searchParams} />;
}
