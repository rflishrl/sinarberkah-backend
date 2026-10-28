export type GalleryKind = "portfolio" | "pattern";

interface GalleryKindConfig {
  /** Judul di menu dan halaman. */
  title: string;
  /** Sebutan satu item, untuk tombol dan pesan. */
  singular: string;
  /** Alamat API (dipakai juga oleh frontend). */
  api: string;
  /** Alamat halaman admin. */
  adminPath: string;
  uploadFolder: "portfolio" | "patterns";
  typeLabel: string;
  typeHint: string;
  titleHint: string;
}

export const GALLERY_CONFIG: Record<GalleryKind, GalleryKindConfig> = {
  portfolio: {
    title: "Portofolio",
    singular: "proyek",
    api: "/api/gallery/v1/portfolio",
    adminPath: "/admin/portfolio",
    uploadFolder: "portfolio",
    typeLabel: "Jenis proyek",
    typeHint: "Contoh: Pagar, Railing, Kanopi, Sketsel.",
    titleHint: "Contoh: Pagar balkon motif daun.",
  },
  pattern: {
    title: "Galeri Pola",
    singular: "pola",
    api: "/api/gallery/v1",
    adminPath: "/admin/patterns",
    uploadFolder: "patterns",
    typeLabel: "Kode atau jenis pola",
    typeHint: "Contoh: LC 071, Geometris, Floral.",
    titleHint: "Contoh: Pola LC 071 - LC 075.",
  },
};
