export type GalleryKind = "portfolio" | "pattern";

export interface GalleryKindConfig {
  /** Section title displayed in navigation and page headings. */
  title: string;
  /** Singular label for item actions and notifications. */
  singular: string;
  /** Entity name used in error messages. */
  label: string;
  /** Public API endpoint for frontend data fetching. */
  publicApi: string;
  /** Admin API endpoint for CRUD operations. */
  adminApi: string;
  /** Admin route path. */
  adminPath: string;
  uploadFolder: "portfolio" | "patterns";
  /** Frontend cache tag invalidated on mutations. */
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

/** Page size for admin data tables. */
export const ADMIN_PAGE_SIZE = 10;
/** Default page size for public queries. */
export const PUBLIC_PAGE_SIZE = 50;
