import { Link } from "@tanstack/react-router";
import {
  AlertCircleIcon,
  ImagesIcon,
  PencilIcon,
  PlusIcon,
} from "lucide-react";

import { DeleteDialog } from "@/components/admin-kit/delete-dialog";
import { ListSkeleton } from "@/components/admin-kit/list-skeleton";
import { PaginationNav } from "@/components/admin-kit/pagination-nav";
import { Thumb } from "@/components/admin-kit/thumb";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GALLERY_CONFIG, type GalleryKind } from "@/features/gallery/config";
import { useDeleteGalleryItem, useGalleryList } from "@/features/gallery/hooks";
import type { GalleryListParams } from "@/features/gallery/queries";
import type { GalleryItemDto } from "@/features/gallery/schemas";
import { formatDate } from "@/lib/utils";

function EditLink({
  kind,
  id,
  name,
}: {
  kind: GalleryKind;
  id: string;
  name: string;
}) {
  const to =
    kind === "portfolio"
      ? ("/admin/portfolio/$id/edit" as const)
      : ("/admin/patterns/$id/edit" as const);
  return (
    <Button asChild variant="ghost" size="lg" className="h-11 px-3">
      <Link to={to} params={{ id }} aria-label={`Ubah ${name}`}>
        <PencilIcon aria-hidden="true" />
        <span className="hidden sm:inline">Ubah</span>
      </Link>
    </Button>
  );
}

function RowActions({
  kind,
  item,
}: {
  kind: GalleryKind;
  item: GalleryItemDto;
}) {
  const remove = useDeleteGalleryItem(kind);
  return (
    <div className="flex justify-end gap-1">
      <EditLink kind={kind} id={item._id} name={item.title} />
      <DeleteDialog
        itemName={item.title}
        onConfirm={() => remove.mutateAsync(item._id)}
      />
    </div>
  );
}

export function GalleryListView({
  kind,
  params,
}: {
  kind: GalleryKind;
  params: GalleryListParams;
}) {
  const config = GALLERY_CONFIG[kind];
  const { data, error, isPending, isFetching, refetch } = useGalleryList(
    kind,
    params,
  );

  if (isPending) return <ListSkeleton />;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircleIcon aria-hidden="true" />
        <AlertTitle>Data gagal dimuat</AlertTitle>
        <AlertDescription>
          <p>{error.message}</p>
          <Button
            variant="outline"
            className="mt-2 h-11"
            onClick={() => refetch()}
          >
            Coba lagi
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (data.items.length === 0) {
    return (
      <Empty className="border border-dashed bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ImagesIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>
            {params.q ? "Tidak ada hasil" : `Belum ada ${config.singular}`}
          </EmptyTitle>
          <EmptyDescription>
            {params.q
              ? "Coba kata kunci lain."
              : `Tambahkan ${config.singular} pertama agar tampil di website.`}
          </EmptyDescription>
        </EmptyHeader>
        {!params.q && (
          <EmptyContent>
            <Button asChild size="lg" className="h-11 px-4">
              <Link
                to={
                  kind === "portfolio"
                    ? "/admin/portfolio/new"
                    : "/admin/patterns/new"
                }
              >
                <PlusIcon aria-hidden="true" />
                Tambah {config.singular}
              </Link>
            </Button>
          </EmptyContent>
        )}
      </Empty>
    );
  }

  return (
    <div aria-busy={isFetching}>
      {/* Tablet ke atas: tabel */}
      <div className="hidden overflow-hidden rounded-lg bg-card shadow-card md:block">
        <Table>
          <TableCaption className="sr-only">
            Daftar {config.title.toLowerCase()}
          </TableCaption>
          <TableHeader className="bg-muted/60">
            <TableRow>
              <TableHead className="px-4">Judul</TableHead>
              <TableHead className="px-4">Jenis</TableHead>
              <TableHead className="px-4">Ditambahkan</TableHead>
              <TableHead className="px-4 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((item, index) => (
              <TableRow key={item._id}>
                <TableCell className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Thumb src={item.image.image_url} priority={index < 4} />
                    <p className="min-w-0 truncate font-semibold">
                      {item.title}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="px-4">
                  <Badge variant="secondary">{item.type}</Badge>
                </TableCell>
                <TableCell className="px-4 whitespace-nowrap text-muted-foreground">
                  {formatDate(item.createdAt)}
                </TableCell>
                <TableCell className="px-4">
                  <RowActions kind={kind} item={item} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* HP: kartu */}
      <ul className="space-y-3 md:hidden">
        {data.items.map((item, index) => (
          <li key={item._id} className="rounded-lg bg-card p-4 shadow-card">
            <div className="flex gap-3">
              <Thumb src={item.image.image_url} priority={index < 3} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{item.title}</p>
                <Badge variant="secondary" className="mt-1">
                  {item.type}
                </Badge>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDate(item.createdAt)}
                </p>
              </div>
            </div>
            <div className="mt-3 border-t pt-3">
              <RowActions kind={kind} item={item} />
            </div>
          </li>
        ))}
      </ul>

      <PaginationNav
        pagination={data.pagination}
        basePath={config.adminPath}
        q={params.q}
      />
    </div>
  );
}
