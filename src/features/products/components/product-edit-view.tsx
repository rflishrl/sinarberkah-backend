"use client";

import { AlertCircleIcon } from "lucide-react";

import { ListSkeleton } from "@/components/admin-kit/list-skeleton";
import { PageHeading } from "@/components/admin-kit/page-heading";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProductForm } from "@/features/products/components/product-form";
import { useProduct } from "@/features/products/hooks";

export function ProductEditView({ id }: { id: string }) {
  const { data, error, isPending } = useProduct(id);

  if (isPending) return <ListSkeleton rows={3} />;
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircleIcon aria-hidden="true" />
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <PageHeading title="Ubah produk" description={data.name} />
      <ProductForm key={data.updatedAt} product={data} />
    </>
  );
}
