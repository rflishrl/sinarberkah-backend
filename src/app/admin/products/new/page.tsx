import type { Metadata } from "next";

import { ProductForm } from "@/components/admin/product-form";
import { PageHeading } from "@/components/admin/list-parts";

export const metadata: Metadata = { title: "Tambah Produk" };

export default function NewProductPage() {
  return (
    <>
      <PageHeading title="Tambah produk" />
      <ProductForm />
    </>
  );
}
