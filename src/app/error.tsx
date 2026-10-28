"use client";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";

export default function AppError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 p-6">
      <h1 className="font-heading text-2xl font-bold">Terjadi kesalahan</h1>
      <Alert tone="error">
        Halaman tidak dapat dimuat. Jika Anda baru memasang proyek ini, pastikan
        file <code>.env.local</code> sudah diisi lengkap (lihat README).
      </Alert>
      <Button onClick={reset} className="self-start">
        Coba lagi
      </Button>
    </main>
  );
}
