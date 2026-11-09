import { createFileRoute } from "@tanstack/react-router";

import { PageHeading } from "@/components/admin-kit/page-heading";
import { ProductForm } from "@/features/products/components/product-form";

export const Route = createFileRoute("/admin/products/new")({
  head: () => ({
    meta: [{ title: "Tambah Produk | Panel Admin Sinar Berkah" }],
  }),
  component: ProductNewPage,
});

function ProductNewPage() {
  return (
    <div className="space-y-6">
      <PageHeading title="Tambah produk" />
      <ProductForm />
    </div>
  );
}
