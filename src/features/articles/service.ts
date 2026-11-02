import "server-only";

import { paginate, type Paginated } from "@/lib/api/types";

export interface ArticleDto {
  _id: string;
  title: string;
}

/**
 * Fitur artikel belum dibuat. Frontend sudah memanggil alamatnya, jadi daftarnya
 * selalu kosong. Belum ada tabel, jadi belum ada repository.
 */
export async function listArticles(): Promise<Paginated<ArticleDto>> {
  return paginate([], 0, 1, 50);
}
