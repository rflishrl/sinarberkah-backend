import type { Metadata } from "next";

import { GalleryCreatePage } from "@/components/admin/gallery-pages";

export const metadata: Metadata = { title: "Tambah Galeri Pola" };

export default function Page() {
  return <GalleryCreatePage kind="pattern" />;
}
