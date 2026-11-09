import { createFileRoute, Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { z } from "zod";

import { PageHeading } from "@/components/admin-kit/page-heading";
import { SearchForm } from "@/components/admin-kit/search-form";
import { Button } from "@/components/ui/button";
import { ProductListView } from "@/features/products/components/product-list-view";
import { PRODUCTS_ADMIN_PATH } from "@/features/products/queries";

const searchSchema = z.object({
  q: z.string().optional().catch(""),
  page: z.coerce.number().optional().catch(1),
});

export const Route = createFileRoute("/admin/products/")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [{ title: "Produk | Panel Admin Sinar Berkah" }],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const { q, page } = Route.useSearch();
  const params = { q: q ?? "", page: page ?? 1 };

  return (
    <div className="space-y-6">
      <PageHeading
        title="Produk"
        description="Kelola daftar produk dan harga yang tampil di website."
        action={
          <Button asChild size="lg" className="h-11 px-4">
            <Link to={`${PRODUCTS_ADMIN_PATH}/new`}>
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
      <ProductListView params={params} />
    </div>
  );
}
