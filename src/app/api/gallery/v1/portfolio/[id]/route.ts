import { portfolioResource } from "@/lib/resources";

// Update bersifat parsial (hanya kolom yang dikirim), jadi hanya PATCH yang disediakan.
export const GET = portfolioResource.get;
export const PATCH = portfolioResource.update;
export const DELETE = portfolioResource.remove;
