import Link from "next/link";
import type { ReactNode } from "react";
import { MdChevronLeft, MdChevronRight, MdSearch } from "react-icons/md";

import { buttonStyles } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { inputStyles } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="font-heading text-2xl font-extrabold sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-2xl text-muted">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

const NOTICES: Record<string, string> = {
  created: "Berhasil ditambahkan.",
  updated: "Perubahan berhasil disimpan.",
  deleted: "Berhasil dihapus.",
};

export function NoticeBanner({ notice }: { notice?: string }) {
  const message = notice ? NOTICES[notice] : undefined;
  if (!message) return null;
  return (
    <Alert tone="success" className="mb-4">
      {message}
    </Alert>
  );
}

/** Kolom pencarian berbasis formulir GET, jadi berfungsi tanpa JavaScript. */
export function SearchForm({
  defaultValue,
  placeholder,
}: {
  defaultValue: string;
  placeholder: string;
}) {
  return (
    <form role="search" className="mb-4 flex gap-2">
      <div className="relative flex-1 sm:max-w-sm">
        <label htmlFor="q" className="sr-only">
          Cari
        </label>
        <MdSearch
          size={20}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
        />
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className={cn(inputStyles, "pl-10")}
        />
      </div>
      <button type="submit" className={buttonStyles("secondary")}>
        Cari
      </button>
    </form>
  );
}

export function Pagination({
  page,
  totalPages,
  total,
  basePath,
  q,
}: {
  page: number;
  totalPages: number;
  total: number;
  basePath: string;
  q: string;
}) {
  const href = (target: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (target > 1) params.set("page", String(target));
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  return (
    <nav
      aria-label="Halaman"
      className="mt-4 flex items-center justify-between gap-3 text-sm text-muted"
    >
      <p>
        {total} data &middot; halaman {page} dari {totalPages}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link
            href={href(page - 1)}
            className={buttonStyles("secondary")}
            rel="prev"
          >
            <MdChevronLeft size={20} aria-hidden="true" />
            Sebelumnya
          </Link>
        ) : null}
        {page < totalPages ? (
          <Link
            href={href(page + 1)}
            className={buttonStyles("secondary")}
            rel="next"
          >
            Berikutnya
            <MdChevronRight size={20} aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
