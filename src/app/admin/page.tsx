import type { Metadata } from "next";
import Link from "next/link";
import type { IconType } from "react-icons";
import {
  MdAdd,
  MdGridView,
  MdInventory2,
  MdPhotoLibrary,
} from "react-icons/md";

import { PageHeading } from "@/components/admin/list-parts";
import { buttonStyles } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { getCounts } from "@/lib/queries";

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
    method: "POST",
    path: "/api/products/v1",
    note: "Tambah produk",
    access: "Admin",
  },
  {
    method: "POST",
    path: "/api/gallery/v1/portfolio",
    note: "Tambah portofolio",
    access: "Admin",
  },
  {
    method: "POST",
    path: "/api/gallery/v1",
    note: "Tambah pola",
    access: "Admin",
  },
  {
    method: "PUT / DELETE",
    path: ".../{id}",
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
      className="group flex items-center gap-4 rounded-lg bg-white p-5 shadow-card transition-shadow duration-200 hover:shadow-md motion-reduce:transition-none"
    >
      <span className="inline-flex size-12 items-center justify-center rounded-md bg-brand/15 text-brand-strong">
        <Icon size={26} aria-hidden="true" />
      </span>
      <span>
        <span className="block font-heading text-3xl leading-none font-extrabold">
          {value}
        </span>
        <span className="mt-1 block text-sm font-semibold text-muted group-hover:text-ink">
          {label}
        </span>
      </span>
    </Link>
  );
}

export default async function DashboardPage() {
  const counts = await getCounts();
  const blobReady = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

  return (
    <>
      <PageHeading
        title="Dashboard"
        description="Ringkasan konten yang tampil di website Sinar Berkah."
      />

      {!blobReady && (
        <Alert tone="error" className="mb-6">
          Unggah foto belum aktif karena <code>BLOB_READ_WRITE_TOKEN</code>{" "}
          belum diisi. Anda masih bisa menambah data dengan menempel URL foto.
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
          <Link href="/admin/products/new" className={buttonStyles("primary")}>
            <MdAdd size={20} aria-hidden="true" />
            Produk
          </Link>
          <Link
            href="/admin/portfolio/new"
            className={buttonStyles("secondary")}
          >
            <MdAdd size={20} aria-hidden="true" />
            Portofolio
          </Link>
          <Link
            href="/admin/patterns/new"
            className={buttonStyles("secondary")}
          >
            <MdAdd size={20} aria-hidden="true" />
            Pola
          </Link>
        </div>
      </section>

      <section aria-labelledby="api-title" className="mt-10">
        <h2 id="api-title" className="font-heading text-lg font-bold">
          Alamat API untuk frontend
        </h2>
        <p className="mt-1 text-muted">
          Frontend membaca data dari alamat berikut. Perubahan di panel ini
          tampil di website setelah cache habis (±1 jam).
        </p>
        <div className="mt-3 overflow-x-auto rounded-lg bg-white shadow-card">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Daftar alamat API</caption>
            <thead className="border-b border-line bg-surface text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Metode
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Alamat
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Fungsi
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Akses
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {ENDPOINTS.map((endpoint) => (
                <tr
                  key={`${endpoint.method}-${endpoint.path}-${endpoint.note}`}
                >
                  <td className="px-4 py-3 font-mono text-xs font-semibold whitespace-nowrap">
                    {endpoint.method}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                    {endpoint.path}
                  </td>
                  <td className="px-4 py-3">{endpoint.note}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {endpoint.access}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
