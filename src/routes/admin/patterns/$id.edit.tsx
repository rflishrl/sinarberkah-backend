import { createFileRoute } from "@tanstack/react-router";

import { GalleryEditView } from "@/features/gallery/components/gallery-edit-view";

export const Route = createFileRoute("/admin/patterns/$id/edit")({
  head: () => ({
    meta: [{ title: "Ubah Pola | Panel Admin Sinar Berkah" }],
  }),
  component: PatternsEditRoute,
});

function PatternsEditRoute() {
  const { id } = Route.useParams();
  return (
    <div className="space-y-6">
      <GalleryEditView kind="pattern" id={id} />
    </div>
  );
}
