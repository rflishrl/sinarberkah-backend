import { createFileRoute } from "@tanstack/react-router";

import { PageHeading } from "@/components/admin-kit/page-heading";
import { GalleryForm } from "@/features/gallery/components/gallery-form";
import { GALLERY_CONFIG } from "@/features/gallery/config";

export const Route = createFileRoute("/admin/patterns/new")({
  head: () => ({
    meta: [{ title: "Tambah Pola | Panel Admin Sinar Berkah" }],
  }),
  component: PatternsNewPage,
});

function PatternsNewPage() {
  const config = GALLERY_CONFIG.pattern;
  return (
    <div className="space-y-6">
      <PageHeading title={`Tambah ${config.singular}`} />
      <GalleryForm kind="pattern" />
    </div>
  );
}
