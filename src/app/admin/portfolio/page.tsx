import type { Metadata } from "next";

import { GalleryListPage } from "@/components/admin/gallery-pages";

export const metadata: Metadata = { title: "Portofolio" };

export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <GalleryListPage kind="portfolio" searchParams={searchParams} />;
}
