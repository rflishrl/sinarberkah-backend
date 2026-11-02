export type GalleryKind = "portfolio" | "pattern";

export interface GalleryKindConfig {
  /** Judul di menu dan halaman. */
  title: string;
  /** Sebutan satu item, untuk tombol dan pesan. */
  singular: string;
  /** Nama untuk pesan error, mis. "Pola tidak ditemukan." */
  label: string;
  /** API publik (dibaca frontend). */
  publicApi: string;
  /** API admin (dibaca dan ditulis panel admin). */
  adminApi: string;
  /** Alamat halaman admin. */
  adminPath: string;
  uploadFolder: "portfolio" | "patterns";
  /** Tag cache di frontend yang dibuang saat data ini berubah. */
  revalidateTags: string[];
  typeLabel: string;
  typeHint: string;
  titleHint: string;
}

export const GALLERY_CONFIG: Record<GalleryKind, GalleryKindConfig> = {
  portfolio: {
    title: "Portofolio",
    singular: "proyek",
    label: "Portofolio",
    publicApi: "/api/gallery/v1/portfolio",
    adminApi: "/api/admin/portfolio",
    adminPath: "/admin/portfolio",
    uploadFolder: "portfolio",
    revalidateTags: ["portfolio"],
    typeLabel: "Jenis proyek",
    typeHint: "Contoh: Pagar, Railing, Kanopi, Sketsel.",
    titleHint: "Contoh: Pagar balkon motif daun.",
  },
  pattern: {
    title: "Galeri Pola",
    singular: "pola",
    label: "Pola",
    publicApi: "/api/gallery/v1",
    adminApi: "/api/admin/patterns",
    adminPath: "/admin/patterns",
    uploadFolder: "patterns",
    revalidateTags: ["gallery"],
    typeLabel: "Kode atau jenis pola",
    typeHint: "Contoh: LC 071, Geometris, Floral.",
    titleHint: "Contoh: Pola LC 071 - LC 075.",
  },
};

/** Jumlah baris per halaman di panel admin. */
export const ADMIN_PAGE_SIZE = 10;
/** Jumlah baris bawaan untuk API publik. */
export const PUBLIC_PAGE_SIZE = 50;
