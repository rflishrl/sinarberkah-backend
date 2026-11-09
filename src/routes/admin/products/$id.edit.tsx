import { createFileRoute } from "@tanstack/react-router";

import { ProductEditView } from "@/features/products/components/product-edit-view";

export const Route = createFileRoute("/admin/products/$id/edit")({
  head: () => ({
    meta: [{ title: "Ubah Produk | Panel Admin Sinar Berkah" }],
  }),
  component: ProductEditRoute,
});

function ProductEditRoute() {
  const { id } = Route.useParams();
  return (
    <div className="space-y-6">
      <ProductEditView id={id} />
    </div>
  );
}
