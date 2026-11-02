"use client";

import {
  AlertCircleIcon,
  PackageIcon,
  PencilIcon,
  PlusIcon,
} from "lucide-react";
import Link from "next/link";

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
import { useDeleteProduct, useProductList } from "@/features/products/hooks";
import {
  PRODUCTS_ADMIN_PATH,
  type ProductListParams,
} from "@/features/products/queries";
import type { ProductDto } from "@/features/products/schemas";
import { formatRupiah } from "@/lib/utils";

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <Badge className="bg-success-soft text-success">Tampil</Badge>
  ) : (
    <Badge variant="secondary">Disembunyikan</Badge>
  );
}

function RowActions({ product }: { product: ProductDto }) {
  const remove = useDeleteProduct();
  return (
    <div className="flex justify-end gap-1">
      <Button asChild variant="ghost" size="lg" className="h-11 px-3">
        <Link
          href={`${PRODUCTS_ADMIN_PATH}/${product._id}/edit`}
          aria-label={`Ubah ${product.name}`}
        >
          <PencilIcon aria-hidden="true" />
          <span className="hidden sm:inline">Ubah</span>
        </Link>
      </Button>
      <DeleteDialog
        itemName={product.name}
        onConfirm={() => remove.mutateAsync(product._id)}
      />
    </div>
  );
}

export function ProductListView({ params }: { params: ProductListParams }) {
  const { data, error, isPending, isFetching, refetch } =
    useProductList(params);

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
            <PackageIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>
            {params.q ? "Tidak ada hasil" : "Belum ada produk"}
          </EmptyTitle>
          <EmptyDescription>
            {params.q
              ? "Coba kata kunci lain."
              : "Tambahkan produk pertama agar tampil di website."}
          </EmptyDescription>
        </EmptyHeader>
        {!params.q && (
          <EmptyContent>
            <Button asChild size="lg" className="h-11 px-4">
              <Link href={`${PRODUCTS_ADMIN_PATH}/new`}>
                <PlusIcon aria-hidden="true" />
                Tambah produk
              </Link>
            </Button>
          </EmptyContent>
        )}
      </Empty>
    );
  }

  return (
    <div aria-busy={isFetching}>
      <div className="hidden overflow-hidden rounded-lg bg-card shadow-card md:block">
        <Table>
          <TableCaption className="sr-only">Daftar produk</TableCaption>
          <TableHeader className="bg-muted/60">
            <TableRow>
              <TableHead className="px-4">Produk</TableHead>
              <TableHead className="px-4">Harga</TableHead>
              <TableHead className="px-4">Status</TableHead>
              <TableHead className="px-4 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((product) => (
              <TableRow key={product._id}>
                <TableCell className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Thumb src={product.image.image_url} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{product.name}</p>
                      <p className="truncate text-muted-foreground">
                        {product.category || "Tanpa kategori"}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-4 whitespace-nowrap">
                  {formatRupiah(product.price)}
                </TableCell>
                <TableCell className="px-4">
                  <StatusBadge active={product.isActive} />
                </TableCell>
                <TableCell className="px-4">
                  <RowActions product={product} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="space-y-3 md:hidden">
        {data.items.map((product) => (
          <li key={product._id} className="rounded-lg bg-card p-4 shadow-card">
            <div className="flex gap-3">
              <Thumb src={product.image.image_url} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{product.name}</p>
                <p className="text-sm text-muted-foreground">
                  {product.category || "Tanpa kategori"}
                </p>
                <p className="mt-1 text-sm">{formatRupiah(product.price)}</p>
              </div>
              <div className="shrink-0">
                <StatusBadge active={product.isActive} />
              </div>
            </div>
            <div className="mt-3 border-t pt-3">
              <RowActions product={product} />
            </div>
          </li>
        ))}
      </ul>

      <PaginationNav
        pagination={data.pagination}
        basePath={PRODUCTS_ADMIN_PATH}
        q={params.q}
      />
    </div>
  );
}
