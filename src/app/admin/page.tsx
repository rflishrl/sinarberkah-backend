import { AlertTriangleIcon, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { IconType } from "react-icons";
import { MdGridView, MdInventory2, MdPhotoLibrary } from "react-icons/md";

import { PageHeading } from "@/components/admin-kit/page-heading";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDashboardCounts } from "@/features/dashboard/service";
import { RevalidateCard } from "@/features/revalidate/components/revalidate-card";
import { getRevalidateStatus } from "@/features/revalidate/service";
import { getCurrentAdmin } from "@/lib/auth/session";
import { createSessionClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard" };

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/products/v1",
    note: "Daftar produk aktif",
    access: "Publik",
  },
  {
    method: "GET",
    path: "/api/gallery/v1/portfolio",
    note: "Daftar portofolio",
    access: "Publik",
  },
  {
    method: "GET",
    path: "/api/gallery/v1",
    note: "Daftar galeri pola",
    access: "Publik",
  },
  {
    method: "GET / POST",
    path: "/api/admin/products",
    note: "Daftar dan tambah produk",
    access: "Admin",
  },
  {
    method: "GET / POST",
    path: "/api/admin/portfolio",
    note: "Daftar dan tambah portofolio",
    access: "Admin",
  },
  {
    method: "GET / POST",
    path: "/api/admin/patterns",
    note: "Daftar dan tambah pola",
    access: "Admin",
  },
  {
    method: "PATCH / DELETE",
    path: "/api/admin/.../{id}",
    note: "Ubah atau hapus data",
    access: "Admin",
  },
  { method: "POST", path: "/api/upload", note: "Unggah foto", access: "Admin" },
];

function StatCard({
  label,
  value,
  href,
  icon: Icon,
}: {
  label: string;
  value: number;
  href: string;
  icon: IconType;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-lg bg-card p-5 shadow-card transition-shadow duration-200 hover:shadow-md motion-reduce:transition-none"
    >
      <span className="inline-flex size-12 items-center justify-center rounded-md bg-brand/15 text-brand-strong">
        <Icon size={26} aria-hidden="true" />
      </span>
      <span>
        <span className="block font-heading text-3xl leading-none font-extrabold">
          {value}
        </span>
        <span className="mt-1 block text-sm font-semibold text-muted-foreground group-hover:text-foreground">
          {label}
        </span>
      </span>
    </Link>
  );
}

/**
 * Dashboard dirender penuh di server: datanya hanya angka ringkasan tanpa interaksi,
 * jadi tidak perlu TanStack Query atau hidrasi.
 */
export default async function DashboardPage() {
  const [supabase, actor] = await Promise.all([
    createSessionClient(),
    getCurrentAdmin(),
  ]);
  const counts = await getDashboardCounts(supabase, actor);
  const revalidateStatus = getRevalidateStatus(actor);
  const blobReady = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

  return (
    <>
      <PageHeading
        title="Dashboard"
        description="Ringkasan konten yang tampil di website Sinar Berkah."
      />

      {!blobReady && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangleIcon aria-hidden="true" />
          <AlertDescription>
            Unggah foto belum aktif karena <code>BLOB_READ_WRITE_TOKEN</code>{" "}
            belum diisi. Anda masih bisa menambah data dengan menempel URL foto.
          </AlertDescription>
        </Alert>
      )}

      <section aria-labelledby="stats-title">
        <h2 id="stats-title" className="sr-only">
          Jumlah data
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Produk"
            value={counts.products}
            href="/admin/products"
            icon={MdInventory2}
          />
          <StatCard
            label="Portofolio"
            value={counts.portfolio}
            href="/admin/portfolio"
            icon={MdPhotoLibrary}
          />
          <StatCard
            label="Galeri Pola"
            value={counts.patterns}
            href="/admin/patterns"
            icon={MdGridView}
          />
        </div>
      </section>

      <section aria-labelledby="quick-title" className="mt-8">
        <h2 id="quick-title" className="font-heading text-lg font-bold">
          Tambah cepat
        </h2>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-11 px-4">
            <Link href="/admin/products/new">
              <PlusIcon aria-hidden="true" />
              Produk
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-11 px-4">
            <Link href="/admin/portfolio/new">
              <PlusIcon aria-hidden="true" />
              Portofolio
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-11 px-4">
            <Link href="/admin/patterns/new">
              <PlusIcon aria-hidden="true" />
              Pola
            </Link>
          </Button>
        </div>
      </section>

      <section aria-labelledby="refresh-title" className="mt-10">
        <h2 id="refresh-title" className="font-heading text-lg font-bold">
          Penyegaran situs publik
        </h2>
        <p className="mt-1 mb-3 text-muted-foreground">
          Setelah Anda menyimpan atau menghapus data, backend menyuruh situs
          publik memperbarui halamannya. Jika tombol uji gagal, perubahan baru
          tampil di situs setelah sekitar 1 jam.
        </p>
        <RevalidateCard status={revalidateStatus} />
      </section>

      <section aria-labelledby="api-title" className="mt-10">
        <h2 id="api-title" className="font-heading text-lg font-bold">
          Alamat API
        </h2>
        <p className="mt-1 text-muted-foreground">
          Frontend membaca data dari alamat publik. Perubahan di panel ini
          langsung tampil jika FRONTEND_URL dan REVALIDATE_SECRET diisi; jika
          tidak, setelah cache habis (sekitar 1 jam).
        </p>
        <div className="mt-3 overflow-hidden rounded-lg bg-card shadow-card">
          <Table>
            <TableCaption className="sr-only">Daftar alamat API</TableCaption>
            <TableHeader className="bg-muted/60">
              <TableRow>
                <TableHead className="px-4">Metode</TableHead>
                <TableHead className="px-4">Alamat</TableHead>
                <TableHead className="px-4">Fungsi</TableHead>
                <TableHead className="px-4">Akses</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ENDPOINTS.map((endpoint) => (
                <TableRow key={`${endpoint.method}-${endpoint.path}`}>
                  <TableCell className="px-4 font-mono text-xs font-semibold">
                    {endpoint.method}
                  </TableCell>
                  <TableCell className="px-4 font-mono text-xs">
                    {endpoint.path}
                  </TableCell>
                  <TableCell className="px-4">{endpoint.note}</TableCell>
                  <TableCell className="px-4">{endpoint.access}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </>
  );
}
