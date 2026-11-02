"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircleIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";

import { ImageField } from "@/components/admin-kit/image-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GALLERY_CONFIG, type GalleryKind } from "@/features/gallery/config";
import { useSaveGalleryItem } from "@/features/gallery/hooks";
import {
  galleryCreateSchema,
  type GalleryFormValues,
  type GalleryItemDto,
} from "@/features/gallery/schemas";

interface GalleryFormProps {
  kind: GalleryKind;
  item?: GalleryItemDto;
}

/** Form tambah/ubah untuk Portofolio dan Galeri Pola. Skema Zod-nya sama dengan route. */
export function GalleryForm({ kind, item }: GalleryFormProps) {
  const config = GALLERY_CONFIG[kind];
  const save = useSaveGalleryItem(kind, item?._id);
  const alertRef = useRef<HTMLDivElement>(null);

  const form = useForm<GalleryFormValues>({
    resolver: zodResolver(galleryCreateSchema),
    defaultValues: {
      title: item?.title ?? "",
      type: item?.type ?? "",
      description: item?.description ?? "",
      image_url: item?.image.image_url ?? "",
    },
  });

  useEffect(() => {
    if (save.error) alertRef.current?.focus();
  }, [save.error]);

  const busy = save.isPending || save.isSuccess;

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((values) => save.mutate(values))}
      className="space-y-6"
    >
      {save.error && (
        <Alert variant="destructive" ref={alertRef} tabIndex={-1}>
          <AlertCircleIcon aria-hidden="true" />
          <AlertDescription>{save.error.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <FieldGroup className="rounded-lg bg-card p-5 shadow-card sm:p-6">
          <Controller
            name="title"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="gallery-title">
                  Judul{" "}
                  <span aria-hidden="true" className="text-destructive">
                    *
                  </span>
                </FieldLabel>
                <Input
                  {...field}
                  id="gallery-title"
                  maxLength={120}
                  autoComplete="off"
                  required
                  aria-invalid={fieldState.invalid}
                  aria-describedby="gallery-title-hint gallery-title-error"
                  className="h-11 bg-card"
                />
                <FieldDescription id="gallery-title-hint">
                  {config.titleHint}
                </FieldDescription>
                {fieldState.invalid && (
                  <FieldError
                    id="gallery-title-error"
                    errors={[fieldState.error]}
                  />
                )}
              </Field>
            )}
          />

          <Controller
            name="type"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="gallery-type">
                  {config.typeLabel}{" "}
                  <span aria-hidden="true" className="text-destructive">
                    *
                  </span>
                </FieldLabel>
                <Input
                  {...field}
                  id="gallery-type"
                  maxLength={60}
                  autoComplete="off"
                  required
                  aria-invalid={fieldState.invalid}
                  aria-describedby="gallery-type-hint gallery-type-error"
                  className="h-11 bg-card"
                />
                <FieldDescription id="gallery-type-hint">
                  {config.typeHint}
                </FieldDescription>
                {fieldState.invalid && (
                  <FieldError
                    id="gallery-type-error"
                    errors={[fieldState.error]}
                  />
                )}
              </Field>
            )}
          />

          <Controller
            name="description"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="gallery-description">Deskripsi</FieldLabel>
                <Textarea
                  {...field}
                  id="gallery-description"
                  rows={5}
                  maxLength={1000}
                  aria-invalid={fieldState.invalid}
                  aria-describedby="gallery-description-error"
                  className="bg-card"
                />
                {fieldState.invalid && (
                  <FieldError
                    id="gallery-description-error"
                    errors={[fieldState.error]}
                  />
                )}
              </Field>
            )}
          />
        </FieldGroup>

        <div className="rounded-lg bg-card p-5 shadow-card sm:p-6">
          <Controller
            name="image_url"
            control={form.control}
            render={({ field, fieldState }) => (
              <ImageField
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                folder={config.uploadFolder}
                required
                error={fieldState.error?.message}
              />
            )}
          />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button asChild variant="outline" size="lg" className="h-11 px-4">
          <Link href={config.adminPath}>Batal</Link>
        </Button>
        <Button type="submit" size="lg" className="h-11 px-4" disabled={busy}>
          {busy
            ? "Menyimpan..."
            : item
              ? "Simpan perubahan"
              : `Tambah ${config.singular}`}
        </Button>
      </div>
    </form>
  );
}
