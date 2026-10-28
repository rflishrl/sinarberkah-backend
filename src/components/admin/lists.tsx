import Link from "next/link";
import { MdEdit } from "react-icons/md";

import { DeleteButton } from "@/components/admin/delete-button";
import { buttonStyles } from "@/components/ui/button";
import { Badge } from "@/components/ui/feedback";
import { formatDate, formatRupiah } from "@/lib/utils";
import type { GalleryItemDto, ProductDto } from "@/types";

function Thumb({ src, alt }: { src: string; alt: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element -- URL bisa dari host mana saja
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="size-14 shrink-0 rounded-md object-cover"
    />
  ) : (
    <div
      aria-label="Tanpa foto"
      role="img"
      className="flex size-14 shrink-0 items-center justify-center rounded-md bg-line text-xs text-muted"
    >
      -
    </div>
  );
}

function EditLink({ href, name }: { href: string; name: string }) {
  return (
    <Link
      href={href}
      className={buttonStyles("ghost")}
      aria-label={`Ubah ${name}`}
    >
      <MdEdit size={20} aria-hidden="true" />
      <span className="hidden sm:inline">Ubah</span>
    </Link>
  );
}

export function ProductList({ items }: { items: ProductDto[] }) {
  return (
    <>
      {/* Tablet ke atas: tabel */}
      <div className="hidden overflow-x-auto rounded-lg bg-white shadow-card md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Daftar produk</caption>
          <thead className="border-b border-line bg-surface text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">
                Produk
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Harga
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.map((product) => (
              <tr key={product._id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Thumb src={product.image.image_url} alt="" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{product.name}</p>
                      <p className="truncate text-muted">
                        {product.category || "Tanpa kategori"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {formatRupiah(product.price)}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={product.isActive ? "success" : "neutral"}>
                    {product.isActive ? "Tampil" : "Disembunyikan"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <EditLink
                      href={`/admin/products/${product._id}/edit`}
                      name={product.name}
                    />
                    <DeleteButton
                      endpoint={`/api/products/v1/${product._id}`}
                      itemName={product.name}
                      redirectTo="/admin/products?notice=deleted"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* HP: kartu */}
      <ul className="space-y-3 md:hidden">
        {items.map((product) => (
          <li key={product._id} className="rounded-lg bg-white p-4 shadow-card">
            <div className="flex gap-3">
              <Thumb src={product.image.image_url} alt="" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{product.name}</p>
                <p className="text-sm text-muted">
                  {product.category || "Tanpa kategori"}
                </p>
                <p className="mt-1 text-sm">{formatRupiah(product.price)}</p>
              </div>
              <div className="shrink-0">
                <Badge tone={product.isActive ? "success" : "neutral"}>
                  {product.isActive ? "Tampil" : "Disembunyikan"}
                </Badge>
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-1 border-t border-line pt-3">
              <EditLink
                href={`/admin/products/${product._id}/edit`}
                name={product.name}
              />
              <DeleteButton
                endpoint={`/api/products/v1/${product._id}`}
                itemName={product.name}
                redirectTo="/admin/products?notice=deleted"
              />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

export function GalleryList({
  items,
  adminPath,
  api,
  caption,
}: {
  items: GalleryItemDto[];
  adminPath: string;
  api: string;
  caption: string;
}) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-lg bg-white shadow-card md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="border-b border-line bg-surface text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">
                Judul
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Jenis
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Ditambahkan
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.map((item) => (
              <tr key={item._id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Thumb src={item.image.image_url} alt="" />
                    <p className="min-w-0 truncate font-semibold">
                      {item.title}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge tone="neutral">{item.type}</Badge>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-muted">
                  {formatDate(item.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <EditLink
                      href={`${adminPath}/${item._id}/edit`}
                      name={item.title}
                    />
                    <DeleteButton
                      endpoint={`${api}/${item._id}`}
                      itemName={item.title}
                      redirectTo={`${adminPath}?notice=deleted`}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {items.map((item) => (
          <li key={item._id} className="rounded-lg bg-white p-4 shadow-card">
            <div className="flex gap-3">
              <Thumb src={item.image.image_url} alt="" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{item.title}</p>
                <div className="mt-1">
                  <Badge tone="neutral">{item.type}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {formatDate(item.createdAt)}
                </p>
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-1 border-t border-line pt-3">
              <EditLink
                href={`${adminPath}/${item._id}/edit`}
                name={item.title}
              />
              <DeleteButton
                endpoint={`${api}/${item._id}`}
                itemName={item.title}
                redirectTo={`${adminPath}?notice=deleted`}
              />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
