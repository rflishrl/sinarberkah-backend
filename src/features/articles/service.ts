import "@/lib/server-only";

import { type Paginated, paginate } from "@/lib/api/types";

export interface ArticleDto {
  _id: string;
  title: string;
}

/**
 * Stub service returning empty article list for frontend compatibility.
 */
export async function listArticles(): Promise<Paginated<ArticleDto>> {
  return paginate([], 0, 1, 50);
}
