import { createResource } from "@/lib/crud";
import { galleryRepository, productsRepository } from "@/lib/repositories";
import {
  galleryInput,
  galleryUpdateInput,
  productInput,
  productUpdateInput,
} from "@/lib/validation";

/** Produk. Pembaca publik hanya melihat produk yang aktif. */
export const productsResource = createResource({
  label: "Produk",
  repository: productsRepository,
  createSchema: productInput,
  updateSchema: productUpdateInput,
  hasPublicFilter: true,
  revalidateTags: ["products"],
});

/** Portofolio: foto proyek yang pernah dikerjakan. */
export const portfolioResource = createResource({
  label: "Portofolio",
  repository: galleryRepository("portfolio"),
  createSchema: galleryInput,
  updateSchema: galleryUpdateInput,
  revalidateTags: ["portfolio"],
});

/** Galeri pola ornamen. */
export const patternsResource = createResource({
  label: "Pola",
  repository: galleryRepository("pattern"),
  createSchema: galleryInput,
  updateSchema: galleryUpdateInput,
  revalidateTags: ["gallery"],
});
