import { portfolioResource } from "@/lib/resources";

// Portofolio. Alamat ini sama dengan yang dipakai frontend sekarang: GET /api/gallery/v1/portfolio
export const GET = portfolioResource.list;
export const POST = portfolioResource.create;
