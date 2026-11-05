import "server-only";

import { paginate, type Paginated } from "@/lib/api/types";

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
