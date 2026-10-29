import { productsResource } from "@/lib/resources";

// Update bersifat parsial (hanya kolom yang dikirim), jadi hanya PATCH yang disediakan.
export const GET = productsResource.get;
export const PATCH = productsResource.update;
export const DELETE = productsResource.remove;
