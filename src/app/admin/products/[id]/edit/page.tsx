import type { Metadata } from "next";

import { ProductEditPage } from "@/features/products/components/product-pages";

export const metadata: Metadata = { title: "Ubah Produk" };

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <ProductEditPage params={params} />;
}
