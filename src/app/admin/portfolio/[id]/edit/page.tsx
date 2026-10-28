import type { Metadata } from "next";

import { GalleryEditPage } from "@/components/admin/gallery-pages";

export const metadata: Metadata = { title: "Ubah Portofolio" };

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <GalleryEditPage kind="portfolio" params={params} />;
}
