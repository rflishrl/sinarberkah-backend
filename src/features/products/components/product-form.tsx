"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircleIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";

import { ImageField } from "@/components/admin-kit/image-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSaveProduct } from "@/features/products/hooks";
import { PRODUCTS_ADMIN_PATH } from "@/features/products/queries";
import {
  productCreateSchema,
  type ProductDto,
  type ProductFormValues,
} from "@/features/products/schemas";
import { formatRupiah } from "@/lib/utils";

const Required = () => (
  <span aria-hidden="true" className="text-destructive">
    *
  </span>
);

/** Product create and edit form sharing validation schemas with API routes. */
export function ProductForm({ product }: { product?: ProductDto }) {
  const save = useSaveProduct(product?._id);
  const alertRef = useRef<HTMLDivElement>(null);
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productCreateSchema),
    defaultValues: {
      name: product?.name ?? "",
      category: product?.category ?? "",
      description: product?.description ?? "",
      price: product ? String(product.price) : "",
      image_url: product?.image.image_url ?? "",
      isActive: product?.isActive ?? true,
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
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="product-name">
                  Nama produk <Required />
                </FieldLabel>
                <Input
                  {...field}
                  id="product-name"
                  maxLength={120}
                  autoComplete="off"
                  required
                  aria-invalid={fieldState.invalid}
                  aria-describedby="product-name-error"
                  className="h-11 bg-card"
                />
                {fieldState.invalid && (
                  <FieldError
                    id="product-name-error"
                    errors={[fieldState.error]}
                  />
                )}
              </Field>
            )}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Controller
              name="price"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="product-price">
                    Harga (Rp) <Required />
                  </FieldLabel>
                  <Input
                    id="product-price"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={field.value === undefined ? "" : String(field.value)}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      field.onChange(digits === "" ? "" : Number(digits));
                    }}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    required
                    aria-invalid={fieldState.invalid}
                    aria-describedby="product-price-hint product-price-error"
                    placeholder="Contoh: 150000"
                    className="h-11 bg-card"
                  />
                  <FieldDescription id="product-price-hint">
                    {field.value
                      ? `Pratinjau: ${formatRupiah(Number(field.value))}`
                      : "Masukkan angka tanpa tanda titik atau koma."}
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError
                      id="product-price-error"
                      errors={[fieldState.error]}
                    />
                  )}
                </Field>
              )}
            />
            <Controller
              name="category"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="product-category">Kategori</FieldLabel>
                  <Input
                    {...field}
                    id="product-category"
                    maxLength={60}
                    aria-invalid={fieldState.invalid}
                    aria-describedby="product-category-hint product-category-error"
                    className="h-11 bg-card"
                  />
                  <FieldDescription id="product-category-hint">
                    Contoh: Pagar, Sketsel.
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError
                      id="product-category-error"
                      errors={[fieldState.error]}
                    />
                  )}
                </Field>
              )}
            />
          </div>

          <Controller
            name="description"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="product-description">Deskripsi</FieldLabel>
                <Textarea
                  {...field}
                  id="product-description"
                  rows={5}
                  maxLength={2000}
                  aria-invalid={fieldState.invalid}
                  aria-describedby="product-description-error"
                  className="bg-card"
                />
                {fieldState.invalid && (
                  <FieldError
                    id="product-description-error"
                    errors={[fieldState.error]}
                  />
                )}
              </Field>
            )}
          />

          <Controller
            name="isActive"
            control={form.control}
            render={({ field }) => (
              <Field orientation="horizontal" className="min-h-11">
                <Checkbox
                  id="product-active"
                  checked={field.value}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                  onBlur={field.onBlur}
                  aria-describedby="product-active-hint"
                  className="mt-0.5 size-5"
                />
                <FieldContent>
                  <FieldLabel htmlFor="product-active">
                    Tampilkan di website
                  </FieldLabel>
                  <FieldDescription id="product-active-hint">
                    Produk yang tidak ditampilkan tidak muncul di API publik.
                  </FieldDescription>
                </FieldContent>
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
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                folder="products"
                error={fieldState.error?.message}
              />
            )}
          />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button asChild variant="outline" size="lg" className="h-11 px-4">
          <Link href={PRODUCTS_ADMIN_PATH}>Batal</Link>
        </Button>
        <Button type="submit" size="lg" className="h-11 px-4" disabled={busy}>
          {busy
            ? "Menyimpan..."
            : product
              ? "Simpan perubahan"
              : "Tambah produk"}
        </Button>
      </div>
    </form>
  );
}
