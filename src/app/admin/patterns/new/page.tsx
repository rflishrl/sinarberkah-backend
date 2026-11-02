import type { Metadata } from "next";

import { GalleryCreatePage } from "@/features/gallery/components/gallery-pages";

export const metadata: Metadata = { title: "Tambah Galeri Pola" };

export default function Page() {
  return <GalleryCreatePage kind="pattern" />;
}
