import type { ApiErrorBody } from "@/types";

/** Error dari API, lengkap dengan pesan per kolom (jika ada). */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly fieldErrors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => null)) as
    { data: T } | ApiErrorBody | null;

  if (!response.ok) {
    const error = body && "error" in body ? body.error : undefined;
    throw new ApiError(
      error?.message ?? "Permintaan gagal. Coba lagi.",
      response.status,
      error?.details?.fieldErrors ?? {},
    );
  }
  return (body as { data: T }).data;
}

export async function apiRequest<T>(
  url: string,
  options: { method: "POST" | "PUT" | "DELETE"; body?: unknown },
): Promise<T> {
  const response = await fetch(url, {
    method: options.method,
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  return parse<T>(response);
}

export async function uploadPhoto(file: File, folder: string): Promise<string> {
  const form = new FormData();
  form.set("file", file);
  form.set("folder", folder);
  const response = await fetch("/api/upload", { method: "POST", body: form });
  const { url } = await parse<{ url: string }>(response);
  return url;
}
