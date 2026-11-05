import "server-only";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/admin-kit/page-heading";
import { SearchForm } from "@/components/admin-kit/search-form";
import { Button } from "@/components/ui/button";
import { GalleryEditView } from "@/features/gallery/components/gallery-edit-view";
import { GalleryForm } from "@/features/gallery/components/gallery-form";
import { GalleryListView } from "@/features/gallery/components/gallery-list-view";
import { GALLERY_CONFIG, type GalleryKind } from "@/features/gallery/config";
import {
  galleryDetailOptions,
  galleryListOptions,
} from "@/features/gallery/queries";
import { getGalleryItem, listGallery } from "@/features/gallery/service";
import { AppError } from "@/lib/api/errors";
import { getCurrentAdmin } from "@/lib/auth/session";
import { getQueryClient } from "@/lib/query/query-client";
import { listQuerySchema } from "@/lib/schemas/common";
import { createSessionClient } from "@/lib/supabase/server";

type RawSearchParams = Record<string, string | string[] | undefined>;

function firstValues(raw: RawSearchParams): Record<string, string | undefined> {
  return Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );
}

/**
 * List view: Server Component calls service directly to hydrate initial HTML
 * and seeds TanStack Query cache for seamless subsequent navigations.
 */
export async function GalleryListPage({
  kind,
  searchParams,
}: {
  kind: GalleryKind;
  searchParams: Promise<RawSearchParams>;
}) {
  const config = GALLERY_CONFIG[kind];
  const query = listQuerySchema(10).parse(firstValues(await searchParams));
  const params = { q: query.q ?? "", page: query.page };

  const [supabase, actor] = await Promise.all([
    createSessionClient(),
    getCurrentAdmin(),
  ]);
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    ...galleryListOptions(kind, params),
    queryFn: () =>
      listGallery(supabase, { audience: "admin", actor }, kind, params),
  });

  return (
    <>
      <PageHeading
        title={config.title}
        description={`Kelola ${config.title.toLowerCase()} yang tampil di website.`}
        action={
          <Button asChild size="lg" className="h-11 px-4">
            <Link href={`${config.adminPath}/new`}>
              <PlusIcon aria-hidden="true" />
              Tambah {config.singular}
            </Link>
          </Button>
        }
      />
      <SearchForm
        defaultValue={params.q}
        placeholder={`Cari ${config.singular}...`}
        clearHref={config.adminPath}
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <GalleryListView kind={kind} params={params} />
      </HydrationBoundary>
    </>
  );
}

/** Create view: no initial data required. */
export function GalleryCreatePage({ kind }: { kind: GalleryKind }) {
  return (
    <>
      <PageHeading title={`Tambah ${GALLERY_CONFIG[kind].singular}`} />
      <GalleryForm kind={kind} />
    </>
  );
}

/**
 * Edit view: prefetches data on server; returns 404 if record is not found.
 */
export async function GalleryEditPage({
  kind,
  params,
}: {
  kind: GalleryKind;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [supabase, actor] = await Promise.all([
    createSessionClient(),
    getCurrentAdmin(),
  ]);
  const queryClient = getQueryClient();

  try {
    await queryClient.fetchQuery({
      ...galleryDetailOptions(kind, id),
      queryFn: () =>
        getGalleryItem(supabase, { audience: "admin", actor }, kind, id),
    });
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") notFound();
    throw error;
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <GalleryEditView kind={kind} id={id} />
    </HydrationBoundary>
  );
}
