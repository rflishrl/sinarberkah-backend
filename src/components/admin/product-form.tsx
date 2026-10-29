"use client";

import { useState, type FormEvent } from "react";

import { ImageField } from "@/components/admin/image-field";
import { Button, ButtonLink } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { Field } from "@/components/ui/field";
import { inputStyles } from "@/components/ui/input-styles";
import { apiRequest } from "@/lib/client-api";
import { useApiForm } from "@/lib/use-api-form";
import type { ProductDto } from "@/types";

const API = "/api/products/v1";
const LIST = "/admin/products";

export function ProductForm({ product }: { product?: ProductDto }) {
  const [name, setName] = useState(product?.name ?? "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [imageUrl, setImageUrl] = useState(product?.image.image_url ?? "");
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const { saving, formError, firstError, submit } = useApiForm();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      name,
      category,
      description,
      price: price === "" ? undefined : Number(price),
      // Foto hanya dikirim jika berubah, supaya produk lama yang fotonya di luar
      // Vercel Blob tetap bisa disunting tanpa harus mengganti foto.
      ...(product?.image.image_url === imageUrl ? {} : { image_url: imageUrl }),
      isActive,
    };

    void submit(
      () =>
        product
          ? apiRequest(`${API}/${product._id}`, {
              method: "PATCH",
              body: payload,
            })
          : apiRequest(API, { method: "POST", body: payload }),
      `${LIST}?notice=${product ? "updated" : "created"}`,
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {formError && <Alert tone="error">{formError}</Alert>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <div className="space-y-5 rounded-lg bg-white p-5 shadow-card sm:p-6">
          <Field label="Nama produk" required error={firstError("name")}>
            {(props) => (
              <input
                {...props}
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={120}
                autoComplete="off"
                className={inputStyles}
              />
            )}
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Harga (Rp)" required error={firstError("price")}>
              {(props) => (
                <input
                  {...props}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  className={inputStyles}
                />
              )}
            </Field>
            <Field
              label="Kategori"
              hint="Contoh: Pagar, Sketsel."
              error={firstError("category")}
            >
              {(props) => (
                <input
                  {...props}
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  maxLength={60}
                  className={inputStyles}
                />
              )}
            </Field>
          </div>

          <Field label="Deskripsi" error={firstError("description")}>
            {(props) => (
              <textarea
                {...props}
                rows={5}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={2000}
                className={inputStyles}
              />
            )}
          </Field>

          <label className="flex min-h-11 cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="mt-1 size-5 accent-ink"
            />
            <span>
              <span className="block text-sm font-semibold">
                Tampilkan di website
              </span>
              <span className="block text-sm text-muted">
                Produk yang tidak ditampilkan tidak muncul di API publik.
              </span>
            </span>
          </label>
        </div>

        <div className="rounded-lg bg-white p-5 shadow-card sm:p-6">
          <ImageField
            value={imageUrl}
            onChange={setImageUrl}
            folder="products"
            error={firstError("image_url")}
          />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <ButtonLink href={LIST} variant="secondary">
          Batal
        </ButtonLink>
        <Button type="submit" disabled={saving}>
          {saving
            ? "Menyimpan..."
            : product
              ? "Simpan perubahan"
              : "Tambah produk"}
        </Button>
      </div>
    </form>
  );
}
