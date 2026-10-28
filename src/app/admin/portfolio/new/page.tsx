import type { Metadata } from "next";

import { GalleryCreatePage } from "@/components/admin/gallery-pages";

export const metadata: Metadata = { title: "Tambah Portofolio" };

export default function Page() {
  return <GalleryCreatePage kind="portfolio" />;
}
