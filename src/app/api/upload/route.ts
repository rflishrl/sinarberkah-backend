import { uploadImage } from "@/lib/blob";
import { HttpError, ok, requireAdmin, route } from "@/lib/http";

const FOLDERS = new Set(["products", "portfolio", "patterns"]);

/** Unggah satu foto (multipart/form-data: `file`, `folder`) lalu kembalikan URL publiknya. */
export const POST = route(async (request: Request) => {
  await requireAdmin(request);

  const form = await request.formData().catch(() => {
    throw new HttpError(400, "Body harus berupa multipart/form-data.");
  });
  const file = form.get("file");
  const folder = String(form.get("folder") ?? "");

  if (!(file instanceof File))
    throw new HttpError(400, "File foto wajib dikirim.");
  if (!FOLDERS.has(folder))
    throw new HttpError(400, "Folder tujuan tidak valid.");

  const url = await uploadImage(file, `sinarberkah/${folder}`);
  return ok({ url }, { status: 201 });
});
