import { AlertCircleIcon } from "lucide-react";

import { ListSkeleton } from "@/components/admin-kit/list-skeleton";
import { PageHeading } from "@/components/admin-kit/page-heading";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GalleryForm } from "@/features/gallery/components/gallery-form";
import { GALLERY_CONFIG, type GalleryKind } from "@/features/gallery/config";
import { useGalleryItem } from "@/features/gallery/hooks";

/** Edit view: data is prefetched on the server for instant form population. */
export function GalleryEditView({
  kind,
  id,
}: {
  kind: GalleryKind;
  id: string;
}) {
  const { data, error, isPending } = useGalleryItem(kind, id);

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
      <PageHeading
        title={`Ubah ${GALLERY_CONFIG[kind].singular}`}
        description={data.title}
      />
      {/* key: form dibuat ulang jika data berganti (mis. setelah disimpan dari tab lain). */}
      <GalleryForm key={data.updatedAt} kind={kind} item={data} />
    </>
  );
}
