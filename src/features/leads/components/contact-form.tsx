"use client";

import { useActionState } from "react";
import { submitContactLead, type ActionState } from "../actions";

const initialState: ActionState = {};

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(
    submitContactLead,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      {/* Honeypot field (anti-spam, disembunyikan dari manusia) */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Jangan isi field ini:</label>
        <input
          type="text"
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {state.success && (
        <div className="rounded-lg border border-green-500/40 bg-green-500/10 p-4 text-sm text-green-800 dark:text-green-300">
          {state.message}
        </div>
      )}

      {state.success === false && state.message && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {state.message}
        </div>
      )}

      <div>
        <label htmlFor="nama" className="block text-sm font-medium">
          Nama Lengkap
        </label>
        <input
          id="nama"
          name="nama"
          type="text"
          required
          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          placeholder="Nama Anda atau perusahaan"
        />
        {state.errors?.nama && (
          <p className="mt-1 text-xs text-destructive">{state.errors.nama[0]}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Alamat Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            placeholder="nama@email.com"
          />
          {state.errors?.email && (
            <p className="mt-1 text-xs text-destructive">
              {state.errors.email[0]}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="whatsapp" className="block text-sm font-medium">
            Nomor WhatsApp
          </label>
          <input
            id="whatsapp"
            name="whatsapp"
            type="tel"
            required
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            placeholder="08123456789"
          />
          {state.errors?.whatsapp && (
            <p className="mt-1 text-xs text-destructive">
              {state.errors.whatsapp[0]}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="pesan" className="block text-sm font-medium">
          Rincian Pesanan / Pertanyaan
        </label>
        <textarea
          id="pesan"
          name="pesan"
          rows={4}
          required
          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          placeholder="Tuliskan jenis produk, perkiraan jumlah, atau desain yang Anda butuhkan..."
        />
        {state.errors?.pesan && (
          <p className="mt-1 text-xs text-destructive">
            {state.errors.pesan[0]}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50"
      >
        {isPending ? "Mengirim Pesan..." : "Kirim Pesan Sekarang"}
      </button>
    </form>
  );
}
