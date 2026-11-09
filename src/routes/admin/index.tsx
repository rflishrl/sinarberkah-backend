import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangleIcon,
  ArrowUpRightIcon,
  Grid3X3Icon,
  ImagesIcon,
  type LucideIcon,
  PackageIcon,
  PlusIcon,
} from "lucide-react";

import { PageHeading } from "@/components/admin-kit/page-heading";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDashboardServerFn } from "@/features/dashboard/server-fns";
import { RevalidateCard } from "@/features/revalidate/components/revalidate-card";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [{ title: "Dashboard | Panel Admin Sinar Berkah" }],
  }),
  loader: () => getDashboardServerFn(),
  component: DashboardPage,
});

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

function MethodBadge({ method }: { method: string }) {
  if (method === "GET") {
    return (
      <Badge variant="outline" className="font-mono text-xs">
        GET
      </Badge>
    );
  }
  if (method === "POST" || method.includes("POST")) {
    return (
      <Badge className="bg-brand/15 font-mono text-xs text-brand-strong hover:bg-brand/25 dark:bg-brand/20 dark:text-brand">
        {method}
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="font-mono text-xs">
      {method}
    </Badge>
  );
}

function StatCard({
  label,
  value,
  href,
  category,
  icon: Icon,
}: {
  label: string;
  value: number;
  href: string;
  category: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      to={href}
      className="group block rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <Card className="h-full border border-border/80 bg-card/60 backdrop-blur-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md dark:bg-card/40">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex size-9 items-center justify-center rounded-lg border border-border/60 bg-muted/50 text-muted-foreground group-hover:border-brand/40 group-hover:bg-brand/10 group-hover:text-brand-strong dark:group-hover:text-brand">
            <Icon className="size-4.5" aria-hidden="true" />
          </div>
          <Badge variant="outline" className="text-xs text-muted-foreground">
            {category}
          </Badge>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
                {value}
              </div>
              <p className="mt-1 text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                {label}
              </p>
            </div>
            <ArrowUpRightIcon
              className="size-4 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-strong dark:group-hover:text-brand"
              aria-hidden="true"
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function DashboardPage() {
  const { counts, revalidateStatus, blobReady } = Route.useLoaderData();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeading
          title="Dashboard"
          description="Ringkasan konten dan konfigurasi operasional website Sinar Berkah."
        />
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="h-9 gap-1.5">
            <Link to="/admin/products/new">
              <PlusIcon className="size-4" aria-hidden="true" />
              <span>Produk Baru</span>
            </Link>
          </Button>
        </div>
      </div>

      {!blobReady && (
        <Alert variant="destructive">
          <AlertTriangleIcon className="size-4" aria-hidden="true" />
          <AlertTitle>Perhatian Penyimpanan Foto</AlertTitle>
          <AlertDescription>
            Penyimpanan foto belum aktif karena{" "}
            <code>BLOB_READ_WRITE_TOKEN</code> belum diisi. Anda masih bisa
            menambah data dengan menempel URL foto.
          </AlertDescription>
        </Alert>
      )}

      {/* Grid Kartu Metrik Ringkasan */}
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">
          Jumlah Data Konten
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Katalog Produk"
            value={counts.products}
            href="/admin/products"
            category="Katalog"
            icon={PackageIcon}
          />
          <StatCard
            label="Proyek Portofolio"
            value={counts.portfolio}
            href="/admin/portfolio"
            category="Galeri"
            icon={ImagesIcon}
          />
          <StatCard
            label="Galeri Pola Cetak"
            value={counts.patterns}
            href="/admin/patterns"
            category="Motif & Desain"
            icon={Grid3X3Icon}
          />
        </div>
      </section>

      {/* Aksi Cepat */}
      <section aria-labelledby="quick-actions-heading">
        <Card>
          <CardHeader>
            <CardTitle
              id="quick-actions-heading"
              className="text-base font-semibold"
            >
              Aksi Cepat
            </CardTitle>
            <CardDescription>
              Pintasan cepat untuk menambahkan item baru ke katalog dan galeri
              situs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <Button
                asChild
                className="h-11 w-full justify-start gap-2.5 px-4 font-medium"
              >
                <Link to="/admin/products/new">
                  <PlusIcon className="size-4" aria-hidden="true" />
                  <span>Tambah Produk</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 w-full justify-start gap-2.5 px-4 font-medium"
              >
                <Link to="/admin/portfolio/new">
                  <PlusIcon className="size-4" aria-hidden="true" />
                  <span>Tambah Portofolio</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 w-full justify-start gap-2.5 px-4 font-medium"
              >
                <Link to="/admin/patterns/new">
                  <PlusIcon className="size-4" aria-hidden="true" />
                  <span>Tambah Galeri Pola</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Sinkronisasi Cache Website Publik */}
      <section aria-labelledby="revalidate-heading">
        <Card>
          <CardHeader>
            <CardTitle
              id="revalidate-heading"
              className="text-base font-semibold"
            >
              Sinkronisasi Cache Website Publik
            </CardTitle>
            <CardDescription>
              Status webhook untuk menyegarkan cache frontend secara otomatis
              setiap kali data disimpan atau dihapus.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RevalidateCard status={revalidateStatus} />
          </CardContent>
        </Card>
      </section>

      {/* Tabel Alamat API */}
      <section aria-labelledby="api-heading">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2
                  id="api-heading"
                  className="text-base font-semibold text-foreground"
                >
                  Daftar Alamat API
                </h2>
                <CardDescription>
                  Daftar endpoint publik dan internal admin untuk integrasi
                  data.
                </CardDescription>
              </div>
              <Badge variant="outline" className="w-fit text-xs">
                {ENDPOINTS.length} Endpoints
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border border-border">
              <Table>
                <TableCaption className="sr-only">
                  Daftar rute API Sinar Berkah
                </TableCaption>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="w-32 px-4">Metode</TableHead>
                    <TableHead className="px-4">Rute Alamat</TableHead>
                    <TableHead className="px-4">Keterangan</TableHead>
                    <TableHead className="w-24 px-4 text-right">
                      Akses
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ENDPOINTS.map((endpoint) => (
                    <TableRow key={`${endpoint.method}-${endpoint.path}`}>
                      <TableCell className="px-4 py-3">
                        <MethodBadge method={endpoint.method} />
                      </TableCell>
                      <TableCell className="px-4 py-3 font-mono text-xs font-semibold text-foreground">
                        {endpoint.path}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                        {endpoint.note}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <Badge
                          variant={
                            endpoint.access === "Publik"
                              ? "secondary"
                              : "outline"
                          }
                          className="text-xs"
                        >
                          {endpoint.access}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
