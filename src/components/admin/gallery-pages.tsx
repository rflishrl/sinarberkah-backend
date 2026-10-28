import { notFound } from "next/navigation";
import { MdAdd } from "react-icons/md";

import { GalleryForm } from "@/components/admin/gallery-form";
import { GalleryList } from "@/components/admin/lists";
import {
  NoticeBanner,
  PageHeading,
  Pagination,
  SearchForm,
} from "@/components/admin/list-parts";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { GALLERY_CONFIG, type GalleryKind } from "@/lib/gallery-config";
import { getGalleryItem, listGallery, parseListParams } from "@/lib/queries";

type RawSearchParams = Record<string, string | string[] | undefined>;

/** Halaman daftar untuk Portofolio dan Galeri Pola. */
export async function GalleryListPage({
  kind,
  searchParams,
}: {
  kind: GalleryKind;
  searchParams: Promise<RawSearchParams>;
}) {
  const config = GALLERY_CONFIG[kind];
  const params = parseListParams(await searchParams);
  const { items, total, totalPages } = await listGallery(kind, params);

  return (
    <>
      <PageHeading
        title={config.title}
        description={`Kelola ${config.title.toLowerCase()} yang tampil di website.`}
        action={
          <ButtonLink href={`${config.adminPath}/new`}>
            <MdAdd size={20} aria-hidden="true" />
            Tambah {config.singular}
          </ButtonLink>
        }
      />
      <NoticeBanner notice={params.notice} />
      <SearchForm
        defaultValue={params.q}
        placeholder={`Cari ${config.singular}...`}
        clearHref={config.adminPath}
      />

      {items.length === 0 ? (
        <EmptyState
          title={params.q ? "Tidak ada hasil" : `Belum ada ${config.singular}`}
          description={
            params.q
              ? "Coba kata kunci lain."
              : `Tambahkan ${config.singular} pertama agar tampil di website.`
          }
          action={
            params.q ? undefined : (
              <ButtonLink href={`${config.adminPath}/new`}>
                Tambah {config.singular}
              </ButtonLink>
            )
          }
        />
      ) : (
        <>
          <GalleryList
            items={items}
            adminPath={config.adminPath}
            api={config.api}
            caption={`Daftar ${config.title.toLowerCase()}`}
          />
          <Pagination
            page={params.page}
            totalPages={totalPages}
            total={total}
            basePath={config.adminPath}
            q={params.q}
          />
        </>
      )}
    </>
  );
}

export function GalleryCreatePage({ kind }: { kind: GalleryKind }) {
  const config = GALLERY_CONFIG[kind];
  return (
    <>
      <PageHeading title={`Tambah ${config.singular}`} />
      <GalleryForm kind={kind} />
    </>
  );
}

export async function GalleryEditPage({
  kind,
  params,
}: {
  kind: GalleryKind;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getGalleryItem(kind, id);
  if (!item) notFound();

  return (
    <>
      <PageHeading
        title={`Ubah ${GALLERY_CONFIG[kind].singular}`}
        description={item.title}
      />
      <GalleryForm kind={kind} item={item} />
    </>
  );
}
