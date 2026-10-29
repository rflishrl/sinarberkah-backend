"use client";

import { useState, type FormEvent } from "react";

import { ImageField } from "@/components/admin/image-field";
import { Button, ButtonLink } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { Field } from "@/components/ui/field";
import { inputStyles } from "@/components/ui/input-styles";
import { apiRequest } from "@/lib/client-api";
import { GALLERY_CONFIG, type GalleryKind } from "@/lib/gallery-config";
import { useApiForm } from "@/lib/use-api-form";
import type { GalleryItemDto } from "@/types";

interface GalleryFormProps {
  kind: GalleryKind;
  item?: GalleryItemDto;
}

/** Form tambah/ubah untuk Portofolio dan Galeri Pola (bentuk datanya sama). */
export function GalleryForm({ kind, item }: GalleryFormProps) {
  const config = GALLERY_CONFIG[kind];
  const [title, setTitle] = useState(item?.title ?? "");
  const [type, setType] = useState(item?.type ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [imageUrl, setImageUrl] = useState(item?.image.image_url ?? "");
  const { saving, formError, firstError, submit } = useApiForm();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      title,
      type,
      description,
      // Foto hanya dikirim jika berubah (lihat catatan di product-form.tsx).
      ...(item?.image.image_url === imageUrl ? {} : { image_url: imageUrl }),
    };

    void submit(
      () =>
        item
          ? apiRequest(`${config.api}/${item._id}`, {
              method: "PATCH",
              body: payload,
            })
          : apiRequest(config.api, { method: "POST", body: payload }),
      `${config.adminPath}?notice=${item ? "updated" : "created"}`,
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {formError && <Alert tone="error">{formError}</Alert>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <div className="space-y-5 rounded-lg bg-white p-5 shadow-card sm:p-6">
          <Field
            label="Judul"
            required
            hint={config.titleHint}
            error={firstError("title")}
          >
            {(props) => (
              <input
                {...props}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={120}
                autoComplete="off"
                className={inputStyles}
              />
            )}
          </Field>
          <Field
            label={config.typeLabel}
            required
            hint={config.typeHint}
            error={firstError("type")}
          >
            {(props) => (
              <input
                {...props}
                value={type}
                onChange={(event) => setType(event.target.value)}
                maxLength={60}
                autoComplete="off"
                className={inputStyles}
              />
            )}
          </Field>
          <Field label="Deskripsi" error={firstError("description")}>
            {(props) => (
              <textarea
                {...props}
                rows={5}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={1000}
                className={inputStyles}
              />
            )}
          </Field>
        </div>

        <div className="rounded-lg bg-white p-5 shadow-card sm:p-6">
          <ImageField
            value={imageUrl}
            onChange={setImageUrl}
            folder={config.uploadFolder}
            required
            error={firstError("image_url")}
          />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <ButtonLink href={config.adminPath} variant="secondary">
          Batal
        </ButtonLink>
        <Button type="submit" disabled={saving}>
          {saving
            ? "Menyimpan..."
            : item
              ? "Simpan perubahan"
              : `Tambah ${config.singular}`}
        </Button>
      </div>
    </form>
  );
}
