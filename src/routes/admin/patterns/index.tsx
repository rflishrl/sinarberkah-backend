import { createFileRoute, Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { z } from "zod";

import { PageHeading } from "@/components/admin-kit/page-heading";
import { SearchForm } from "@/components/admin-kit/search-form";
import { Button } from "@/components/ui/button";
import { GalleryListView } from "@/features/gallery/components/gallery-list-view";
import { GALLERY_CONFIG } from "@/features/gallery/config";

const searchSchema = z.object({
  q: z.string().optional().catch(""),
  page: z.coerce.number().optional().catch(1),
});

export const Route = createFileRoute("/admin/patterns/")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [{ title: "Galeri Pola | Panel Admin Sinar Berkah" }],
  }),
  component: PatternsPage,
});

function PatternsPage() {
  const { q, page } = Route.useSearch();
  const params = { q: q ?? "", page: page ?? 1 };
  const config = GALLERY_CONFIG.pattern;

  return (
    <div className="space-y-6">
      <PageHeading
        title="Galeri Pola"
        description="Koleksi motif dan pola cetak terpal atau tenda yang tersedia untuk pesanan."
        action={
          <Button asChild size="lg" className="h-11 px-4">
            <Link to="/admin/patterns/new">
              <PlusIcon aria-hidden="true" />
              Tambah pola
            </Link>
          </Button>
        }
      />
      <SearchForm
        defaultValue={params.q}
        placeholder="Cari nama motif..."
        clearHref={config.adminPath}
      />
      <GalleryListView kind="pattern" params={params} />
    </div>
  );
}
