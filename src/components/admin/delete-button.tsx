"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { MdDeleteOutline } from "react-icons/md";

import { Button } from "@/components/ui/button";
import { ApiError, apiRequest } from "@/lib/client-api";

interface DeleteButtonProps {
  /** Alamat API untuk menghapus, mis. /api/products/v1/abc123 */
  endpoint: string;
  /** Nama item untuk teks konfirmasi dan label tombol. */
  itemName: string;
  /** Halaman tujuan setelah berhasil dihapus. */
  redirectTo: string;
}

export function DeleteButton({
  endpoint,
  itemName,
  redirectTo,
}: DeleteButtonProps) {
  const router = useRouter();
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string>();

  async function confirmDelete() {
    setDeleting(true);
    setError(undefined);
    try {
      await apiRequest(endpoint, { method: "DELETE" });
      dialogRef.current?.close();
      router.push(redirectTo);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Gagal menghapus. Coba lagi.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        className="text-danger hover:bg-danger-soft"
        aria-label={`Hapus ${itemName}`}
        onClick={() => {
          setError(undefined);
          dialogRef.current?.showModal();
        }}
      >
        <MdDeleteOutline size={20} aria-hidden="true" />
        <span className="hidden sm:inline">Hapus</span>
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg p-0 shadow-xl backdrop:bg-black/50"
      >
        <div className="space-y-4 p-6">
          <h2 id={titleId} className="font-heading text-lg font-bold">
            Hapus &ldquo;{itemName}&rdquo;?
          </h2>
          <p className="text-muted">
            Data dan fotonya akan dihapus permanen dan tidak bisa dikembalikan.
          </p>
          {error && (
            <p role="alert" className="text-sm font-medium text-danger">
              {error}
            </p>
          )}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              onClick={() => dialogRef.current?.close()}
              disabled={deleting}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? "Menghapus..." : "Ya, hapus"}
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
