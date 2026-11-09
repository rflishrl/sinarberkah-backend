import { createFileRoute } from "@tanstack/react-router";

import { GalleryEditView } from "@/features/gallery/components/gallery-edit-view";

export const Route = createFileRoute("/admin/portfolio/$id/edit")({
  head: () => ({
    meta: [{ title: "Ubah Portofolio | Panel Admin Sinar Berkah" }],
  }),
  component: PortfolioEditRoute,
});

function PortfolioEditRoute() {
  const { id } = Route.useParams();
  return (
    <div className="space-y-6">
      <GalleryEditView kind="portfolio" id={id} />
    </div>
  );
}
