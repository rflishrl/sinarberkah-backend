import { createFileRoute } from "@tanstack/react-router";

import { PageHeading } from "@/components/admin-kit/page-heading";
import { GalleryForm } from "@/features/gallery/components/gallery-form";
import { GALLERY_CONFIG } from "@/features/gallery/config";

export const Route = createFileRoute("/admin/portfolio/new")({
  head: () => ({
    meta: [{ title: "Tambah Portofolio | Panel Admin Sinar Berkah" }],
  }),
  component: PortfolioNewPage,
});

function PortfolioNewPage() {
  const config = GALLERY_CONFIG.portfolio;
  return (
    <div className="space-y-6">
      <PageHeading title={`Tambah ${config.singular}`} />
      <GalleryForm kind="portfolio" />
    </div>
  );
}
