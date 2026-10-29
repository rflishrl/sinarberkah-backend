import { patternsResource } from "@/lib/resources";

// Update bersifat parsial (hanya kolom yang dikirim), jadi hanya PATCH yang disediakan.
export const GET = patternsResource.get;
export const PATCH = patternsResource.update;
export const DELETE = patternsResource.remove;
