import type { Metadata } from "next";

import { GalleryEditPage } from "@/components/admin/gallery-pages";

export const metadata: Metadata = { title: "Ubah Galeri Pola" };

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <GalleryEditPage kind="pattern" params={params} />;
}
