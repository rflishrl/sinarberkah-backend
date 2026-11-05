import type { Metadata } from "next";

import { ProductCreatePage } from "@/features/products/components/product-pages";

export const metadata: Metadata = { title: "Tambah Produk" };

export default function Page() {
  return <ProductCreatePage />;
}
