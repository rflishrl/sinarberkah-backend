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

export const Route = createFileRoute("/admin/portfolio/")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [{ title: "Portofolio | Panel Admin Sinar Berkah" }],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const { q, page } = Route.useSearch();
  const params = { q: q ?? "", page: page ?? 1 };
  const config = GALLERY_CONFIG.portfolio;

  return (
    <div className="space-y-6">
      <PageHeading
        title="Portofolio"
        description="Dokumentasi proyek dan hasil pengerjaan tenda, kanopi, dan terpal."
        action={
          <Button asChild size="lg" className="h-11 px-4">
            <Link to="/admin/portfolio/new">
              <PlusIcon aria-hidden="true" />
              Tambah portofolio
            </Link>
          </Button>
        }
      />
      <SearchForm
        defaultValue={params.q}
        placeholder="Cari judul proyek atau klien..."
        clearHref={config.adminPath}
      />
      <GalleryListView kind="portfolio" params={params} />
    </div>
  );
}
