"use client";

import { useRef, useState } from "react";
import { MdDeleteOutline, MdUploadFile } from "react-icons/md";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { inputStyles } from "@/components/ui/input-styles";
import { ApiError, uploadPhoto } from "@/lib/client-api";

interface ImageFieldProps {
  value: string;
  onChange: (url: string) => void;
  /** Folder tujuan di penyimpanan: products | portfolio | patterns. */
  folder: "products" | "portfolio" | "patterns";
  required?: boolean;
  error?: string;
}

export function ImageField({
  value,
  onChange,
  folder,
  required,
  error,
}: ImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>();

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setUploadError(undefined);
    try {
      onChange(await uploadPhoto(file, folder));
    } catch (caught) {
      setUploadError(
        caught instanceof ApiError
          ? caught.message
          : "Foto gagal diunggah. Coba lagi.",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold">
        Foto
        {required && (
          <span aria-hidden="true" className="text-danger">
            {" "}
            *
          </span>
        )}
      </legend>

      <div className="relative aspect-[4/3] w-full max-w-md overflow-hidden rounded-md border border-line bg-white">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL bisa dari host mana saja
          <img
            src={value}
            alt="Pratinjau foto"
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center px-4 text-center text-sm text-muted">
            Belum ada foto
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          tabIndex={-1}
          aria-label="Pilih file foto"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
        <Button
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <MdUploadFile size={20} aria-hidden="true" />
          {uploading ? "Mengunggah..." : value ? "Ganti foto" : "Pilih foto"}
        </Button>
        {value && (
          <Button
            variant="ghost"
            onClick={() => onChange("")}
            disabled={uploading}
          >
            <MdDeleteOutline size={20} aria-hidden="true" />
            Hapus foto
          </Button>
        )}
      </div>
      <p className="text-sm text-muted">JPG, PNG, atau WebP. Maksimal 4 MB.</p>

      {uploadError && (
        <p role="alert" className="text-sm font-medium text-danger">
          {uploadError}
        </p>
      )}

      <Field
        label="Atau tempel alamat foto yang sudah diunggah"
        error={error}
        hint="Hanya alamat Vercel Blob (https://...public.blob.vercel-storage.com/...)."
      >
        {(fieldProps) => (
          <input
            {...fieldProps}
            type="url"
            inputMode="url"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="https://..."
            className={inputStyles}
          />
        )}
      </Field>
    </fieldset>
  );
}
