"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiError } from "@/lib/client-api";

/**
 * State bersama untuk form yang mengirim data ke API: status menyimpan, pesan error
 * umum, dan pesan per kolom. Setelah berhasil, pengguna diarahkan ke `redirectTo`.
 */
export function useApiForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function submit(send: () => Promise<unknown>, redirectTo: string) {
    setSaving(true);
    setFormError(undefined);
    setFieldErrors({});

    try {
      await send();
      router.push(redirectTo);
      router.refresh();
    } catch (caught) {
      if (caught instanceof ApiError) {
        setFormError(caught.message);
        setFieldErrors(caught.fieldErrors);
      } else {
        setFormError("Tidak dapat terhubung ke server. Periksa koneksi Anda.");
      }
      setSaving(false);
    }
  }

  const firstError = (key: string) => fieldErrors[key]?.[0];

  return { saving, formError, firstError, submit };
}
