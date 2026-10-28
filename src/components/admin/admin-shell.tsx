"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useState, type ReactNode } from "react";
import {
  MdClose,
  MdDashboard,
  MdGridView,
  MdInventory2,
  MdLogout,
  MdMenu,
  MdPhotoLibrary,
} from "react-icons/md";
import type { IconType } from "react-icons";

import { cn } from "@/lib/utils";

const NAV_ITEMS: { label: string; href: string; icon: IconType }[] = [
  { label: "Dashboard", href: "/admin", icon: MdDashboard },
  { label: "Produk", href: "/admin/products", icon: MdInventory2 },
  { label: "Portofolio", href: "/admin/portfolio", icon: MdPhotoLibrary },
  { label: "Galeri Pola", href: "/admin/patterns", icon: MdGridView },
];

function isActive(pathname: string, href: string) {
  return href === "/admin"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({
  email,
  children,
}: {
  email: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const menuId = useId();
  const [openPath, setOpenPath] = useState<string | null>(null);
  // Menu seluler menutup sendiri saat pindah halaman.
  const menuOpen = openPath === pathname;

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenPath(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const nav = (
    <nav aria-label="Menu admin">
      <ul className="space-y-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-md border-l-4 px-3 text-sm font-semibold transition-colors duration-200 motion-reduce:transition-none",
                  active
                    ? "border-brand bg-white/10 text-white"
                    : "border-transparent text-[#d2d2d2] hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon size={22} aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  const account = (
    <div className="space-y-2 border-t border-white/10 pt-4">
      <p className="truncate px-3 text-sm text-[#d2d2d2]" title={email}>
        {email}
      </p>
      <button
        type="button"
        onClick={logout}
        className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-md border-l-4 border-transparent px-3 text-sm font-semibold text-[#d2d2d2] transition-colors duration-200 hover:bg-white/5 hover:text-white motion-reduce:transition-none"
      >
        <MdLogout size={22} aria-hidden="true" />
        Keluar
      </button>
    </div>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      {/* Desktop: sidebar tetap */}
      <aside className="hidden bg-ink p-5 text-white on-dark lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:justify-between">
        <div className="space-y-8">
          <Brand />
          {nav}
        </div>
        {account}
      </aside>

      {/* Mobile dan tablet: bar atas + menu */}
      <header className="sticky top-0 z-40 bg-ink text-white on-dark lg:hidden">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <Brand />
          <button
            type="button"
            className="-mr-2 inline-flex size-11 cursor-pointer items-center justify-center rounded-md"
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setOpenPath(menuOpen ? null : pathname)}
          >
            {menuOpen ? <MdClose size={26} /> : <MdMenu size={26} />}
          </button>
        </div>
        <div
          id={menuId}
          hidden={!menuOpen}
          className="space-y-4 border-t border-white/10 p-4 sm:px-6"
        >
          {nav}
          {account}
        </div>
      </header>

      <main
        id="main-content"
        className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-10"
      >
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="inline-flex size-9 items-center justify-center rounded-md bg-brand font-heading text-lg font-extrabold text-ink"
      >
        SB
      </span>
      <span className="font-heading text-base leading-tight font-extrabold tracking-wide uppercase">
        Sinar Berkah
        <span className="block text-xs font-semibold tracking-normal text-[#d2d2d2] normal-case">
          Panel Admin
        </span>
      </span>
    </Link>
  );
}
