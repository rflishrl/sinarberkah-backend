import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/admin/list-parts";
import { ProductForm } from "@/components/admin/product-form";
import { getProduct } from "@/lib/queries";

export const metadata: Metadata = { title: "Ubah Produk" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  return (
    <>
      <PageHeading title="Ubah produk" description={product.name} />
      <ProductForm product={product} />
    </>
  );
}
